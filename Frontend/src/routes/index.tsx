import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Truck, ShieldCheck, RefreshCw, MessageCircle, Star } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { PRODUCTS } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { Countdown } from "@/components/site/Countdown";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Allstag — Heavyweight Streetwear from Mumbai" },
      { name: "description", content: "Heavyweight tees, boxy shirts and racer tanks. Cut and stitched in Mumbai. Free shipping over ₹999. Dispatched in 24 hours." },
      { property: "og:title", content: "Allstag — Heavyweight Streetwear" },
      { property: "og:description", content: "Stitched in Mumbai. Cut heavy. Shipped everywhere." },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = PRODUCTS.slice(0, 4);
  const rest = PRODUCTS.slice(4);
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink bg-ink text-bone">
        <div className="mx-auto grid max-w-[1400px] items-stretch gap-0 px-0 lg:grid-cols-2">
          <div className="relative flex flex-col justify-between p-8 lg:p-14">
            <div className="text-[11px] font-mono uppercase tracking-[0.4em] text-molten">
              Drop 07 · Molten Series
            </div>
            <div className="my-10">
              <h1 className="text-display text-[18vw] leading-[0.85] lg:text-[10rem]">
                Cut<br />Heavy<span className="text-molten">.</span>
              </h1>
              <p className="mt-6 max-w-md text-base text-bone/70">
                240–320 GSM cotton, boxy cuts, prints we obsessed over.
                Cut and stitched in Mumbai. Flat 50% off during Birthday Sale.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/collections/$handle"
                params={{ handle: "shop-all" }}
                className="group inline-flex items-center gap-3 bg-molten px-6 py-4 text-sm font-bold uppercase tracking-widest text-bone hover:bg-bone hover:text-ink"
              >
                Shop the Drop
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/collections/$handle"
                params={{ handle: "tees" }}
                className="inline-flex items-center gap-3 border border-bone/30 px-6 py-4 text-sm font-bold uppercase tracking-widest hover:border-molten hover:text-molten"
              >
                Browse Tees
              </Link>
            </div>
          </div>

          <div className="relative min-h-[420px] lg:min-h-[720px]">
            <img
              src={heroImg}
              alt="Editorial flatlay of heavyweight cotton tees and shirts in molten red, ink black and bone"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-[10px] font-mono uppercase tracking-widest text-bone">
              <span>Ref · AST-24-M07</span>
              <span>Stitched in India</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-ink/10 bg-bone">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-ink/10 px-4 lg:grid-cols-4 lg:divide-x lg:px-8">
          {[
            { i: Truck, t: "24H Dispatch", s: "Orders out same day" },
            { i: ShieldCheck, t: "Secure Checkout", s: "UPI · Cards · COD" },
            { i: RefreshCw, t: "7-Day Exchange", s: "Wrong size? Swap free" },
            { i: MessageCircle, t: "Real Humans", s: "WhatsApp support daily" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 py-5 lg:px-6">
              <f.i className="h-5 w-5 text-molten" />
              <div>
                <div className="text-sm font-semibold">{f.t}</div>
                <div className="text-xs text-muted-foreground">{f.s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED GRID */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.4em] text-molten">
              Fresh Off The Cut
            </div>
            <h2 className="mt-2 text-4xl lg:text-6xl">New this week</h2>
          </div>
          <Link
            to="/collections/$handle"
            params={{ handle: "shop-all" }}
            className="hidden text-xs font-mono uppercase tracking-widest hover:text-molten sm:inline"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.handle} product={p} />)}
        </div>
      </section>

      {/* COUNTDOWN */}
      <Countdown />

      {/* SECOND GRID */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-4xl lg:text-6xl">Kept coming back</h2>
          <div className="hidden text-xs font-mono uppercase tracking-widest text-muted-foreground sm:block">
            Bestsellers · Restocked
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {rest.map((p) => <ProductCard key={p.handle} product={p} />)}
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="border-y border-ink bg-ink py-24 text-bone">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-4 lg:grid-cols-[1fr_1.4fr] lg:px-8">
          <div className="text-[11px] font-mono uppercase tracking-[0.4em] text-molten">
            The Studio
          </div>
          <div>
            <p className="text-display text-3xl leading-tight lg:text-5xl">
              We don't chase trends. We cut the pieces our friends
              were already asking for — in small runs, from a
              tiny studio in <span className="text-molten">Mumbai</span>.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-display text-4xl text-molten">260<span className="text-xl">GSM</span></div>
                <div className="mt-1 text-bone/60">Heavyweight cotton, avg</div>
              </div>
              <div>
                <div className="text-display text-4xl text-molten">72<span className="text-xl">H</span></div>
                <div className="mt-1 text-bone/60">Order to doorstep, avg</div>
              </div>
              <div>
                <div className="text-display text-4xl text-molten">40K+</div>
                <div className="mt-1 text-bone/60">Orders shipped &amp; counting</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="mx-auto max-w-[1400px] px-4 py-20 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.4em] text-molten">
              Real Fits · Real Words
            </div>
            <h2 className="mt-2 text-4xl lg:text-6xl">4.8 avg on 1.4k reviews</h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { n: "Aarav M.", t: "Fabric hits different", b: "Ordered the Giraffe tee in L. 240 GSM is no joke — heavy, boxy, holds shape after 6 washes.", p: "Giraffe Oversized · L" },
            { n: "Sana R.", t: "Print didn't crack", b: "Washed the Bad Ideas tee inside-out cold and the print looks the same as day one. Rare.", p: "Bad Ideas · M" },
            { n: "Kabir S.", t: "Overshirt is stunning", b: "Ordered the Walnut cord overshirt as a gift, in Bengaluru by Monday. Packaging felt premium.", p: "Walnut Overshirt · L" },
          ].map((r) => (
            <div key={r.n} className="border border-ink/10 bg-card p-6">
              <div className="flex gap-0.5 text-molten">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-molten" />
                ))}
              </div>
              <h3 className="mt-3 text-lg">{r.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{r.b}</p>
              <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3 text-[11px] font-mono uppercase tracking-widest">
                <span>{r.n}</span>
                <span className="text-muted-foreground">{r.p}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
