# Allstag — Hand-Poured Candles, Sachets & Resin

Small-batch D2C candle store built with **TanStack Start v1** (React 19 + Vite 7), Tailwind v4, and Lovable Cloud (Supabase) as the backend. This document is the single source of truth for the app's architecture, REST/RPC surface, data model, and production concerns. Update it whenever a route, table, or server function changes.

---

## 1. Tech Stack

| Layer            | Choice                                                        |
| ---------------- | ------------------------------------------------------------- |
| Framework        | TanStack Start v1 (SSR on Cloudflare Workers via Nitro)       |
| UI               | React 19, Tailwind v4, shadcn/ui, lucide-react                |
| Routing          | File-based (`src/routes/**`), type-safe links                 |
| State (client)   | React Context (cart, account), TanStack Query (server data)   |
| Database         | **Supabase Postgres** (via Lovable Cloud) — Auth + Storage    |
| Cache / KV       | **Redis** over Upstash REST (`src/lib/cache.ts`) — edge-safe  |
| Server logic     | `createServerFn` (typed RPC) + server routes (`/api/**`)      |
| Payments         | **Razorpay** (`src/lib/razorpay.ts`) — orders + webhook HMAC  |
| Email            | Resend (transactional) via server function                    |
| Observability    | Lovable error capture + Cloudflare logs                       |

---

## 2. Project Structure

```
src/
├── routes/                  # File-based routes (pages + API)
│   ├── __root.tsx           # App shell (providers, head, error boundaries)
│   ├── index.tsx            # Home
│   ├── collections.$handle.tsx
│   ├── products.$handle.tsx
│   ├── cart.tsx
│   ├── account.tsx          # Profile + orders (auth-gated in prod)
│   └── api/                 # HTTP endpoints
│       ├── products.ts      # GET list, POST create (admin)
│       ├── products.$id.ts  # GET / PATCH / DELETE by id
│       ├── cart.ts          # GET / POST / DELETE cart lines
│       ├── orders.ts        # POST checkout, GET history
│       └── public/
│           ├── webhooks/razorpay.ts   # Payment webhook (HMAC verified)
│           └── health.ts              # Uptime probe
├── components/site/         # Header, Footer, ProductCard, MarqueeBar…
├── context/CartContext.tsx  # Local cart, persisted in localStorage
├── lib/
│   ├── products.ts          # Static catalog (until DB is wired)
│   ├── products.functions.ts  # createServerFn wrappers (getProducts, getProduct)
│   ├── orders.functions.ts    # createOrder, listOrders
│   ├── auth-middleware.ts     # requireSupabaseAuth
│   └── error-capture.ts
├── integrations/supabase/   # Generated clients (browser + admin.server)
├── server.ts                # SSR entry (wraps h3 errors)
└── styles.css               # Tailwind v4 theme
```

---

## 3. Data Model (Postgres / Supabase)

All tables live in the `public` schema, RLS enabled, with explicit `GRANT`s.

```sql
-- Enum: order lifecycle
create type order_status as enum ('pending','paid','fulfilled','cancelled','refunded');

-- Roles (separate table — never on profiles)
create type app_role as enum ('admin','staff','customer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  line1 text not null, line2 text,
  city text not null, state text not null,
  pincode text not null, phone text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  handle text unique not null,
  title text not null,
  collection text,
  category text not null,           -- 'Candles' | 'Sachets' | 'Resins'
  price int not null,               -- in paise
  mrp int not null,
  image text not null,
  alt_text text,
  material text,                    -- e.g. "100% Soy Wax"
  net_weight_g int,
  notes text,                       -- scent/finish notes
  color text,
  rating numeric(2,1) default 0,
  review_count int default 0,
  badge text,
  stock int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  qty int not null check (qty > 0),
  unique (user_id, product_id),
  updated_at timestamptz default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status order_status not null default 'pending',
  subtotal int not null, shipping int not null, total int not null,
  address_id uuid references public.addresses(id),
  razorpay_order_id text, razorpay_payment_id text,
  created_at timestamptz default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  title text not null, image text not null,
  price int not null, qty int not null
);

-- Grants (required — PostgREST default-denies)
grant select on public.products to anon, authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
grant select, insert on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant all on all tables in schema public to service_role;

alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.addresses enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
```

### RLS Highlights

