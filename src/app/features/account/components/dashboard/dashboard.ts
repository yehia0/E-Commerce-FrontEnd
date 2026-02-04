import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../../../core/services/order';
import { WishlistService } from '../../../../core/services/wishlist';
import { UserService } from '../../../../core/services/user';
import { Order } from '../../../../core/models/order';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  wishlistItems: number;
  totalSpent: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private orderService = inject(OrderService);
  private wishlistService = inject(WishlistService);
  private userService = inject(UserService);
  private router = inject(Router);

  stats: DashboardStats = {
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    wishlistItems: 0,
    totalSpent: 0
  };

  recentOrders: Order[] = [];
  isLoading = false;

  wishlistCount = this.wishlistService.wishlistCount;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    this.userService.getUserStats().subscribe({
      next: (stats) => {
        this.stats = {
          totalOrders: stats.totalOrders,
          pendingOrders: stats.pendingOrders,
          completedOrders: stats.completedOrders,
          wishlistItems: this.wishlistCount(),
          totalSpent: stats.totalSpent || 0
        };
      },
      error: () => {}
    });

    this.orderService.getRecentOrders(3).subscribe({
      next: (orders) => {
        this.recentOrders = orders;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });

    this.stats.wishlistItems = this.wishlistCount();
  }

  viewOrderDetails(orderId: string): void {
    this.router.navigate(['/account/orders', orderId]);
  }

  goToOrderTracking(orderId: string): void {
    this.router.navigate(['/account/orders/track', orderId]);
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
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getOrderTotal(order: Order): number {
    return order.finalAmount || order.totalAmount || 0;
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
