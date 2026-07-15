/**
 * Redis cache layer — edge-compatible via Upstash REST API.
 *
 * Cloudflare Workers can't hold raw TCP to a Redis node, so we speak HTTP to
 * Upstash (or any REST-compatible Redis: Vercel KV, Fly Upstash, self-hosted
 * `webdis`). Falls back to a TTL-aware in-memory Map when `REDIS_REST_URL`
 * is unset so local dev works with no Redis running.
 *
 * Primary uses in this app:
 *   • Cache PLP/PDP reads (`products:list`, `product:<handle>`) — TTL 60s.
 *   • Idempotency store for the Razorpay webhook keyed on `razorpay_payment_id`.
 *   • Kafka consumer dedup (envelope.id, business-key hash) — replaces the
 *     in-memory `TtlLru` in `src/lib/consumers.ts` for horizontal scale.
 *   • Rate-limit counters for `/api/**` (INCR + EXPIRE).
 *
 * Contract kept intentionally small so the local fallback and the Upstash
 * backend implement the same three primitives:
 *   get(key), set(key, value, ttlSec?), setNx(key, value, ttlSec?), incr(key)
 */

type RedisValue = string | number;

interface RedisBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: RedisValue, ttlSec?: number): Promise<void>;
  /** SET key value NX EX ttl — returns true if the key was newly set. */
  setNx(key: string, value: RedisValue, ttlSec?: number): Promise<boolean>;
  incr(key: string, ttlSec?: number): Promise<number>;
  del(key: string): Promise<void>;
}

// ---------- In-memory fallback (dev / no REDIS_REST_URL) --------------------

class MemoryRedis implements RedisBackend {
  private store = new Map<string, { v: string; exp: number }>();

  private alive(key: string) {
    const rec = this.store.get(key);
    if (!rec) return null;
    if (rec.exp && rec.exp < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return rec;
  }

  async get(key: string) {
    return this.alive(key)?.v ?? null;
  }
  async set(key: string, value: RedisValue, ttlSec?: number) {
    this.store.set(key, {
      v: String(value),
      exp: ttlSec ? Date.now() + ttlSec * 1000 : 0,
    });
  }
  async setNx(key: string, value: RedisValue, ttlSec?: number) {
    if (this.alive(key)) return false;
    await this.set(key, value, ttlSec);
    return true;
  }
  async incr(key: string, ttlSec?: number) {
    const cur = Number((await this.get(key)) ?? 0) + 1;
    await this.set(key, cur, ttlSec);
    return cur;
  }
  async del(key: string) {
    this.store.delete(key);
  }
}

// ---------- Upstash REST backend --------------------------------------------

class UpstashRedis implements RedisBackend {
  constructor(private url: string, private token: string) {}

  private async call(cmd: (string | number)[]): Promise<unknown> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(cmd),
    });
    if (!res.ok) throw new Error(`[redis] ${res.status} ${await res.text()}`);
    const body = (await res.json()) as { result?: unknown; error?: string };
    if (body.error) throw new Error(`[redis] ${body.error}`);
    return body.result;
  }

  async get(key: string) {
    const r = (await this.call(["GET", key])) as string | null;
    return r ?? null;
  }
  async set(key: string, value: RedisValue, ttlSec?: number) {
    const cmd: (string | number)[] = ["SET", key, String(value)];
    if (ttlSec) cmd.push("EX", ttlSec);
    await this.call(cmd);
  }
  async setNx(key: string, value: RedisValue, ttlSec?: number) {
    const cmd: (string | number)[] = ["SET", key, String(value), "NX"];
    if (ttlSec) cmd.push("EX", ttlSec);
    const r = await this.call(cmd);
    return r === "OK";
  }
  async incr(key: string, ttlSec?: number) {
    const n = (await this.call(["INCR", key])) as number;
    if (ttlSec && n === 1) await this.call(["EXPIRE", key, ttlSec]);
    return n;
  }
  async del(key: string) {
    await this.call(["DEL", key]);
  }
}

// ---------- Singleton picker -------------------------------------------------

let client: RedisBackend | null = null;

export function redis(): RedisBackend {
  if (client) return client;
  const url = process.env.REDIS_REST_URL;
  const token = process.env.REDIS_REST_TOKEN;
  if (url && token) {
    client = new UpstashRedis(url, token);
    console.log("[redis] using Upstash REST backend");
  } else {
    client = new MemoryRedis();
    console.log("[redis] no REDIS_REST_URL — falling back to in-memory cache");
  }
  return client;
}

// ---------- Sugar: JSON cache with stampede-safe read-through ---------------

export async function cached<T>(
  key: string,
  ttlSec: number,
  loader: () => Promise<T>,
): Promise<T> {
  const r = redis();
  const hit = await r.get(key);
  if (hit) {
    try {
      return JSON.parse(hit) as T;
    } catch {
      // fall through — corrupt entry, refresh it
    }
  }
  const fresh = await loader();
  await r.set(key, JSON.stringify(fresh), ttlSec);
  return fresh;
}

/** Invalidate one or many keys after a write. */
export async function invalidate(...keys: string[]) {
  const r = redis();
  await Promise.all(keys.map((k) => r.del(k)));
}
