/**
 * HTTP sink for the Kafka gateway. The Confluent HTTP Sink connector /
 * Upstash Kafka REST push consumer / custom relay POSTs each record here
 * (single envelope or `{ records: [{ value: envelope }] }` batch).
 *
 * Auth: shared secret `KAFKA_CONSUMER_SECRET` in `x-consumer-secret`.
 * Response: 200 on success, 500 on handler failure so the gateway retries
 * and — after N attempts — parks the record in `<topic>.dlq`.
 */
import { createFileRoute } from "@tanstack/react-router";
import { dispatchEvent } from "@/lib/consumers";
import type { EventEnvelope } from "@/lib/events";

export const Route = createFileRoute("/api/public/events/consume")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.KAFKA_CONSUMER_SECRET;
        if (secret && request.headers.get("x-consumer-secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const envelopes = normalize(body);
        if (!envelopes.length) return new Response("No records", { status: 400 });

        const results = await Promise.allSettled(envelopes.map(dispatchEvent));
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          return Response.json(
            { processed: envelopes.length - failed, failed },
            { status: 500 },
          );
        }
        return Response.json({ processed: envelopes.length });
      },
    },
  },
});

function normalize(body: unknown): EventEnvelope[] {
  if (!body) return [];
  const b = body as { records?: Array<{ value?: EventEnvelope }> };
  if (Array.isArray(b.records)) {
    return b.records.map((r) => r.value).filter(Boolean) as EventEnvelope[];
  }
  if (Array.isArray(body)) return body as EventEnvelope[];
  return [body as EventEnvelope];
}
