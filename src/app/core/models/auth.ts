// src/app/core/models/auth.model.ts
import { User } from './user';

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  data?: {
    token: string;
    user: User;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}
