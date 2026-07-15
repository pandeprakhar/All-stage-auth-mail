// Shared admin domain types.

export interface Brand {
  id: number | string;
  name: string;
  slug: string;
  logo_url?: string | null;
  status: "active" | "inactive";
  products_count?: number;
  created_at?: string;
}

export interface Category {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  status: "active" | "inactive";
  subcategories_count?: number;
  products_count?: number;
  created_at?: string;
}

export interface Subcategory {
  id: number | string;
  name: string;
  slug: string;
  category_id: number | string;
  category_name?: string;
  status: "active" | "inactive";
  products_count?: number;
  created_at?: string;
}

export interface ProductImage {
  id?: number | string;
  url: string;
  is_primary?: boolean;
}

export interface Product {
  id: number | string;
  name: string;
  slug: string;
  sku?: string | null;
  description?: string | null;
  short_description?: string | null;
  price: number;
  discount_price?: number | null;
  stock: number;
  category_id?: number | string | null;
  category_name?: string;
  subcategory_id?: number | string | null;
  brand_id?: number | string | null;
  brand_name?: string;
  featured: boolean;
  status: "active" | "inactive";
  images?: ProductImage[];
  primary_image_url?: string | null;
  created_at?: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}
