import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Admin } from '../../../core/services/admin';

interface ProductSales {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  soldCount: number;
  revenue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private adminService = inject(Admin);

  stats: any = null;
  loading = true;
  error = '';
  topProducts: ProductSales[] = [];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';

    // Load dashboard stats (now includes topProducts automatically)
    this.adminService.getDashboardStats().subscribe({
      next: (response: any) => {
        this.stats = response.data ? response.data : response;

        // Top products are now included in dashboard stats
        this.topProducts = this.stats.topProducts || [];

        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load dashboard data';
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: any = {
      pending: 'status-warning',
      confirmed: 'status-info',
      preparing: 'status-info',
      shipped: 'status-primary',
      delivered: 'status-success',
      cancelled: 'status-danger',
      refused: 'status-danger'
    };
    return classes[status] || 'status-default';
  }

  getProductImage(product: ProductSales): string {
    if (!product.images || product.images.length === 0) {
      return '🛍️'; // Fallback emoji
    }

    const imagePath = product.images[0];

    // If it's already a full URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Build full URL
    const baseUrl = 'http://localhost:5000';
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${cleanPath}`;
  }
}