- `products` — public read (`is_active = true`), admin write (via `has_role`).
- `cart_items`, `addresses`, `orders`, `order_items` — `auth.uid() = user_id`.
- `has_role(uuid, app_role)` SECURITY DEFINER function used everywhere to avoid recursive policies.

---

## 4. REST / RPC Surface

Two flavours coexist. Prefer **server functions** for app-internal calls; use **server routes** only when an external caller or raw HTTP behavior is needed.

### 4.1 Server Functions (`createServerFn`) — called from React

| Function              | Method | Auth       | Purpose                                        |
| --------------------- | ------ | ---------- | ---------------------------------------------- |
| `getProducts`         | GET    | public     | List active products (filter by category)      |
| `getProduct(handle)`  | GET    | public     | Single product detail                          |
| `getCart`             | GET    | user       | Current user's cart lines + product join       |
| `addToCart`           | POST   | user       | Upsert a line `{ productId, qty }`             |
| `updateCartQty`       | POST   | user       | `{ productId, qty }` (qty=0 removes)           |
| `clearCart`           | POST   | user       | Empty user's cart                              |
| `getProfile`          | GET    | user       | Profile + default address                      |
| `updateProfile`       | POST   | user       | `{ full_name, phone }`                         |
| `listAddresses`       | GET    | user       | All addresses for user                         |
| `upsertAddress`       | POST   | user       | Add or edit address                            |
| `createOrder`         | POST   | user       | Snapshot cart → order, create Razorpay order   |
| `listOrders`          | GET    | user       | Order history (with items)                     |
| `promoteUser`         | POST   | admin only | Grant `admin` / `staff` role                   |

### 4.2 REST Endpoints (`src/routes/api/**`)

| Path                                  | Method | Auth        | Body / Notes                                        |
| ------------------------------------- | ------ | ----------- | --------------------------------------------------- |
| `/api/products`                       | GET    | public      | `?category=candles&limit=20&cursor=...`             |
| `/api/products`                       | POST   | admin       | Create product                                      |
| `/api/products/:id`                   | GET    | public      | Product by id                                       |
| `/api/products/:id`                   | PATCH  | admin       | Partial update                                      |
| `/api/products/:id`                   | DELETE | admin       | Soft delete (`is_active=false`)                     |
| `/api/cart`                           | GET    | user        | Cart lines with product join                        |
| `/api/cart`                           | POST   | user        | `{ productId, qty }`                                |
| `/api/cart/:productId`                | DELETE | user        | Remove line                                         |
| `/api/orders`                         | GET    | user        | Order history                                       |
| `/api/orders`                         | POST   | user        | Checkout `{ addressId }` → Razorpay order           |
| `/api/orders/:id`                     | GET    | user/admin  | Order detail                                        |
| `/api/public/webhooks/razorpay`       | POST   | HMAC        | `x-razorpay-signature` verified server-side         |
| `/api/public/health`                  | GET    | public      | `{ ok: true, ts }`                                  |

**Response envelope** (all endpoints):

```json
{ "data": <payload>, "error": null }
```

or on failure:

```json
{ "data": null, "error": { "code": "UNAUTHORIZED", "message": "..." } }
```

**Standard status codes**: 200 OK, 201 Created, 204 No Content, 400 Bad Request (Zod validation), 401 Unauthorized, 403 Forbidden (role check), 404 Not Found, 409 Conflict (stock/duplicate), 422 Unprocessable, 429 Rate Limited, 500 Internal.

---

## 5. Auth Flow

1. User signs in via Supabase Auth (email/password, Google OAuth through Lovable broker).
2. Browser holds the session in `localStorage`; token attached to every server-fn call by `functionMiddleware` in `src/start.ts`.
3. Protected routes live under `src/routes/_authenticated/` — the managed layout gates with `ssr: false` + `getUser()`.
4. Server-side, `requireSupabaseAuth` middleware injects an RLS-scoped `supabase` client + `userId` into every protected handler.
5. Admin-only server functions additionally call `has_role(userId, 'admin')` before touching `supabaseAdmin`.

---

## 6. Checkout & Payment

```
Client → createOrder (server fn)
   → snapshots cart_items into orders + order_items (status='pending')
   → creates Razorpay order via SDK, returns { orderId, razorpayOrderId, amount }
Client → Razorpay Checkout modal → user pays
Razorpay → POST /api/public/webhooks/razorpay
   → verifies HMAC (crypto.timingSafeEqual)
   → updates orders.status='paid', decrements product.stock
   → triggers Resend email (order confirmation)
```

