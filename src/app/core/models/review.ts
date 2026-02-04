// src/app/core/models/review.ts

export interface Review {
  _id: string;
  userId: string;
  productId: string;
  orderId?: string;
  userName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateReviewRequest {
  productId: string;
  orderId?: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

export interface AdminReviewAction {
  reviewId: string;
  status: 'approved' | 'rejected';
  adminNote?: string;
}
