// src/app/core/models/cart.ts

import { Product } from './product';

export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  size?: string;
  color?: string;
  price: number;
  priceChanged?: boolean;
}

export interface Cart {
  _id?: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface UpdateCartRequest {
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  data?: Cart;
  cart?: Cart;
  message?: string;
}
