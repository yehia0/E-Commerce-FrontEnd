// src/app/core/models/order.ts

import { Product } from './product';

export interface OrderItem {
  _id?: string;
  product: Product;
  productId: string;
  productName?: string;
  quantity: number;
  size?: string;
  color?: string;
  price: number;
  subtotal?: number;
}

// ✅ Return Request Interface
export interface ReturnRequest {
  requested: boolean;
  requestedAt?: Date;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
  adminResponseAt?: Date;
}

export interface Order {
  _id: string;
  orderId?: string;
  userId: string;
  orderNumber?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'cash';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  totalAmount: number;
  shippingCost: number;
  discount: number;
  finalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'refused' | 'return-requested' | 'returned';
  createdAt: Date;
  updatedAt?: Date;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  trackingNumber?: string;
  notes?: string;
  phone?: string;
  couponCode?: string;
  // ✅ Return Request
  returnRequest?: ReturnRequest;
}

export interface ShippingAddress {
  _id?: string;
  type: 'home' | 'office' | 'other';
  addressLine?: string;
  city: string;
  state: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface CreateOrderRequest {
  items?: {
    productId: string;
    quantity: number;
    size?: string;
    color?: string;
  }[];
  addressId: string;
  paymentMethod: 'cash';
  notes?: string;
  couponCode?: string;
}

export interface OrderResponse {
  success: boolean;
  data?: Order;
  order?: Order;
  message?: string;
}

export interface OrdersListResponse {
  success: boolean;
  data?: Order[];
  orders?: Order[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderStatus {
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'refused' | 'return-requested' | 'returned';
  timestamp: Date;
  note?: string;
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  statusHistory: OrderStatus[];
  estimatedDelivery?: Date;
  trackingNumber?: string;
}
