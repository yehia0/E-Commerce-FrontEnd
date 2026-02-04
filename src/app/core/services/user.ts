import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: Date;
}

export interface UserStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  wishlistItems: number;
  totalSpent: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/account`;

  currentUser = signal<UserProfile | null>(null);
  isLoading = signal(false);

  loadCurrentUser(): void {
    this.isLoading.set(true);
    this.getUserProfile().subscribe({
      next: (response) => {
        this.currentUser.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getUserProfile(): Observable<{ success: boolean; data: UserProfile }> {
    return this.http.get<{ success: boolean; data: UserProfile }>(`${this.apiUrl}/profile`);
  }

  updateProfile(data: Partial<UserProfile>): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, data).pipe(
      tap(() => this.loadCurrentUser())
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/password`, {
      currentPassword,
      newPassword
    });
  }

  getUserStats(): Observable<UserStats> {
    return this.http.get<any>(`${environment.apiUrl}/orders`).pipe(
      map((response: any) => {
        const orders = response.data || [];

        const totalSpent = orders
          .filter((order: any) => order.status === 'delivered')
          .reduce((sum: number, order: any) => {
            return sum + (order.finalAmount || order.totalAmount || 0);
          }, 0);

        return {
          totalOrders: orders.length,
          pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
          completedOrders: orders.filter((o: any) => o.status === 'delivered').length,
          wishlistItems: 0,
          totalSpent: totalSpent
        };
      })
    );
  }

  getInitials(): string {
    const user = this.currentUser();
    if (!user) return '';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  getFullName(): string {
    const user = this.currentUser();
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  }
}
