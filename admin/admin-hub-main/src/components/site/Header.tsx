import { Link } from "@tanstack/react-router";
import { Search, User, ShoppingBag, Menu } from "lucide-react";
import { CATEGORIES } from "@/lib/products";
import { useCart } from "@/context/CartContext";

export function Header() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-bone/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 lg:px-8">
        <button className="lg:hidden" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>

        <nav className="hidden gap-7 text-[13px] font-medium uppercase tracking-wider lg:flex">
          <Link to="/collections/$handle" params={{ handle: "shop-all" }} className="hover:text-molten">
            New
          </Link>
          <Link to="/collections/$handle" params={{ handle: "tees" }} className="text-molten hover:text-ink">
            50% Sale
          </Link>
          <Link to="/collections/$handle" params={{ handle: "tees" }} className="hover:text-molten">
            Tees
          </Link>
          <Link to="/collections/$handle" params={{ handle: "shirts" }} className="hover:text-molten">
            Shirts
          </Link>
          <Link to="/collections/$handle" params={{ handle: "tanks" }} className="hover:text-molten">
            Tanks
          </Link>
        </nav>

        <Link to="/" className="text-display text-2xl tracking-[0.15em] lg:text-3xl">
          ALL<span className="text-molten">/</span>STAG
        </Link>

        <div className="flex items-center gap-4">
          <button aria-label="Search" className="hover:text-molten"><Search className="h-5 w-5" /></button>
          <Link to="/account" aria-label="Account" className="hidden hover:text-molten sm:block">
            <User className="h-5 w-5" />
          </Link>
          <Link to="/cart" aria-label="Bag" className="relative hover:text-molten">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-molten text-[10px] font-bold text-bone">
              {count}
            </span>
          </Link>
        </div>
      </div>

      {/* Secondary category strip */}
      <div className="hidden border-t border-ink/10 lg:block">
        <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-8 px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground lg:px-8">
          {CATEGORIES.map((c) => (
            <Link key={c.handle} to="/collections/$handle" params={{ handle: c.handle }} className="hover:text-ink">
              {c.label}
            </Link>
          ))}
          <Link to="/account" className="hover:text-ink">Account</Link>
          <Link to="/cart" className="hover:text-ink">Cart</Link>
        </div>
      </div>
    </header>
  );
}
