/**
 * Kafka event CONSUMERS — the counterpart to `src/lib/events.ts`.
 *
 * On Cloudflare Workers there is no long-running consumer group; instead the
 * Kafka HTTP gateway (Confluent sink connector, Upstash, custom relay) pushes
 * each record to `POST /api/public/events/consume`, which calls
 * `dispatchEvent(envelope)` below. In local dev — when `KAFKA_REST_URL` is
 * unset — `publishEvent` invokes the dispatcher in-process so the same
 * handlers run without a broker.
 *
 * ── Idempotency & deduplication ────────────────────────────────────────────
 * The producer is at-least-once, so the same record may arrive multiple
 * times AND a retried producer may re-mint the envelope with a fresh UUID.
 * We defend against both:
 *
 *   1. Envelope-ID dedup (TTL LRU) — drops exact retransmits of the same
 *      record from the broker / HTTP sink.
 *   2. Business-key dedup (TTL LRU) — hash(topic:type:key:data) catches
 *      producer retries that generated a new envelope.id for the same
 *      logical event (e.g. double-click "Add to bag").
 *   3. Per-key async lock — serializes concurrent deliveries of the same
 *      partition key so two handler runs can't interleave and both write.
 *
 * Swap the in-memory Maps for Redis / Upstash `SET NX EX` in production —
 * the interface (`seen()`, `withKeyLock()`) stays the same.
 */

import type { EventEnvelope, EventTopic } from "./events";

// ---------- TTL LRU used for both dedup layers ------------------------------

const DEDUP_TTL_MS = 24 * 60 * 60 * 1000; // 24h — covers any realistic retry window
const MAX_ENTRIES = 20_000;

class TtlLru {
  private map = new Map<string, number>(); // key → expiresAt
  has(key: string): boolean {
    const exp = this.map.get(key);
    if (exp === undefined) return false;
    if (exp < Date.now()) {
      this.map.delete(key);
      return false;
    }
    // refresh LRU order
    this.map.delete(key);
    this.map.set(key, exp);
    return true;
  }
  add(key: string, ttlMs = DEDUP_TTL_MS): void {
    if (this.map.size >= MAX_ENTRIES) {
      // drop oldest ~1000 to amortize
      const it = this.map.keys();
      for (let i = 0; i < 1000; i++) {
        const k = it.next().value as string | undefined;
        if (!k) break;
        this.map.delete(k);
      }
    }
    this.map.set(key, Date.now() + ttlMs);
  }
}

const seenIds = new TtlLru();          // layer 1: envelope.id
const seenBusinessKeys = new TtlLru(); // layer 2: hash(topic:type:key:data)

// ---------- Per-key async lock (serialize same-key deliveries) --------------

const keyLocks = new Map<string, Promise<void>>();

async function withKeyLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = keyLocks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => (release = r));
  keyLocks.set(key, prev.then(() => next));
  try {
    await prev;
    return await fn();
  } finally {
    release();
    // GC: only clear if we're still the tail
    if (keyLocks.get(key) === prev.then(() => next)) keyLocks.delete(key);
  }
}

// ---------- Stable business-key hash (FNV-1a 32-bit, edge-safe) -------------

