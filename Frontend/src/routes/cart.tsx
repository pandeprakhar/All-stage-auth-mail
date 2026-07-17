import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from "react";
import { Trash2, ShoppingBag, ArrowRight, CheckCircle2 } from "lucide-react";
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
  const [showCheckout, setShowCheckout] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const shipping = subtotal === 0 ? 0 : subtotal >= 999 ? 0 : 49;
  const total = subtotal + shipping;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !address || !city || !pincode) {
      alert("Please fill in all shipping fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost/allstag-insight-hub-main/allstag-insight-hub-main/backend/public/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping: { name, email, phone, address, city, pincode },
          items: items.map((i) => ({ handle: i.handle, size: i.size, quantity: i.qty })),
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOrderSuccess(json.data.order_number);
        clear();
      } else {
        alert(json.message || "Failed to place order.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while placing your order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="mx-auto max-w-[600px] px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-6 text-display text-4xl lg:text-5xl">Order Placed!</h1>
        <p className="mt-4 text-muted-foreground text-sm">
          Thank you for your order. Your order number is{" "}
          <strong className="font-mono text-foreground text-base bg-muted px-2 py-0.5 rounded">
            {orderSuccess}
          </strong>.
        </p>
        <p className="mt-2 text-muted-foreground text-xs">
          We will contact you shortly to confirm your delivery details.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 bg-ink px-6 py-3 text-xs font-bold uppercase tracking-widest text-bone hover:bg-molten"
        >
          Continue Shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

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
        {!showCheckout && (
          <button onClick={clear} className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-molten">
            Clear all
          </button>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {showCheckout ? (
            <form onSubmit={handlePlaceOrder} className="space-y-6 border border-ink/10 bg-card p-6">
              <div>
                <h2 className="text-display text-2xl">Shipping Details</h2>
                <p className="text-xs text-muted-foreground mt-1">Provide your delivery address and contact information.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Abhishek Saxena"
                    className="w-full h-10 border border-ink/20 px-3 text-sm focus:border-ink outline-none bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="abhishek@example.com"
                    className="w-full h-10 border border-ink/20 px-3 text-sm focus:border-ink outline-none bg-background"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full h-10 border border-ink/20 px-3 text-sm focus:border-ink outline-none bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Pincode</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="400001"
                    className="w-full h-10 border border-ink/20 px-3 text-sm focus:border-ink outline-none bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Address</label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, Building No., Apartment Info"
                  className="w-full border border-ink/20 p-3 text-sm focus:border-ink outline-none bg-background resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full h-10 border border-ink/20 px-3 text-sm focus:border-ink outline-none bg-background"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 h-12 border border-ink/20 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-ink hover:border-ink"
                >
                  ← Back to Bag
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-12 bg-molten text-xs font-bold uppercase tracking-widest text-bone hover:bg-molten-deep disabled:opacity-50"
                >
                  {submitting ? "Processing…" : "Place Order (COD)"}
                </button>
              </div>
            </form>
          ) : (
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
                          <div className="text-sm font-bold">₹{i.selling_price * i.qty}</div>
                          <div className="strike-selling_price text-xs">₹{i.mrp * i.qty}</div>
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
          )}
        </div>

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

          {!showCheckout && (
            <button
              onClick={() => setShowCheckout(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 bg-molten py-4 text-sm font-bold uppercase tracking-widest text-bone hover:bg-molten-deep"
            >
              Checkout Securely <ArrowRight className="h-4 w-4" />
            </button>
          )}
          
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
