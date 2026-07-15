/**
 * Client-callable server functions for emitting events to Kafka.
 * Client code (CartContext, account page) uses these instead of touching
 * `publishEvent` directly, because `publishEvent` reads server-only env vars.
 */
import { createServerFn } from "@tanstack/react-start";
import { publishEvent, type EventTopic } from "./events";

type EmitInput = {
  topic: EventTopic;
  type: string;
  key: string;
  data: Record<string, unknown>;
};

// NOTE: public endpoint (no auth middleware) — safe because we only accept
// a narrow allow-list of client-emittable event types below.
const CLIENT_ALLOWED = new Set([
  "cart.item_added",
  "cart.item_removed",
  "cart.cleared",
  "user.updated",
  "user.signed_up",
]);

export const emitEvent = createServerFn({ method: "POST" })
  .inputValidator((data: EmitInput) => {
    if (!CLIENT_ALLOWED.has(data.type)) {
      throw new Error(`Event type not permitted from client: ${data.type}`);
    }
    return data;
  })
  .handler(async ({ data }) => {
    await publishEvent({
      topic: data.topic,
      type: data.type,
      key: data.key,
      data: data.data,
      source: "web",
    });
    return { ok: true };
  });
