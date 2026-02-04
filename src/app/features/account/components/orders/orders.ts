import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OrderService } from '../../../../core/services/order';
import { ToastService } from '../../../../core/services/toast';
import { Order } from '../../../../core/models/order';
import { ConfirmationModalComponent, ConfirmationConfig } from '../../../../shared/components/confirmation/confirmation';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders implements OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);
  private toast = inject(ToastService);

  orders = this.orderService.orders;
  isLoading = this.orderService.isLoading;

  selectedStatus: string = 'all';
  statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Confirmation Modal
  showConfirmModal = false;
  confirmConfig: ConfirmationConfig = {
    title: 'Confirm',
    message: 'Are you sure?'
  };
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.orderService.loadOrders();
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

  get filteredOrders(): Order[] {
    const allOrders = this.orders();
    if (this.selectedStatus === 'all') {
      return allOrders;
    }
    return allOrders.filter(order => order.status === this.selectedStatus);
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
  }

  viewOrderDetails(orderId: string): void {
    this.router.navigate(['/account/orders', orderId]);
  }

  cancelOrder(orderId: string, orderNumber?: string): void {
    const displayId = orderNumber || orderId;

    this.showConfirmation(
      {
        title: 'Cancel Order',
        message: `Are you sure you want to cancel order ? This action cannot be undone.`,
        confirmText: 'Yes, Cancel Order',
        cancelText: 'Keep Order',
        type: 'danger'
      },
      () => this.executeCancelOrder(orderId, displayId)
    );
  }

  private executeCancelOrder(orderId: string, displayId: string): void {
    this.orderService.cancelOrder(orderId).subscribe({
      next: () => {
        this.toast.success(`Order #${displayId} cancelled successfully!`);
        this.orderService.loadOrders(); // Reload orders
      },
      error: (error) => {
        let errorMessage = 'Failed to cancel order. ';

        if (error.status === 400 && error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 404) {
          errorMessage = 'Order not found.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else {
          errorMessage += 'Please try again later.';
        }

        this.toast.error(errorMessage);
      }
    });
  }

  canCancel(order: Order): boolean {
    return this.orderService.canCancelOrder(order);
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getOrderItemCount(order: Order): number {
    return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  hasOrders(): boolean {
    return this.filteredOrders.length > 0;
  }

  getOrderTotal(order: Order): number {
    return order.finalAmount || order.totalAmount || 0;
  }
}
