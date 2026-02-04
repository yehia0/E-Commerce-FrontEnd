import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../core/services/order';
import { ReviewService } from '../../core/services/review';
import { ToastService } from '../../core/services/toast';
import { Order, OrderItem } from '../../core/models/order';
import { ConfirmationModalComponent, ConfirmationConfig } from '../../shared/components/confirmation/confirmation';

@Component({
  selector: 'app-view-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './view-details.html',
  styleUrl: './view-details.scss',
})
export class ViewDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private reviewService = inject(ReviewService);
  private toast = inject(ToastService);

  order: Order | null = null;
  loading = true;
  error: string | null = null;

  showReviewModal = false;
  selectedProduct: OrderItem | null = null;
  reviewRating = 5;
  reviewComment = '';
  submittingReview = false;

  showReturnModal = false;
  returnReason = '';
  submittingReturn = false;

  showConfirmModal = false;
  confirmConfig: ConfirmationConfig = {
    title: 'Confirm',
    message: 'Are you sure?'
  };
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrderDetails(orderId);
    } else {
      this.error = 'Order ID not found';
      this.loading = false;
      this.toast.error('Order ID not found');
    }
  }

  loadOrderDetails(orderId: string): void {
    this.loading = true;
    this.error = null;

    this.orderService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load order details';
        this.loading = false;
        this.toast.error('Failed to load order details');
      }
    });
  }

  getStatusClass(status: string): string {
    return this.orderService.getStatusClass(status);
  }

  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status);
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getProductImage(item: OrderItem): string {
    const images = item.product?.images;
    if (!images || images.length === 0) {
      return 'assets/images/placeholder.png';
    }

    const imagePath = images[0];
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const baseUrl = 'http://localhost:5000';
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${cleanPath}`;
  }

  canCancelOrder(): boolean {
    if (!this.order) return false;
    return this.orderService.canCancelOrder(this.order);
  }

  canReviewOrder(): boolean {
    return this.order?.status === 'delivered';
  }

  canRequestReturn(): boolean {
    return this.order ? this.orderService.canReturnOrder(this.order) : false;
  }

  getDaysRemainingForReturn(): number {
    return this.order ? this.orderService.getDaysRemainingForReturn(this.order) : 0;
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

  cancelOrder(): void {
    if (!this.order) return;

    this.showConfirmation(
      {
        title: 'Cancel Order',
        message: 'Are you sure you want to cancel this order? This action cannot be undone.',
        confirmText: 'Yes, Cancel',
        cancelText: 'No, Keep It',
        type: 'danger'
      },
      () => this.executeCancelOrder()
    );
  }

  private executeCancelOrder(): void {
    if (!this.order) return;

    this.orderService.cancelOrder(this.order._id).subscribe({
      next: () => {
        this.toast.success('Order cancelled successfully!');
        if (this.order) {
          this.order.status = 'cancelled';
        }
      },
      error: () => {
        this.toast.error('Failed to cancel order');
      }
    });
  }

  trackOrder(): void {
    if (!this.order) return;
    this.router.navigate(['/account/orders/track', this.order._id]);
  }

  goBack(): void {
    this.router.navigate(['/account/orders']);
  }

  openReturnModal(): void {
    this.returnReason = '';
    this.showReturnModal = true;
  }

  closeReturnModal(): void {
    this.showReturnModal = false;
    this.returnReason = '';
  }

  submitReturn(): void {
    if (!this.order) return;

    if (!this.returnReason.trim()) {
      this.toast.warning('Please provide a reason for return');
      return;
    }

    if (this.returnReason.trim().length < 10) {
      this.toast.warning('Please provide a more detailed reason (at least 10 characters)');
      return;
    }

    this.submittingReturn = true;
    this.toast.info('Submitting return request...');

    this.orderService.requestReturn(this.order._id, this.returnReason.trim()).subscribe({
      next: () => {
        this.submittingReturn = false;
        this.toast.success('Return request submitted successfully! We will contact you soon.');
        this.closeReturnModal();
        this.loadOrderDetails(this.order!._id);
      },
      error: (err) => {
        this.submittingReturn = false;
        const errorMsg = err.error?.message || 'Failed to request return';
        this.toast.error(errorMsg);
      }
    });
  }

  openReviewModal(item: OrderItem): void {
    this.selectedProduct = item;
    this.reviewRating = 5;
    this.reviewComment = '';
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedProduct = null;
    this.reviewRating = 5;
    this.reviewComment = '';
  }

  setRating(rating: number): void {
    this.reviewRating = rating;
  }

  getStarArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  submitReview(): void {
    if (!this.selectedProduct || !this.order) {
      return;
    }

    if (!this.reviewComment.trim()) {
      this.toast.warning('Please write a review');
      return;
    }

    if (this.reviewRating < 1 || this.reviewRating > 5) {
      this.toast.warning('Please select a rating between 1 and 5 stars');
      return;
    }

    this.submittingReview = true;
    this.toast.info('Submitting your review...');

    const productId = this.selectedProduct.productId;

    if (!productId) {
      this.toast.error('Product ID not found. Please try again.');
      this.submittingReview = false;
      return;
    }

    const reviewData = {
      productId: productId,
      rating: this.reviewRating,
      comment: this.reviewComment.trim(),
      orderId: this.order._id
    };

    this.reviewService.createReview(reviewData).subscribe({
      next: () => {
        this.submittingReview = false;
        this.toast.success('Review submitted successfully! It will be visible after admin approval.');
        this.closeReviewModal();
      },
      error: (err: any) => {
        this.submittingReview = false;
        const errorMessage = err.error?.message || 'Failed to submit review. Please try again.';
        this.toast.error(errorMessage);
      }
    });
  }
}
