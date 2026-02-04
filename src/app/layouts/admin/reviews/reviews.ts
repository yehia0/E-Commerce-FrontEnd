import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../core/services/review';
import { ToastService } from '../../../core/services/toast';
import { Review } from '../../../core/models/review';
import { ConfirmationModalComponent, ConfirmationConfig } from '../../../shared/components/confirmation/confirmation';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './reviews.html',
  styleUrl: './reviews.scss'
})
export class AdminReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private toast = inject(ToastService);

  reviews: Review[] = [];
  pendingReviews: Review[] = [];
  loading = false;
  activeTab: 'pending' | 'all' = 'pending';

  processingIds = new Set<string>();

  showConfirmModal = false;
  confirmConfig: ConfirmationConfig = {
    title: 'Confirm',
    message: 'Are you sure?'
  };
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.loadPendingReviews();
  }

  loadPendingReviews(): void {
    this.loading = true;
    this.reviewService.getPendingReviews().subscribe({
      next: (reviews: any) => {
        this.pendingReviews = reviews;
        this.loading = false;

        if (this.pendingReviews.length > 0) {
          this.toast.info(`${this.pendingReviews.length} pending review(s) found`);
        }
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load pending reviews');
      }
    });
  }

  loadAllReviews(): void {
    this.loading = true;
    this.reviewService.getAllReviews().subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load reviews');
      }
    });
  }

  switchTab(tab: 'pending' | 'all'): void {
    this.activeTab = tab;
    if (tab === 'pending') {
      this.loadPendingReviews();
    } else {
      this.loadAllReviews();
    }
  }

  isProcessing(reviewId: string): boolean {
    return this.processingIds.has(reviewId);
  }

  private showConfirmation(config: ConfirmationConfig, action: () => void): void {
    this.confirmConfig = config;
    this.pendingAction = action;
    this.showConfirmModal = true;
  }

  onModalConfirm(): void {
    this.showConfirmModal = false;
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
  }

  onModalCancel(): void {
    this.showConfirmModal = false;
    this.pendingAction = null;
  }

  approveReview(reviewId: string): void {
    this.showConfirmation(
      {
        title: 'Approve Review',
        message: 'Are you sure you want to approve this review? It will be visible to all users.',
        confirmText: 'Approve',
        cancelText: 'Cancel',
        type: 'success'
      },
      () => this.executeApprove(reviewId)
    );
  }

  private executeApprove(reviewId: string): void {
    this.processingIds.add(reviewId);
    this.reviewService.approveReview(reviewId).subscribe({
      next: () => {
        this.processingIds.delete(reviewId);
        this.toast.success('Review approved successfully!');
        this.pendingReviews = this.pendingReviews.filter(r => r._id !== reviewId);
      },
      error: (err: any) => {
        this.processingIds.delete(reviewId);

        if (err.status === 404) {
          this.toast.warning('Review not found - it may have already been processed');
          this.pendingReviews = this.pendingReviews.filter(r => r._id !== reviewId);
        } else {
          this.toast.error('Failed to approve review');
        }
      }
    });
  }

  rejectReview(reviewId: string): void {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return;

    this.showConfirmation(
      {
        title: 'Reject Review',
        message: reason
          ? `Are you sure you want to reject this review?\n\nReason: ${reason}`
          : 'Are you sure you want to reject this review?',
        confirmText: 'Reject',
        cancelText: 'Cancel',
        type: 'warning'
      },
      () => this.executeReject(reviewId, reason)
    );
  }

  private executeReject(reviewId: string, reason: string): void {
    this.processingIds.add(reviewId);
    this.reviewService.rejectReview(reviewId, reason).subscribe({
      next: () => {
        this.processingIds.delete(reviewId);
        this.toast.success('Review rejected successfully!');
        this.pendingReviews = this.pendingReviews.filter(r => r._id !== reviewId);
      },
      error: (err: any) => {
        this.processingIds.delete(reviewId);

        if (err.status === 404) {
          this.toast.warning('Review not found - it may have already been processed');
          this.pendingReviews = this.pendingReviews.filter(r => r._id !== reviewId);
        } else {
          this.toast.error('Failed to reject review');
        }
      }
    });
  }

  deleteReview(reviewId: string): void {
    this.showConfirmation(
      {
        title: 'Delete Review',
        message: 'Are you sure you want to delete this review permanently? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      },
      () => this.executeDelete(reviewId)
    );
  }

  private executeDelete(reviewId: string): void {
    this.processingIds.add(reviewId);
    this.reviewService.adminDeleteReview(reviewId).subscribe({
      next: () => {
        this.processingIds.delete(reviewId);
        this.toast.success('Review deleted successfully!');
        if (this.activeTab === 'pending') {
          this.pendingReviews = this.pendingReviews.filter(r => r._id !== reviewId);
        } else {
          this.reviews = this.reviews.filter(r => r._id !== reviewId);
        }
      },
      error: (err: any) => {
        this.processingIds.delete(reviewId);

        if (err.status === 404) {
          this.toast.warning('Review not found - it may have already been deleted');
          if (this.activeTab === 'pending') {
            this.pendingReviews = this.pendingReviews.filter(r => r._id !== reviewId);
          } else {
            this.reviews = this.reviews.filter(r => r._id !== reviewId);
          }
        } else {
          this.toast.error('Failed to delete review');
        }
      }
    });
  }

  getStars(rating: number): string {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
