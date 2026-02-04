// src/app/core/models/product.ts

import { Review } from './review';

// ✅ Category interface
export interface Category {
  _id: string;
  name: string;
  slug: string;
  gender?: string;
  subcategories?: Subcategory[];
}

// ✅ Subcategory interface
export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  category?: string;
}

export interface Product {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  oldPrice?: number;
  stock: number;
  images: string[];
  featured?: boolean;
  sizes?: string[];
  colors?: string[];
  rating?: number;
  reviewCount?: number;
  gender?: 'men' | 'women' | 'unisex';
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isNew?: boolean;
  isActive?: boolean;
  season?: string;
  soldCount?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  status?: string;

  // ✅ Category can be string (ID) or populated object
  category?: string | Category;
  categoryId?: string;

  // ✅ Subcategory can be string (ID) or populated object
  subcategory?: string | Subcategory;
  subCategory?: string | Subcategory; // ✅ Backend uses this naming

  // ✅ ADDED: Reviews - can be populated Review objects or just IDs
  reviews?: Review[] | string[];
}

export interface ProductsResponse {
  success: boolean;
  data?: Product[];
  products?: Product[]; // ✅ Some endpoints use this
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  count?: number;
  totalPages?: number;
}

export interface SingleProductResponse {
  success: boolean;
  data: Product;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  gender?: string;
  size?: string;
  color?: string;
  rating?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}
