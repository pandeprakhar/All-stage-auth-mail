import { createFileRoute, Link } from "@tanstack/react-router";
import { getByCategory, CATEGORIES } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/collections/$handle")({
  head: ({ params }) => {
    const cat = CATEGORIES.find((c) => c.handle === params.handle);
    const label = cat?.label ?? "Collection";
    return {
      meta: [
        { title: `${label} — Allstag` },
        { name: "description", content: `Shop ${label.toLowerCase()} at Allstag. Heavyweight streetwear, dispatched in 24 hours.` },
        { property: "og:title", content: `${label} — Allstag` },
      ],
    };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { handle } = Route.useParams();
  const cat = CATEGORIES.find((c) => c.handle === handle);
  const items = getByCategory(handle);

  return (
    <div>
      <section className="border-b border-ink/10 bg-ink text-bone">
        <div className="mx-auto max-w-[1400px] px-4 py-14 lg:px-8">
          <div className="text-[11px] font-mono uppercase tracking-[0.4em] text-molten">
            Collection
          </div>
          <h1 className="mt-2 text-display text-6xl lg:text-8xl">{cat?.label ?? "Shop"}</h1>
          <p className="mt-4 max-w-xl text-sm text-bone/60">
            {items.length} pieces · Flat 50% off during Birthday Sale · Dispatched within 24 hours
          </p>
        </div>
      </section>

      {/* Filter strip */}
      <div className="sticky top-[65px] z-30 border-b border-ink/10 bg-bone/95 backdrop-blur lg:top-[105px]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 overflow-x-auto px-4 py-3 text-xs font-mono uppercase tracking-widest lg:px-8">
          <div className="flex gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.handle}
                to="/collections/$handle"
                params={{ handle: c.handle }}
                className={`shrink-0 border px-3 py-1.5 transition ${
                  c.handle === handle
                    ? "border-ink bg-ink text-bone"
                    : "border-ink/20 hover:border-ink"
                }`}
              >
                {c.label}
              </Link>
            ))}
          </div>
          <div className="hidden shrink-0 items-center gap-2 text-muted-foreground lg:flex">
            <span>Sort:</span>
            <button className="border border-ink/20 px-3 py-1.5 text-ink hover:border-ink">Newest ▾</button>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-[1400px] px-4 py-12 lg:px-8">
        {items.length === 0 ? (
          <div className="py-24 text-center">
            <div className="text-display text-4xl">Restocking soon</div>
            <p className="mt-2 text-muted-foreground">This collection drops next week.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {items.map((p) => <ProductCard key={p.handle} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