function businessKey(env: EventEnvelope): string {
  const payload = `${env.topic}|${env.type}|${env.key}|${stableStringify(env.data)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return `${env.topic}:${env.type}:${env.key}:${h.toString(16)}`;
}

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`)
    .join(",")}}`;
}

// ---------- Handler map ------------------------------------------------------

type Handler = (env: EventEnvelope) => Promise<void> | void;

const handlers: Record<EventTopic, Record<string, Handler>> = {
  "allstag.orders.v1": {
    "order.created": async (e) => {
      const d = e.data as { orderId: string; email?: string; total?: number };
      console.log(`[orders] created ${d.orderId} — queuing confirmation email`);
      await enqueueEmail({ to: d.email, template: "order-created", data: d });
    },
    "order.paid": async (e) => {
      const d = e.data as { orderId: string; items?: Array<{ handle: string; qty: number }> };
      console.log(`[orders] paid ${d.orderId} — decrementing inventory`);
      for (const it of d.items ?? []) {
        await dispatchEvent({
          ...e,
          id: crypto.randomUUID(),
          topic: "allstag.inventory.v1",
          type: "inventory.reserved",
          key: it.handle,
          data: { handle: it.handle, delta: -it.qty, orderId: d.orderId },
        });
      }
    },
    "order.fulfilled": async (e) => {
      const d = e.data as { orderId: string; tracking?: string; email?: string };
      await enqueueEmail({ to: d.email, template: "order-fulfilled", data: d });
    },
  },

  "allstag.cart.v1": {
    "cart.item_added": (e) => {
      const d = e.data as { userId: string; handle: string; qty: number };
      console.log(`[cart] +${d.qty} ${d.handle} for ${d.userId} — updating recs`);
    },
    "cart.item_removed": (e) => {
      const d = e.data as { userId: string; handle: string };
      console.log(`[cart] − ${d.handle} for ${d.userId}`);
    },
    "cart.abandoned": async (e) => {
      const d = e.data as { userId: string; email?: string; items: unknown[] };
      await enqueueEmail({ to: d.email, template: "cart-abandoned", data: d });
    },
  },

  "allstag.inventory.v1": {
    "inventory.reserved": (e) => {
      const d = e.data as { handle: string; delta: number };
      console.log(`[inventory] ${d.handle} ${d.delta > 0 ? "+" : ""}${d.delta}`);
      // TODO: UPDATE public.products SET stock = stock + $delta WHERE handle = $handle
    },
    "inventory.restocked": (e) => {
      const d = e.data as { handle: string; delta: number };
      console.log(`[inventory] restock ${d.handle} +${d.delta}`);
    },
  },

  "allstag.users.v1": {
    "user.signed_up": async (e) => {
      const d = e.data as { userId: string; email: string };
      console.log(`[users] welcome ${d.email}`);
      await enqueueEmail({ to: d.email, template: "welcome", data: d });
    },
    "user.updated": (e) => {
      console.log(`[users] profile updated ${e.key}`);
      // TODO: sync to CRM
    },
  },

  "allstag.emails.v1": {
    "email.queued": async (e) => {
      const d = e.data as { to: string; template: string; data: unknown };
      await sendEmail(d);
    },
  },

  "allstag.audit.v1": {
    "*": (e) => {
      console.log(`[audit] ${e.type} by ${e.key}`, e.data);
    },
  },
};

// ---------- Dispatcher -------------------------------------------------------

export async function dispatchEvent(envelope: EventEnvelope): Promise<void> {
  // Layer 1 — same envelope arriving twice from the broker/HTTP sink.
  if (seenIds.has(envelope.id)) {
    console.log(`[consume:dedup:id] ${envelope.topic}:${envelope.type} ${envelope.id}`);
    return;
  }

  // Layer 3 — serialize per partition key so two concurrent deliveries of
  // the same logical event can't both slip past the layer-2 check.
  return withKeyLock(`${envelope.topic}:${envelope.key}`, async () => {
    // Re-check inside the lock (another waiter may have processed it).
    if (seenIds.has(envelope.id)) return;

    // Layer 2 — producer retried with a fresh id but same business payload.
    const bkey = businessKey(envelope);
    if (seenBusinessKeys.has(bkey)) {
      console.log(`[consume:dedup:business] ${bkey} (id=${envelope.id})`);
      seenIds.add(envelope.id); // remember this alias too
      return;
    }

    const topic = handlers[envelope.topic];
    if (!topic) {
      console.warn(`[consume] no handler for topic ${envelope.topic}`);
      return;
    }
    const fn = topic[envelope.type] ?? topic["*"];
    if (!fn) {
      console.warn(`[consume] no handler for ${envelope.topic}:${envelope.type}`);
      return;
    }

    try {
      await fn(envelope);
      // Only mark as processed AFTER successful handling so failures retry.
      seenIds.add(envelope.id);
      seenBusinessKeys.add(bkey);
    } catch (err) {
      console.error(
        `[consume:dlq] ${envelope.topic}:${envelope.type} ${envelope.id}`,
        err,
      );
      throw err; // let the HTTP caller retry / route to DLQ
    }
  });
}

// ---------- Email side-effect (Resend stub) ---------------------------------

async function enqueueEmail(opts: { to?: string; template: string; data: unknown }) {
  if (!opts.to) return;
  // Re-publishing keeps the flow observable in Kafka; in prod the emails
  // topic is drained by a Resend worker.
  const { publishEvent } = await import("./events");
  await publishEvent({
    topic: "allstag.emails.v1",
    type: "email.queued",
    key: opts.to,
    data: opts,
  });
}

async function sendEmail(opts: { to: string; template: string; data: unknown }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email:local] ${opts.template} → ${opts.to}`);
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: "Allstag <hello@allstag.co>",
      to: opts.to,
      subject: subjectFor(opts.template),
      text: JSON.stringify(opts.data, null, 2),
    }),
  });
}

function subjectFor(t: string) {
  switch (t) {
    case "order-created": return "Your Allstag order is in ✦";
    case "order-fulfilled": return "Your order is on the way";
    case "cart-abandoned": return "Still thinking it over?";
    case "welcome": return "Welcome to Allstag";
    default: return "Allstag";
  }
}
