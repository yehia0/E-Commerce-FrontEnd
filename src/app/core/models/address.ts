// src/app/core/models/address.ts

export interface Address {
  _id?: string;
  userId?: string;
  type: 'home' | 'office' | 'other';
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  country?: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAddressRequest {
  type: 'home' | 'office' | 'other';
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  type?: 'home' | 'office' | 'other';
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface AddressResponse {
  success: boolean;
  data?: Address;
  addresses?: Address[];
  message?: string;
}
export interface ShippingAddress {
  _id?: string;
  type: 'home' | 'office' | 'other';
  fullName?: string; // Optional for now, will map from addressLine
  phone?: string;
  addressLine: string; // ✅ Backend uses addressLine
  address?: string; // Alias for addressLine
  city: string;
  state: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}