Idempotency: webhook keyed on `razorpay_payment_id`; duplicate deliveries are no-ops.

---

## 7. Reliability & Scale

- **Stateless workers** — no in-memory state; all durable state is in Postgres.
- **RLS-first** — every table has policies; no reliance on client-side filters.
- **Input validation** — Zod schema on every server fn `.inputValidator()` and every REST handler.
- **Rate limiting** — public webhooks and auth-adjacent endpoints wrapped in a Cloudflare KV counter (10 req/min per IP).
- **Idempotency keys** — `POST /api/orders` accepts `Idempotency-Key` header; stored in `orders.idempotency_key` (unique) so retries return the original order.
- **Optimistic concurrency** — `products.stock` decrement uses `update ... where stock >= :qty returning *`; caller retries on empty result.
- **Caching** — public product reads served with `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` at the edge.
- **Backpressure** — checkout is queued if webhook load spikes (Supabase queue table `pending_fulfillments`).
- **Observability** — every server fn logs `{ requestId, userId, fn, durationMs }`; errors captured via `reportLovableError` and Cloudflare tail logs.
- **Migrations** — every schema change ships as a numbered SQL migration; `GRANT` + RLS live in the same migration as the `CREATE TABLE`.
- **Backups** — Supabase daily PITR; product images stored in Supabase Storage with a CDN in front.

---

## 8. Event Streaming (Kafka)

Kafka is the async backbone. Every state-changing server function publishes a
domain event; downstream consumers (email, analytics, search index, inventory
projections) subscribe without the write path knowing they exist. This keeps
checkout latency low and lets us add new side-effects without touching the
order code path.

### 8.1 Runtime

Cloudflare Workers cannot open raw TCP to Kafka brokers, so producers publish
over an HTTP → Kafka gateway. Any of these drop in behind the same env vars:

| Provider                     | Notes                                              |
| ---------------------------- | -------------------------------------------------- |
| Confluent Cloud REST Proxy   | Managed, `application/vnd.kafka.json.v2+json`      |
| Redpanda HTTP Proxy (Pandaproxy) | Self-hosted, wire-compatible with Confluent    |
| Upstash Kafka REST           | Serverless, pay-per-request                        |
| AWS MSK Serverless + API GW  | For AWS-native footprints                          |

Consumers run outside the edge (long-lived): a Node worker on Fly.io / Railway
using `kafkajs`, or Confluent's managed sink connectors (Postgres, S3,
Elasticsearch, Snowflake).

### 8.2 Producer

`src/lib/events.ts` — single `publishEvent()` used by every server function.
Envelope is versioned so consumers can evolve independently:

```ts
await publishEvent({
  topic: "allstag.orders.v1",
  type:  "order.paid",
  key:   order.id,          // partition key → per-order ordering
  data:  { orderId, userId, total, items },
  source: "webhook",
});
```

Envelope shape:

```json
{
  "id":         "01HXY…",
  "type":       "order.paid",
  "topic":      "allstag.orders.v1",
  "key":        "ord_123",
  "occurredAt": "2026-07-09T12:34:56.000Z",
  "source":     "webhook",
  "version":    1,
  "data":       { … }
}
```

### 8.3 Topics

| Topic                    | Partition key | Producers                       | Consumers                                          |
| ------------------------ | ------------- | ------------------------------- | -------------------------------------------------- |
| `allstag.orders.v1`      | `orderId`     | `createOrder`, Razorpay webhook | Email, analytics, fulfilment, warehouse ERP        |
| `allstag.cart.v1`        | `userId`      | `addToCart`, `updateCartQty`    | Abandoned-cart mailer, recommender                 |
| `allstag.inventory.v1`   | `productId`   | Order webhook, admin restock    | Search index (Meilisearch), low-stock alerts       |
| `allstag.users.v1`       | `userId`      | Signup trigger, `updateProfile` | CRM sync, welcome email                            |
| `allstag.emails.v1`      | `userId`      | Order / auth flows              | Resend worker (rate-limited, retries)              |
| `allstag.audit.v1`       | `actorId`     | `promoteUser`, admin mutations  | SIEM / compliance log                              |

Event **types** live inside the topic (e.g. `order.created`, `order.paid`,
`order.fulfilled`, `order.cancelled` all flow through `allstag.orders.v1`),
so a single consumer can filter by `type`.

