/**
 * Kafka event publisher — edge-compatible.
 *
 * Cloudflare Workers cannot open raw TCP to Kafka brokers, so we publish over
 * the Confluent REST Proxy / Kafka HTTP bridge (any HTTP → Kafka gateway
 * works: Confluent Cloud REST, Redpanda HTTP Proxy, Upstash Kafka REST, AWS
 * MSK Serverless via API Gateway, etc.).
 *
 * Topics (see README §11):
 *   allstag.orders.v1        — order lifecycle (created, paid, fulfilled…)
 *   allstag.cart.v1          — cart mutations for personalization
 *   allstag.inventory.v1     — stock deltas from checkout / restock
 *   allstag.users.v1         — signup, profile updates
 *   allstag.emails.v1        — outbound transactional email jobs
 *   allstag.audit.v1         — admin actions, RBAC changes
 *
 * Every event carries an envelope so consumers can evolve independently.
 */

export type EventTopic =
  | "allstag.orders.v1"
  | "allstag.cart.v1"
  | "allstag.inventory.v1"
  | "allstag.users.v1"
  | "allstag.emails.v1"
  | "allstag.audit.v1";

export interface EventEnvelope<T = unknown> {
  id: string;              // uuid — idempotency key for consumers
  type: string;            // e.g. "order.paid"
  topic: EventTopic;
  key: string;             // partition key (userId, orderId…)
  occurredAt: string;      // ISO-8601
  source: "web" | "webhook" | "cron" | "admin";
  version: 1;
  data: T;
}

interface PublishOptions {
  topic: EventTopic;
  type: string;
  key: string;
  data: unknown;
  source?: EventEnvelope["source"];
}

/**
 * Publish an event to Kafka via the configured REST proxy.
 * Silently degrades to console when KAFKA_REST_URL is unset (local dev).
 */
export async function publishEvent(opts: PublishOptions): Promise<void> {
  const envelope: EventEnvelope = {
    id: crypto.randomUUID(),
    type: opts.type,
    topic: opts.topic,
    key: opts.key,
    occurredAt: new Date().toISOString(),
    source: opts.source ?? "web",
    version: 1,
    data: opts.data,
  };

  const restUrl = process.env.KAFKA_REST_URL;
  const auth = process.env.KAFKA_REST_AUTH; // "Basic <base64>" or "Bearer <token>"

  if (!restUrl) {
    console.log("[events:local]", envelope.topic, envelope.type, envelope.id);
    // Local dev / no broker: fan out to in-process consumers so the same
    // handlers exercise as they would in production.
    const { dispatchEvent } = await import("./consumers");
    await dispatchEvent(envelope);
    return;
  }

  const res = await fetch(`${restUrl}/topics/${envelope.topic}`, {
    method: "POST",
    headers: {
      "content-type": "application/vnd.kafka.json.v2+json",
      accept: "application/vnd.kafka.v2+json",
      ...(auth ? { authorization: auth } : {}),
    },
    body: JSON.stringify({
      records: [{ key: envelope.key, value: envelope }],
    }),
  });

  if (!res.ok) {
    // Never fail the caller — enqueue to dead-letter and let a retry job handle it.
    const body = await res.text();
    console.error(`[events:publish-failed] ${res.status} ${body}`, envelope);
    // TODO: insert into public.event_outbox for retry worker.
  }
}
