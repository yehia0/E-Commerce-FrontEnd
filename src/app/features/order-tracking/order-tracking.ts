import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order';
import { ToastService } from '../../core/services/toast';
import { ConfirmationModalComponent } from '../../shared/components/confirmation/confirmation';
import { Order, OrderItem } from '../../core/models/order';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.scss'
})
export class OrderTracking implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  orderService = inject(OrderService);
  private toast = inject(ToastService);

  orderId: string = '';
  order: Order | null = null;
  loading = true;
  error: string = '';

  showCancelConfirmation = false;
  showReturnModal = false;
  returnReason = '';

  cancelConfirmationConfig = {
    title: 'Cancel Order?',
    message: 'Are you sure you want to cancel this order? This action cannot be undone.',
    confirmText: 'Yes, Cancel Order',
    cancelText: 'No, Keep Order',
    type: 'danger' as 'danger'
  };

  ngOnInit(): void {
    this.orderId = this.route.snapshot.params['id'];

    if (!this.orderId) {
      this.error = 'Order ID is required';
      this.loading = false;
      this.toast.error('Order ID is required');
      return;
    }

    this.loadOrder();
  }

  loadOrder(): void {
    this.loading = true;
    this.error = '';

    this.orderService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: (err) => {
        let errorMessage = 'Failed to load order details';
        if (err.status === 404) {
          errorMessage = 'Order not found';
        } else if (err.status === 401) {
          errorMessage = 'Please login to view order details';
          this.toast.warning(errorMessage);
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: `/order-tracking/${this.orderId}` }
          });
          return;
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }

        this.error = errorMessage;
        this.loading = false;
        this.toast.error(errorMessage);
      }
    });
  }

  getProductImage(item: OrderItem): string {
    const images = item.product?.images || [];

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

  getProductName(item: OrderItem): string {
    return item.product?.name || item.productName || 'Unknown Product';
  }

  getProductPrice(item: OrderItem): number {
    return item.price || item.product?.price || 0;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getStatusIcon(status: string): string {
    return this.orderService.getStatusIcon(status);
  }

  isStatusCompleted(checkStatus: string): boolean {
    if (!this.order) return false;

    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(this.order.status);
    const checkIndex = statusOrder.indexOf(checkStatus);

    return checkIndex <= currentIndex && currentIndex !== -1;
  }

  isStatusActive(checkStatus: string): boolean {
    return this.order?.status === checkStatus;
  }

  getEstimatedDelivery(): Date | null {
    if (!this.order) return null;
    return this.orderService.getEstimatedDelivery(this.order);
  }

  canCancelOrder(): boolean {
    return this.order ? this.orderService.canCancelOrder(this.order) : false;
  }

  canReturnOrder(): boolean {
    return this.order ? this.orderService.canReturnOrder(this.order) : false;
  }

  cancelOrder(): void {
    if (!this.order) return;
    this.showCancelConfirmation = true;
  }

  onConfirmCancel(): void {
    this.showCancelConfirmation = false;

    if (!this.order) return;

    this.orderService.cancelOrder(this.order._id).subscribe({
      next: () => {
        this.toast.success('Order cancelled successfully');
        this.loadOrder();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to cancel order');
      }
    });
  }

  onCancelCancel(): void {
    this.showCancelConfirmation = false;
  }

  requestReturn(): void {
    if (!this.order) return;
    this.returnReason = '';
    this.showReturnModal = true;
  }

  onSubmitReturn(): void {
    if (!this.order) return;

    if (!this.returnReason.trim()) {
      this.toast.warning('Please provide a reason for return');
      return;
    }

    if (this.returnReason.trim().length < 10) {
      this.toast.warning('Please provide a more detailed reason (at least 10 characters)');
      return;
    }

    this.showReturnModal = false;
    this.toast.info('Submitting return request...');

    this.orderService.requestReturn(this.order._id, this.returnReason.trim()).subscribe({
      next: (response) => {
        this.toast.success(response.message || 'Return request submitted successfully');
        this.returnReason = '';
        this.loadOrder();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to submit return request');
        this.returnReason = '';
      }
    });
  }

  onCancelReturn(): void {
    this.showReturnModal = false;
    this.returnReason = '';
  }

  goToOrderDetails(): void {
    if (!this.order) return;
    this.router.navigate(['/account/orders', this.order._id]);
  }

  goToMyOrders(): void {
    this.router.navigate(['/account']);
  }

  contactSupport(): void {
    this.router.navigate(['/contact']);
  }

  refreshOrder(): void {
    this.toast.info('Refreshing order details...');
    this.loadOrder();
  }
}