### 8.4 Delivery Guarantees

- **At-least-once** producer → consumers must be idempotent (dedupe on
  `envelope.id`, or on business keys like `razorpay_payment_id`).
- **Ordered per key** — same `orderId` always hits the same partition, so
  `order.paid` cannot overtake `order.created`.
- **Outbox pattern** — every write that emits an event first inserts into
  `public.event_outbox` in the *same* Postgres transaction; a small relay
  worker drains the outbox to Kafka. Guarantees "DB commit ⇔ event published"
  even if the Worker crashes mid-request.
- **Dead-letter topic** — consumer failures after N retries land in
  `<topic>.dlq`; an on-call dashboard replays them.
- **Schema Registry** — JSON Schema per topic in `/schemas/`; CI blocks
  breaking changes without a `.v2` topic bump.

### 8.5 Data Flow

```text
              ┌──────────────┐
 checkout ──▶ │ createOrder  │──▶ Postgres (orders, event_outbox)
              └──────────────┘
                     │
                     ▼
              ┌──────────────┐   HTTPS   ┌────────────┐
              │ outbox relay │──────────▶│ Kafka REST │──▶ brokers
              └──────────────┘           └────────────┘
                                                │
        ┌───────────────────────────────────────┼─────────────────────┐
        ▼                                       ▼                     ▼
  Resend worker                        Meilisearch indexer      Warehouse ERP
  (emails.v1)                          (inventory.v1)           (orders.v1)
```

### 8.6 Consumers

Kafka consumers live in **`src/lib/consumers.ts`**. Because Cloudflare Workers
have no long-running consumer group, the flow is push-based:

```text
brokers ──▶ HTTP sink connector ──▶ POST /api/public/events/consume
                                            │
                                            ▼
                                    dispatchEvent(envelope)
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              ▼                             ▼                             ▼
      orders handlers              cart handlers                users / inventory
      (email, inventory)           (recs, abandoned)            (welcome, CRM, stock)
```

Route: **`src/routes/api.public.events.consume.ts`** — verifies
`x-consumer-secret` against `KAFKA_CONSUMER_SECRET`, accepts either a single
envelope or a `{ records: [{ value }] }` batch, and returns `500` on any
handler failure so the gateway retries and eventually DLQs.

Handler map by topic:

| Topic                  | Types handled                                        | Side-effects                                          |
| ---------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| `allstag.orders.v1`    | `order.created`, `order.paid`, `order.fulfilled`     | Enqueue confirmation email; emit inventory deltas     |
| `allstag.cart.v1`      | `cart.item_added`, `cart.item_removed`, `cart.abandoned` | Personalization score; abandoned-cart email       |
| `allstag.inventory.v1` | `inventory.reserved`, `inventory.restocked`          | UPDATE `public.products.stock`                        |
| `allstag.users.v1`     | `user.signed_up`, `user.updated`                     | Welcome email; CRM sync                               |
| `allstag.emails.v1`    | `email.queued`                                       | Resend API call (`RESEND_API_KEY`)                    |
| `allstag.audit.v1`     | `*` catch-all                                        | Structured log to observability sink                  |

**Idempotency & deduplication** — the producer is at-least-once, and a
retried producer may even re-mint the envelope with a fresh UUID, so
`dispatchEvent` defends against duplicate cart items / duplicate account
updates with three cooperating layers:

1. **Envelope-ID dedup** (`seenIds`, TTL LRU, 24h) — drops exact
   retransmits of the same record from the broker / HTTP sink.
2. **Business-key dedup** (`seenBusinessKeys`, TTL LRU) — FNV-1a hash of
   `topic:type:partitionKey:stableStringify(data)`. Catches producer
   retries that re-generated `envelope.id` for the same logical event
   (e.g. a double-clicked "Add to bag").
3. **Per-key async lock** (`withKeyLock`) — serializes concurrent
   deliveries sharing the same partition key so two handler runs can't
   interleave past the layer-2 check.

Envelope ID and business key are only marked "seen" **after** the handler
succeeds, so a thrown error still retries via the HTTP sink → DLQ path.
Swap the in-memory `TtlLru` / `keyLocks` for Redis / Upstash `SET NX EX`
in production — the `seen()` / `withKeyLock()` interface stays the same.

### 8.7 Client → server emit path

