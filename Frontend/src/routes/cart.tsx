import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — Allstag" },
      { name: "description", content: "Review the tees, shirts and tanks in your bag." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, count, subtotal, savings, updateQty, removeItem, clear } = useCart();
  const shipping = subtotal === 0 ? 0 : subtotal >= 999 ? 0 : 49;
  const total = subtotal + shipping;

  if (count === 0) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-24 text-center lg:px-8">
        <ShoppingBag className="mx-auto h-10 w-10 text-molten" />
        <h1 className="mt-6 text-display text-5xl">Your bag is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a fit that hits.
        </p>
        <Link
          to="/collections/$handle"
          params={{ handle: "shop-all" }}
          className="mt-8 inline-flex items-center gap-2 bg-ink px-6 py-3 text-xs font-bold uppercase tracking-widest text-bone hover:bg-molten"
        >
          Shop Everything <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 lg:px-8">
      <div className="flex items-end justify-between border-b border-ink/10 pb-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.4em] text-molten">Your Bag</div>
          <h1 className="mt-1 text-display text-4xl lg:text-5xl">{count} item{count === 1 ? "" : "s"}</h1>
        </div>
        <button onClick={clear} className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-molten">
          Clear all
        </button>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <ul className="divide-y divide-ink/10">
          {items.map((i) => (
            <li key={`${i.handle}-${i.size}`} className="flex gap-4 py-5">
              <Link to="/products/$handle" params={{ handle: i.handle }} className="shrink-0">
                <img src={i.image} alt={i.title} className="h-28 w-24 object-cover" loading="lazy" />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link to="/products/$handle" params={{ handle: i.handle }} className="text-sm font-semibold hover:text-molten">
                    {i.title}
                  </Link>
                  <div className="mt-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                    Size · <span className="text-foreground">{i.size}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-ink/20">
                    <button
                      onClick={() => updateQty(i.handle, i.size, i.qty - 1)}
                      className="px-3 py-1.5 text-sm hover:bg-ink hover:text-bone"
                    >−</button>
                    <span className="w-8 text-center text-sm font-semibold">{i.qty}</span>
                    <button
                      onClick={() => updateQty(i.handle, i.size, i.qty + 1)}
                      className="px-3 py-1.5 text-sm hover:bg-ink hover:text-bone"
                    >+</button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold">₹{i.price * i.qty}</div>
                      <div className="strike-price text-xs">₹{i.mrp * i.qty}</div>
                    </div>
                    <button
                      onClick={() => removeItem(i.handle, i.size)}
                      aria-label="Remove"
                      className="text-muted-foreground hover:text-molten"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>


        <aside className="h-fit border border-ink/10 bg-card p-6 lg:sticky lg:top-32">
          <h2 className="text-xs font-mono uppercase tracking-widest text-molten">Order Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-semibold">₹{subtotal}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">You save</dt>
              <dd className="font-semibold text-molten">−₹{savings}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-semibold">{shipping === 0 ? "Free" : `₹${shipping}`}</dd>
            </div>
            <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 text-base">
              <dt className="font-bold uppercase tracking-widest">Total</dt>
              <dd className="font-bold">₹{total}</dd>
            </div>
          </dl>

          <button
            onClick={() => alert("Redirecting to secure UPI checkout…")}
            className="mt-6 flex w-full items-center justify-center gap-2 bg-molten py-4 text-sm font-bold uppercase tracking-widest text-bone hover:bg-molten-deep"
          >
            Checkout Securely <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            to="/collections/$handle"
            params={{ handle: "shop-all" }}
            className="mt-3 block text-center text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-ink"
          >
            ← Continue shopping
          </Link>

          <p className="mt-6 border-t border-ink/10 pt-4 text-[11px] leading-relaxed text-muted-foreground">
            7-day exchange on unworn pieces with tags intact. Dispatched in 24 hours from Mumbai.
          </p>
        </aside>
      </div>
    </div>
  );
}
