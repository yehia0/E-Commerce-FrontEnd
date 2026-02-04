// src/app/core/models/category.ts

export interface Category {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  subcategories?: SubCategory[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubCategory {
  _id: string;
  name: string;
  slug?: string;
  category: string | Category;
  description?: string;
  image?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryResponse {
  success: boolean;
  data?: Category[];
  categories?: Category[];
}

export interface SingleCategoryResponse {
  success: boolean;
  data?: Category;
  category?: Category;
}

export interface SubCategoryResponse {
  success: boolean;
  data?: SubCategory[];
  subcategories?: SubCategory[];
}