Browser code cannot import `src/lib/events.ts` directly (it reads
server-only env vars). Instead, `src/lib/events.functions.ts` exposes a
typed `createServerFn` called `emitEvent` with an allow-list of
client-emittable event types (`cart.*`, `user.*`). Wired into:

- `src/context/CartContext.tsx` → `cart.item_added`, `cart.item_removed`, `cart.cleared`
- `src/routes/account.tsx` → `user.signed_up` on first save, `user.updated` after

Server-originated events (`order.*`, `inventory.*`, `email.*`) call
`publishEvent` directly from server functions / webhook handlers.

### 8.8 Environment Variables (Kafka)

| Name                     | Where       | Purpose                                    |
| ------------------------ | ----------- | ------------------------------------------ |
| `KAFKA_REST_URL`         | server-only | Base URL of the HTTP → Kafka gateway       |
| `KAFKA_REST_AUTH`        | server-only | `Basic <b64>` or `Bearer <token>` header   |
| `KAFKA_CONSUMER_SECRET`  | server-only | Shared secret the sink connector sends in `x-consumer-secret` |

If `KAFKA_REST_URL` is unset (local dev), `publishEvent` invokes
`dispatchEvent` in-process so the same consumer handlers run without a
broker — the app is fully exercisable end-to-end with no cluster.


---

---

## 9. Cache Layer (Redis)

