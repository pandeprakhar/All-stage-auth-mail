/**
 * Razorpay gateway helpers — edge-safe (fetch + WebCrypto only, no Node SDK).
 *
 * Flow (see README §6):
 *   1. Client → `createOrder` server fn → this module's `createRazorpayOrder`
 *      returns `{ id, amount, currency }`.
 *   2. Client opens Razorpay Checkout with `RAZORPAY_KEY_ID` + the order id.
 *   3. Razorpay → `POST /api/public/webhooks/razorpay` → this module's
 *      `verifyWebhookSignature` gates the payload before we mark the order paid
 *      and publish `order.paid` to Kafka.
 *
 * Idempotency: the webhook handler uses `redis().setNx("rzp:pmt:<id>", "1",
 * 24h)` so retried deliveries of the same `razorpay_payment_id` are no-ops.
 */

export interface RazorpayOrderInput {
  amountPaise: number;          // Razorpay wants the smallest unit (paise)
  currency?: "INR";
  receipt: string;              // our internal order id
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string;
}

function creds() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
  }
  return { keyId, keySecret };
}

/** Create an order on Razorpay's side; call from a server function only. */
export async function createRazorpayOrder(input: RazorpayOrderInput): Promise<RazorpayOrder> {
  const { keyId, keySecret } = creds();
  const auth = btoa(`${keyId}:${keySecret}`);

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      authorization: `Basic ${auth}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: input.currency ?? "INR",
      receipt: input.receipt,
      notes: input.notes,
    }),
  });

  if (!res.ok) {
    throw new Error(`[razorpay:create-order] ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/**
 * Verify the `x-razorpay-signature` header on a webhook.
 * Compare HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET) in constant time.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(expected, signature);
}

/**
 * Verify the client-side handler payload (razorpay_order_id +
 * razorpay_payment_id + razorpay_signature). Used when the modal returns
 * success before the webhook arrives.
 */
export async function verifyCheckoutSignature(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<boolean> {
  const { keySecret } = creds();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keySecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${payload.razorpay_order_id}|${payload.razorpay_payment_id}`),
  );
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqual(expected, payload.razorpay_signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
