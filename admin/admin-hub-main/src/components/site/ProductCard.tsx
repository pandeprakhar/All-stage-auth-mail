import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Star } from "lucide-react";
import type { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const [pickSize, setPickSize] = useState(false);
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const handleAdd = (size: string) => {
    addItem(product, size, 1);
    setPickSize(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <Link to="/products/$handle" params={{ handle: product.handle }}>
          <img
            src={product.image}
            alt={product.altText}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        <div className="absolute left-3 top-3 bg-molten px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-bone">
          -{off}%
        </div>
        {product.badge && (
          <div className="absolute right-3 top-3 bg-ink px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-bone">
            {product.badge}
          </div>
        )}

        <button
          aria-label="Wishlist"
          onClick={() => setWished((w) => !w)}
          className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center bg-bone/90 backdrop-blur transition hover:bg-molten hover:text-bone"
        >
          <Heart className={`h-4 w-4 ${wished ? "fill-molten text-molten" : ""}`} />
        </button>

        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-ink/95 p-3 text-bone transition-transform duration-300 group-hover:translate-y-0">
          {pickSize ? (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => handleAdd(s)}
                  className="min-w-[36px] border border-bone/40 px-2 py-1 text-[11px] font-bold uppercase tracking-widest hover:bg-molten hover:border-molten"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setPickSize(true)}
              className="flex w-full items-center justify-center gap-2 border border-bone/30 py-2 text-xs font-bold uppercase tracking-widest transition hover:border-molten hover:bg-molten"
            >
              {added ? <>✦ Added to Bag</> : <>Quick Add · Pick Size</>}
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {product.collection}
          </div>
          <Link
            to="/products/$handle"
            params={{ handle: product.handle }}
            className="mt-0.5 block truncate text-sm font-semibold hover:text-molten"
          >
            {product.title}
          </Link>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-molten text-molten" />
            <span className="font-medium text-foreground">{product.rating}</span>
            <span>({product.reviewCount})</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold">₹{product.price}</div>
          <div className="strike-price text-xs">₹{product.mrp}</div>
        </div>
      </div>
    </div>
  );
}