`src/lib/cache.ts` exposes a tiny `RedisBackend` (`get`, `set`, `setNx`,
`incr`, `del`) that talks to **Upstash Redis** over HTTP (Cloudflare Workers
can't hold raw TCP). When `REDIS_REST_URL` is unset the module falls back to
a TTL-aware in-memory Map so local dev needs no Redis.

Usage across the app:

| Consumer                         | Key pattern                         | TTL   | Purpose                                     |
| -------------------------------- | ----------------------------------- | ----- | ------------------------------------------- |
| `getProducts` / `getProduct`     | `products:list`, `product:<handle>` | 60s   | Read-through cache for PLP / PDP            |
| Razorpay webhook                 | `rzp:pmt:<razorpay_payment_id>`     | 24h   | `setNx` idempotency for retried deliveries  |
| Kafka consumers (`consumers.ts`) | `evt:id:<uuid>`, `evt:bk:<hash>`    | 24h   | Replaces in-memory `TtlLru` at scale        |
| Rate limiter (`/api/**`)         | `rl:<ip>:<route>`                   | 60s   | `INCR` + `EXPIRE`, reject > N per window    |

```ts
import { cached, invalidate } from "@/lib/cache";

const list = await cached("products:list", 60, () => db.products.findMany());
// after admin edit:
await invalidate("products:list", `product:${handle}`);
```

---

## 10. Payments (Razorpay)

`src/lib/razorpay.ts` is the edge-safe gateway wrapper — no Node SDK, only
`fetch` + WebCrypto. Three primitives:

- `createRazorpayOrder({ amountPaise, receipt, notes })` — REST call to
  `POST https://api.razorpay.com/v1/orders` with HTTP Basic auth
  (`RAZORPAY_KEY_ID:RAZORPAY_KEY_SECRET`). Returns `{ id, amount, currency }`.
- `verifyWebhookSignature(rawBody, header)` — HMAC-SHA256 with
  `RAZORPAY_WEBHOOK_SECRET`, timing-safe compare. Gate every webhook.
- `verifyCheckoutSignature({ razorpay_order_id, razorpay_payment_id,
  razorpay_signature })` — HMAC with `RAZORPAY_KEY_SECRET` for the client
  handler callback.

Wire-up (see §6 for the end-to-end flow):

```
POST /api/orders                    → createOrder server fn
                                     └─ createRazorpayOrder(...)         (Razorpay REST)
                                     └─ INSERT public.orders (pending)   (Supabase)
                                     └─ publishEvent order.created       (Kafka)
Client → Razorpay Checkout modal → user pays
Razorpay → POST /api/public/webhooks/razorpay
   └─ verifyWebhookSignature(...)
   └─ redis().setNx("rzp:pmt:<id>", "1", 86400)   ← idempotency (Redis)
   └─ UPDATE public.orders SET status='paid'      (Supabase)
   └─ publishEvent order.paid                     (Kafka → inventory, email)
```

---

## 11. Environment Variables


| Name                              | Where        | Purpose                          |
| --------------------------------- | ------------ | -------------------------------- |
| `VITE_SUPABASE_URL`               | browser      | Public Supabase URL              |
| `VITE_SUPABASE_PUBLISHABLE_KEY`   | browser      | Anon/publishable key             |
| `SUPABASE_URL`                    | server       | Same URL for server clients      |
| `SUPABASE_PUBLISHABLE_KEY`        | server       | For auth-scoped server client    |
| `SUPABASE_SERVICE_ROLE_KEY`       | server-only  | Admin client (bypasses RLS)      |
| `RAZORPAY_KEY_ID`                 | browser      | Checkout modal                   |
| `RAZORPAY_KEY_SECRET`             | server-only  | Order creation + webhook verify  |
| `RAZORPAY_WEBHOOK_SECRET`         | server-only  | HMAC verification                |
| `RESEND_API_KEY`                  | server-only  | Transactional email              |
| `KAFKA_REST_URL`                  | server-only  | Kafka HTTP gateway base URL      |
| `KAFKA_REST_AUTH`                 | server-only  | Auth header for Kafka gateway    |
| `KAFKA_CONSUMER_SECRET`           | server-only  | Shared secret for `/api/public/events/consume` |
| `REDIS_REST_URL`                  | server-only  | Upstash Redis REST endpoint (omit → in-memory) |
| `REDIS_REST_TOKEN`                | server-only  | Bearer token for Upstash REST                  |

Never read `process.env.*` at module scope — always inside a handler body.

---

## 10. Local Development

```bash
bun install
bun run dev          # Vite dev server on :8080
```

The preview URL and published URL are wired via Lovable. Migrations run automatically when you enable Lovable Cloud.

---

## 12. Change Log (keep updated!)

- **2026-07-13** — Re-introduced **size variants** across the stack. `CartContext` items now keyed by `handle + size` (line key: `${handle}::${size}`); `addItem/removeItem/updateQty` take a `size` arg. PDP shows a size grid with validation before Add-to-Bag / Buy-Now. ProductCard "Quick Add" opens an inline size chip picker on hover. Cart renders the selected size on each line. Bumped `localStorage` key to `allstag_cart_v3` (older carts are dropped on first load). `cart.item_added` / `cart.item_removed` event payloads now include `size`.
- **2026-07-12** — Added **Redis cache layer** (`src/lib/cache.ts`) — Upstash REST backend with in-memory dev fallback, plus `cached()` / `invalidate()` helpers. Added **Razorpay gateway wrapper** (`src/lib/razorpay.ts`) — edge-safe `createRazorpayOrder`, `verifyWebhookSignature`, `verifyCheckoutSignature` using WebCrypto HMAC. Confirmed DB = Supabase Postgres. New env vars `REDIS_REST_URL` / `REDIS_REST_TOKEN`. Docs in §9 (cache) and §10 (payments).
- **2026-07-10** — Hardened consumer idempotency: 3-layer dedup (envelope-ID TTL LRU + business-key FNV-1a hash + per-key async lock) in `src/lib/consumers.ts` so producer retries can't create duplicate cart items or account updates. Handlers only mark events "seen" after success so failures still DLQ. Docs in §8.6.
- **2026-07-10** — Added Kafka **consumers** (`src/lib/consumers.ts`) with per-topic handler map, in-memory idempotency, and DLQ semantics. New push endpoint `POST /api/public/events/consume` (auth via `KAFKA_CONSUMER_SECRET`). Client emit path via `emitEvent` server fn wired into `CartContext` (cart.*) and account save (users.*). Local dev fans out in-process so no broker is required.
- **2026-07-09** — Added Kafka event-streaming architecture (§8): `src/lib/events.ts` producer, six versioned topics, outbox pattern, DLQ, schema registry. New env vars `KAFKA_REST_URL` / `KAFKA_REST_AUTH`.
- **2026-07-09** — Removed size/variant selection from ProductCard, PDP, cart, and `CartContext`. Cart lines are now keyed by `handle` (previously `handle+size`). Bumped `localStorage` key to `allstag_cart_v2`.
- **2026-07-09** — Rebranded catalog from streetwear to candles/sachets/resins; kept Ink/Bone/Molten theme.
- **2026-07-09** — Added `/cart` and `/account` routes; wired header icons.
- **Initial** — Home, PLP, PDP scaffolding on TanStack Start.

> When you add a table, route, or server function, add a row here **and** update sections 3–4.

