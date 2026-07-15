import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Heart, Truck, ShieldCheck, RefreshCw, ChevronDown } from "lucide-react";
import { getProduct, getRelated } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { useCart } from "@/context/CartContext";

export const Route = createFileRoute("/products/$handle")({
  loader: ({ params }) => {
    const product = getProduct(params.handle);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Not found — Allstag" }, { name: "robots", content: "noindex" }] };
    const { product } = loaderData;
    return {
      meta: [
        { title: `${product.title} — Allstag` },
        { name: "description", content: `${product.title}. ${product.fabric}, ${product.gsm}g, ${product.fit}. ₹${product.price}.` },
        { property: "og:title", content: `${product.title} — Allstag` },
        { property: "og:description", content: `${product.fabric} · ${product.gsm}g · ${product.fit}` },
        { property: "og:image", content: product.image },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const related = getRelated(product.handle);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const [openDetails, setOpenDetails] = useState(true);
  const [openFaq, setOpenFaq] = useState(false);
  const [pincode, setPincode] = useState("");
  const [eta, setEta] = useState<string | null>(null);
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const requireSize = () => {
    if (!size) {
      setSizeError(true);
      return null;
    }
    return size;
  };

  const handleAdd = () => {
    const s = requireSize();
    if (!s) return;
    addItem(product, s, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    const s = requireSize();
    if (!s) return;
    addItem(product, s, qty);
    navigate({ to: "/cart" });
  };

  return (
    <div>
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-8 lg:py-12">
        {/* GALLERY */}
        <div className="space-y-3">
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            <img src={product.image} alt={product.altText} className="h-full w-full object-cover" />
            <div className="absolute left-4 top-4 bg-molten px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-bone">
              -{off}% OFF
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[product.image, product.image, product.image].map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden bg-muted ring-1 ring-transparent hover:ring-ink">
                <img src={src} alt={`${product.altText} — view ${i + 2}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* INFO */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="text-[11px] font-mono uppercase tracking-[0.4em] text-molten">
            {product.collection}
          </div>
          <h1 className="mt-2 text-display text-4xl lg:text-5xl">{product.title}</h1>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <div className="flex gap-0.5 text-molten">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-molten" : ""}`} />
              ))}
            </div>
            <span className="font-medium">{product.rating}</span>
            <span className="text-muted-foreground">· {product.reviewCount} reviews</span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold">₹{product.price}</span>
            <span className="strike-price text-lg">₹{product.mrp}</span>
            <span className="bg-molten/10 px-2 py-0.5 text-xs font-bold text-molten">-{off}%</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes · Shipping calculated at checkout</p>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            A <span className="font-medium text-foreground">{product.fit.toLowerCase()}</span> cut in{" "}
            {product.fabric.toLowerCase()} at {product.gsm} GSM — heavyweight, structured, built to hold shape wash after wash.
          </p>

          {/* Size */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                Size {size && <span className="text-foreground">· {size}</span>}
              </div>
              <button className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-molten">
                Size Guide
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((s: string) => {
                const active = size === s;
                return (
                  <button
                    key={s}
                    onClick={() => { setSize(s); setSizeError(false); }}
                    className={`min-w-[48px] border px-3 py-2 text-xs font-bold uppercase tracking-widest transition ${
                      active
                        ? "border-ink bg-ink text-bone"
                        : "border-ink/20 hover:border-ink"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {sizeError && (
              <div className="mt-2 text-xs text-molten">Please pick a size to continue.</div>
            )}
          </div>

          {/* Qty + CTAs */}
          <div className="mt-6 flex gap-3">
            <div className="flex items-center border border-ink/20">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-3 hover:bg-ink hover:text-bone">−</button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-3 hover:bg-ink hover:text-bone">+</button>
            </div>
            <button
              onClick={handleAdd}
              className="flex-1 border border-ink bg-bone py-3 text-sm font-bold uppercase tracking-widest hover:bg-ink hover:text-bone"
            >
              {added ? "✦ Added to Bag" : "Add to Bag"}
            </button>
            <button aria-label="Wishlist" className="grid w-12 place-items-center border border-ink/20 hover:border-molten hover:text-molten">
              <Heart className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={handleBuyNow}
            className="mt-3 flex w-full items-center justify-center gap-2 bg-molten py-4 text-sm font-bold uppercase tracking-widest text-bone hover:bg-molten-deep"
          >
            Buy Now · UPI 1-Click
          </button>


          {/* Pincode ETA */}
          <div className="mt-6 border border-ink/10 bg-card p-4">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Delivery Check
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit pincode"
                className="flex-1 border border-ink/20 bg-transparent px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
              <button
                onClick={() => {
                  if (pincode.length !== 6) return setEta("Enter a valid pincode");
                  const day = new Date(Date.now() + 4 * 86_400_000).toLocaleDateString("en-IN", {
                    weekday: "short", month: "short", day: "numeric",
                  });
                  setEta(`Delivery by ${day} · COD available`);
                }}
                className="border border-ink bg-ink px-4 py-2 text-xs font-bold uppercase tracking-widest text-bone hover:bg-molten hover:border-molten"
              >
                Check
              </button>
            </div>
            {eta && <div className="mt-2 text-xs text-molten">{eta}</div>}
          </div>

          {/* Trust icons */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-ink/10 pt-6 text-xs">
            {[
              { i: Truck, t: "24H Dispatch" },
              { i: ShieldCheck, t: "Secure Checkout" },
              { i: RefreshCw, t: "7-Day Exchange" },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-2">
                <f.i className="h-4 w-4 text-molten" />
                <span className="font-medium">{f.t}</span>
              </div>
            ))}
          </div>

          {/* Accordions */}
          <div className="mt-8 border-t border-ink/10">
            <button
              onClick={() => setOpenDetails((o) => !o)}
              className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold uppercase tracking-widest"
            >
              Product Details
              <ChevronDown className={`h-4 w-4 transition ${openDetails ? "rotate-180" : ""}`} />
            </button>
            {openDetails && (
              <dl className="grid grid-cols-2 gap-y-2 border-t border-ink/10 pb-6 pt-4 text-sm">
                {[
                  ["Fabric", product.fabric],
                  ["Weight", `${product.gsm} GSM`],
                  ["Fit", product.fit],
                  ["Color", product.color],
                  ["Category", product.category],
                  ["Country of Origin", "India"],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="border-t border-ink/10">
            <button
              onClick={() => setOpenFaq((o) => !o)}
              className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold uppercase tracking-widest"
            >
              Little Things That Matter
              <ChevronDown className={`h-4 w-4 transition ${openFaq ? "rotate-180" : ""}`} />
            </button>
            {openFaq && (
              <ul className="space-y-3 border-t border-ink/10 pb-6 pt-4 text-sm text-muted-foreground">
                <li>• Machine wash cold, inside-out. Line dry in shade to lock print and colour.</li>
                <li>• Runs true to size — for an oversized fit, size up once.</li>
                <li>• Free 7-day exchange on unworn pieces with tags intact.</li>
                <li>• Questions? WhatsApp us at +91 90000 00000 — we reply within an hour.</li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* RELATED */}
      <section className="mx-auto max-w-[1400px] border-t border-ink/10 px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-4xl lg:text-5xl">You may also like</h2>
          <Link
            to="/collections/$handle"
            params={{ handle: "shop-all" }}
            className="text-xs font-mono uppercase tracking-widest hover:text-molten"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {related.map((p) => <ProductCard key={p.handle} product={p} />)}
        </div>
      </section>
    </div>
  );
}
