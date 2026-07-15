import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/products";
import { emitEvent } from "@/lib/events.functions";

function emit(type: string, key: string, data: Record<string, unknown>) {
  void emitEvent({ data: { topic: "allstag.cart.v1", type, key, data } }).catch(
    (e) => console.warn("[cart:emit-failed]", type, e),
  );
}

function userKey() {
  if (typeof window === "undefined") return "anon";
  return window.localStorage.getItem("allstag_profile_v1")
    ? (JSON.parse(window.localStorage.getItem("allstag_profile_v1")!).email ?? "anon")
    : "anon";
}

export type CartItem = {
  handle: string;
  size: string;
  title: string;
  image: string;
  price: number;
  mrp: number;
  qty: number;
};

export const lineKey = (handle: string, size: string) => `${handle}::${size}`;

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  savings: number;
  addItem: (product: Product, size: string, qty?: number) => void;
  removeItem: (handle: string, size: string) => void;
  updateQty: (handle: string, size: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartCtx | null>(null);
const STORAGE_KEY = "allstag_cart_v3";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
    const savings = items.reduce((n, i) => n + (i.mrp - i.price) * i.qty, 0);
    return {
      items,
      count,
      subtotal,
      savings,
      addItem: (product, size, qty = 1) => {
        const uid = userKey();
        emit("cart.item_added", uid, { userId: uid, handle: product.handle, size, qty });
        setItems((prev) => {
          const idx = prev.findIndex((i) => i.handle === product.handle && i.size === size);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], qty: next[idx].qty + qty };
            return next;
          }
          return [
            ...prev,
            {
              handle: product.handle,
              size,
              title: product.title,
              image: product.image,
              price: product.price,
              mrp: product.mrp,
              qty,
            },
          ];
        });
      },
      removeItem: (handle, size) => {
        const uid = userKey();
        emit("cart.item_removed", uid, { userId: uid, handle, size });
        setItems((prev) => prev.filter((i) => !(i.handle === handle && i.size === size)));
      },
      updateQty: (handle, size, qty) =>
        setItems((prev) =>
          prev
            .map((i) => (i.handle === handle && i.size === size ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
        ),
      clear: () => {
        const uid = userKey();
        emit("cart.cleared", uid, { userId: uid });
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
