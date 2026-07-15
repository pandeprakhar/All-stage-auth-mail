import giraffe from "@/assets/product-giraffe.jpg";
import badIdeas from "@/assets/product-bad-ideas.jpg";
import blaze from "@/assets/product-blaze.jpg";
import olive from "@/assets/product-olive.jpg";
import shirt from "@/assets/product-shirt.jpg";
import tank from "@/assets/product-tank.jpg";
import walnut from "@/assets/product-walnut.jpg";

export type ProductCategory = "Tees" | "Shirts" | "Tanks";

export type Product = {
  handle: string;
  title: string;
  collection: string;
  category: ProductCategory;
  price: number;
  mrp: number;
  image: string;
  altText: string;
  /** Size variants — e.g. "S", "M", "L", "XL" */
  sizes: string[];
  color: string;
  /** Fabric composition */
  fabric: string;
  /** Fabric weight in GSM */
  gsm: number;
  /** Fit / cut */
  fit: string;
  rating: number;
  reviewCount: number;
  badge?: string;
};

export const PRODUCTS: Product[] = [
  {
    handle: "giraffe-oversized-tee",
    title: "Giraffe Oversized Tee",
    collection: "Wild Type",
    category: "Tees",
    price: 899,
    mrp: 1799,
    image: giraffe,
    altText: "Bone-coloured oversized tee with a large hand-drawn giraffe graphic on the chest",
    sizes: ["S", "M", "L", "XL", "XXL"],
    color: "Bone",
    fabric: "100% Combed Cotton · Bio-washed",
    gsm: 240,
    fit: "Oversized · Drop-shoulder",
    rating: 4.8,
    reviewCount: 142,
    badge: "BESTSELLER",
  },
  {
    handle: "bad-ideas-tee",
    title: "Bad Ideas Graphic Tee",
    collection: "Ink Series",
    category: "Tees",
    price: 999,
    mrp: 1999,
    image: badIdeas,
    altText: "Black heavyweight tee with white 'Bad Ideas' typography print",
    sizes: ["S", "M", "L", "XL"],
    color: "Ink Black",
    fabric: "100% Ring-spun Cotton",
    gsm: 260,
    fit: "Boxy · Structured hem",
    rating: 4.9,
    reviewCount: 216,
    badge: "NEW",
  },
  {
    handle: "olive-heavy-tee",
    title: "Olive Heavyweight Tee",
    collection: "Base Layer",
    category: "Tees",
    price: 849,
    mrp: 1699,
    image: olive,
    altText: "Olive green heavyweight cotton tee with ribbed collar",
    sizes: ["S", "M", "L", "XL", "XXL"],
    color: "Olive",
    fabric: "100% Combed Cotton",
    gsm: 250,
    fit: "Relaxed · Regular length",
    rating: 4.7,
    reviewCount: 98,
  },
  {
    handle: "camp-collar-shirt",
    title: "Camp Collar Half-Sleeve Shirt",
    collection: "Summer Cut",
    category: "Shirts",
    price: 1499,
    mrp: 2999,
    image: shirt,
    altText: "Cream camp-collar half-sleeve shirt with wooden buttons",
    sizes: ["S", "M", "L", "XL"],
    color: "Bone Cream",
    fabric: "Cotton-Linen Blend",
    gsm: 180,
    fit: "Boxy · Camp collar",
    rating: 4.6,
    reviewCount: 71,
  },
  {
    handle: "walnut-overshirt",
    title: "Walnut Cord Overshirt",
    collection: "Winter Drop",
    category: "Shirts",
    price: 2499,
    mrp: 4999,
    image: walnut,
    altText: "Walnut brown corduroy overshirt with chest pockets",
    sizes: ["M", "L", "XL"],
    color: "Walnut Brown",
    fabric: "Heavyweight Cotton Corduroy",
    gsm: 320,
    fit: "Boxy · Layerable",
    rating: 4.9,
    reviewCount: 54,
    badge: "LOW STOCK",
  },
  {
    handle: "blaze-racer-tank",
    title: "Blaze Racer Tank",
    collection: "Molten Drop",
    category: "Tanks",
    price: 699,
    mrp: 1399,
    image: blaze,
    altText: "Molten red racer-back tank with raw-cut armholes",
    sizes: ["S", "M", "L", "XL"],
    color: "Molten Red",
    fabric: "Cotton-Modal Rib",
    gsm: 200,
    fit: "Slim · Racer-back",
    rating: 4.7,
    reviewCount: 63,
  },
  {
    handle: "essential-rib-tank",
    title: "Essential Rib Tank",
    collection: "Base Layer",
    category: "Tanks",
    price: 599,
    mrp: 1199,
    image: tank,
    altText: "Ink black ribbed cotton tank top",
    sizes: ["S", "M", "L", "XL"],
    color: "Ink Black",
    fabric: "Ribbed Cotton",
    gsm: 210,
    fit: "Regular · Straight hem",
    rating: 4.8,
    reviewCount: 88,
  },
];

export function getProduct(handle: string) {
  return PRODUCTS.find((p) => p.handle === handle);
}

export function getRelated(handle: string, limit = 4) {
  return PRODUCTS.filter((p) => p.handle !== handle).slice(0, limit);
}

export function getByCategory(cat: string) {
  const c = cat.toLowerCase();
  if (c === "all" || c === "shop-all") return PRODUCTS;
  return PRODUCTS.filter((p) => p.category.toLowerCase() === c);
}

export const CATEGORIES = [
  { handle: "shop-all", label: "Shop All" },
  { handle: "tees", label: "Tees" },
  { handle: "shirts", label: "Shirts" },
  { handle: "tanks", label: "Tanks" },
];
