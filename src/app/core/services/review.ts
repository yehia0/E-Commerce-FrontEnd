import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Review,
  CreateReviewRequest,
  UpdateReviewRequest
} from '../models/review';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reviews`;
  private adminApiUrl = `${environment.apiUrl}/admin/reviews`; // ✅ Fixed: Separate admin URL

  // ===================================
  // Customer/Public Endpoints
  // ===================================

  getProductReviews(productId: string): Observable<Review[]> {
    return this.http.get<ApiResponse<Review[]>>(`${this.apiUrl}/product/${productId}`)
      .pipe(
        map(response => response.data || [])
      );
  }

  createReview(reviewData: CreateReviewRequest): Observable<Review> {
    return this.http.post<ApiResponse<Review>>(this.apiUrl, reviewData)
      .pipe(
        map(response => response.data)
      );
  }

  updateReview(id: string, reviewData: UpdateReviewRequest): Observable<Review> {
    return this.http.put<ApiResponse<Review>>(`${this.apiUrl}/${id}`, reviewData)
      .pipe(
        map(response => response.data)
      );
  }

  deleteReview(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => undefined)
      );
  }

  getMyReviews(): Observable<Review[]> {
    return this.http.get<ApiResponse<Review[]>>(`${this.apiUrl}/my-reviews`)
      .pipe(
        map(response => response.data || [])
      );
  }

  hasUserReviewedProduct(productId: string): Observable<boolean> {
    return this.http.get<ApiResponse<{ hasReviewed: boolean }>>(
      `${this.apiUrl}/check/${productId}`
    ).pipe(
      map(response => response.data?.hasReviewed || false)
    );
  }

  getAllApprovedReviews(limit?: number): Observable<ApiResponse<Review[]>> {
    const params = new HttpParams()
      .set('limit', limit?.toString() || '10');

    return this.http.get<ApiResponse<Review[]>>(this.apiUrl, { params });
  }

  // ===================================
  // Admin Endpoints - Using adminApiUrl
  // ===================================

  /**
   * Get all reviews (admin only)
   * GET /api/admin/reviews
   */
  getAllReviews(): Observable<Review[]> {
    return this.http.get<ApiResponse<Review[]>>(this.adminApiUrl)
      .pipe(
        map(response => response.data || [])
      );
  }

  /**
   * Get pending reviews (admin only)
   * GET /api/admin/reviews/pending
   */
  getPendingReviews(): Observable<Review[]> {
    return this.http.get<ApiResponse<Review[]>>(`${this.adminApiUrl}/pending`)
      .pipe(
        map(response => response.data || [])
      );
  }

  /**
   * Approve a review (admin only)
   * PUT /api/admin/reviews/:id/approve
   */
  approveReview(reviewId: string): Observable<Review> {
    return this.http.put<ApiResponse<Review>>(
      `${this.adminApiUrl}/${reviewId}/approve`,
      {}
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Reject a review (admin only)
   * PUT /api/admin/reviews/:id/reject
   */
  rejectReview(reviewId: string, reason?: string): Observable<Review> {
    return this.http.put<ApiResponse<Review>>(
      `${this.adminApiUrl}/${reviewId}/reject`,
      { reason }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Delete a review (admin only)
   * DELETE /api/admin/reviews/:id
   */
  adminDeleteReview(reviewId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.adminApiUrl}/${reviewId}`)
      .pipe(
        map(() => undefined)
      );
  }
}
