import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Order,
  OrderResponse,
  OrdersListResponse,
  CreateOrderRequest,
  OrderItem
} from '../models/order';

interface OrderDetailsResponse {
  success: boolean;
  data: {
    order: Order;
    items: OrderItem[];
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  orders = signal<Order[]>([]);
  isLoading = signal(false);

  loadOrders(): void {
    this.isLoading.set(true);

    this.getOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<OrdersListResponse>(this.apiUrl).pipe(
      map(response => {
        const orders = response.data || response.orders || [];

        return orders.map(order => ({
          ...order,
          orderNumber: order.orderId || order.orderNumber || order._id,
          items: order.items || []
        }));
      })
    );
  }

  getRecentOrders(limit: number = 3): Observable<Order[]> {
    return this.getOrders().pipe(
      map(orders => orders.slice(0, limit))
    );
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<OrderDetailsResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error('Invalid response format');
        }

        const { order, items } = response.data;

        return {
          ...order,
          orderNumber: order.orderId || order.orderNumber || order._id,
          items: items.map(item => ({
            _id: item._id,
            product: item.product || {
              _id: '',
              name: item.productName || 'Product',
              images: []
            },
            productId: item.product?._id || '',
            productName: item.productName,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            price: item.price,
            subtotal: item.subtotal || (item.price * item.quantity)
          }))
        } as Order;
      })
    );
  }

  placeOrder(orderData: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiUrl, orderData).pipe(
      tap(response => {
        if (response.success) {
          this.loadOrders();
        }
      })
    );
  }

  cancelOrder(orderId: string): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(`${this.apiUrl}/${orderId}/cancel`, {}).pipe(
      tap(response => {
        if (response.success) {
          this.loadOrders();
        }
      })
    );
  }

  requestReturn(orderId: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${orderId}/return`, { reason }).pipe(
      tap(() => {
        this.loadOrders();
      })
    );
  }

  canCancelOrder(order: Order): boolean {
    return ['pending', 'confirmed'].includes(order.status);
  }

  canReturnOrder(order: Order): boolean {
    if (order.returnRequest?.requested) {
      return false;
    }

    if (order.status !== 'delivered' || !order.deliveredAt) {
      return false;
    }

    const deliveredDate = new Date(order.deliveredAt);
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceDelivery <= 14;
  }

  getDaysRemainingForReturn(order: Order): number {
    if (!order.deliveredAt) return 0;

    const deliveredDate = new Date(order.deliveredAt);
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(0, 14 - daysSinceDelivery);
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'preparing': 'status-preparing',
      'ready': 'status-ready',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled',
      'refused': 'status-refused',
      'return-requested': 'status-return-requested',
      'returned': 'status-returned'
    };
    return statusClasses[status] || 'status-default';
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready for Shipment',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'refused': 'Refused',
      'return-requested': 'Return Requested',
      'returned': 'Returned'
    };
    return statusLabels[status] || status;
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'pending': '⏳',
      'confirmed': '✓',
      'preparing': '👨‍🍳',
      'ready': '✅',
      'shipped': '🚚',
      'delivered': '✅',
      'cancelled': '❌',
      'refused': '🚫',
      'return-requested': '↩️',
      'returned': '↩️'
    };
    return icons[status] || '📋';
  }

  getEstimatedDelivery(order: Order): Date {
    if (order.deliveredAt) {
      return new Date(order.deliveredAt);
    }

    if (order.estimatedDelivery) {
      return new Date(order.estimatedDelivery);
    }

    const createdDate = new Date(order.createdAt);
    const estimatedDate = new Date(createdDate);
    estimatedDate.setDate(estimatedDate.getDate() + 5);

    return estimatedDate;
  }
}
