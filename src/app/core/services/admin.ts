import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product';

interface DashboardStats {
  success: boolean;
  data: {
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalUsers: number;
    totalCustomers?: number;
    totalAdmins?: number;
    pendingOrders: number;
    pendingReviews?: number;
    lowStockProducts: number;
    revenue30Days?: number;
    recentOrders: any[];
    topProducts: any[];
  };
}

interface AdminProductsResponse {
  success: boolean;
  data?: Product[];
  products?: Product[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totalPages?: number;
}

interface AdminProductResponse {
  success: boolean;
  data?: Product;
  product?: Product;
}

interface ImageUploadResponse {
  success: boolean;
  data?: string[];
  imageUrls?: string[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Admin {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin/dashboard`);
  }

  getTopSellingProducts(limit: number = 5, period: string = '30days'): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/dashboard/top-products`, {
      params: new HttpParams()
        .set('limit', limit.toString())
        .set('period', period)
    });
  }

  getSalesReport(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get(`${this.apiUrl}/admin/reports/sales`, { params });
  }

  downloadSalesReportPDF(startDate?: string, endDate?: string): Observable<Blob> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get(`${this.apiUrl}/admin/reports/sales/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  downloadSalesReportExcel(startDate?: string, endDate?: string): Observable<Blob> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get(`${this.apiUrl}/admin/reports/sales/excel`, {
      params,
      responseType: 'blob'
    });
  }

  // ===================================
  // ✅ FIXED: Product Methods - Using /admin/products
  // ===================================

  getAllProducts(page = 1, limit = 10, filters?: any): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }

    return this.http.get<AdminProductsResponse>(`${this.apiUrl}/products`, { params }).pipe(
      map(response => ({
        products: response.data || response.products || [],
        totalPages: response.pagination?.totalPages || response.totalPages || 1,
        total: response.pagination?.total || 0,
        page: response.pagination?.page || page
      }))
    );
  }

  createProduct(productData: any): Observable<any> {
    return this.http.post<AdminProductResponse>(`${this.apiUrl}/admin/products`, productData).pipe(
      map(response => response.data || response.product || response)
    );
  }

  updateProduct(id: string, productData: any): Observable<any> {
    return this.http.put<AdminProductResponse>(`${this.apiUrl}/admin/products/${id}`, productData).pipe(
      map(response => response.data || response.product || response)
    );
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/products/${id}`);
  }

  uploadProductImages(formData: FormData): Observable<ImageUploadResponse> {
    return this.http.post<ImageUploadResponse>(`${this.apiUrl}/admin/products/upload`, formData).pipe(
      map(response => ({
        success: response.success,
        imageUrls: response.data || response.imageUrls || [],
        message: response.message
      }))
    );
  }

  // ===================================
  // Order Methods
  // ===================================

  getAllOrders(page = 1, limit = 100, status?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get(`${this.apiUrl}/admin/orders`, { params });
  }

  updateOrderStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/orders/${id}/status`, { status });
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/orders/${id}`);
  }

  getReturnRequests(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/orders/returns`);
  }

  handleReturnRequest(orderId: string, data: { action: 'approve' | 'reject', adminResponse: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/orders/returns/${orderId}`, data);
  }

  // ===================================
  // User Methods
  // ===================================

  getAllUsers(page = 1, limit = 50, filters?: any): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.role) params = params.set('role', filters.role);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get(`${this.apiUrl}/admin/users`, { params });
  }

  getUserById(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users/${userId}`);
  }

  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users`, userData);
  }

  updateUser(userId: string, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}`, userData);
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${userId}`);
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/role`, { role });
  }

  toggleUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/users/${userId}/status`, { status });
  }

  getUserStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users/stats`);
  }

  searchUsers(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users/search`, {
      params: new HttpParams().set('q', query)
    });
  }

  getUsersByRole(role: 'admin' | 'customer'): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users/role/${role}`);
  }

  getUsersByStatus(status: 'active' | 'inactive' | 'suspended'): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users/status/${status}`);
  }

  getUserOrders(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users/${userId}/orders`);
  }

  resetUserPassword(userId: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users/${userId}/reset-password`, {
      newPassword
    });
  }

  bulkUpdateUsers(userIds: string[], updateData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/bulk`, {
      userIds,
      updateData
    });
  }

  bulkDeleteUsers(userIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users/bulk-delete`, {
      userIds
    });
  }

  // ===================================
  // Category Methods
  // ===================================

  getAllCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories`);
  }

  getCategoryById(categoryId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories/${categoryId}`);
  }

  createCategory(categoryData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories`, categoryData);
  }

  updateCategory(categoryId: string, categoryData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/${categoryId}`, categoryData);
  }

  deleteCategory(categoryId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${categoryId}`);
  }

  getAllSubcategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/subcategories`);
  }

  createSubcategory(categoryId: string, subcategoryData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories/${categoryId}/subcategories`, subcategoryData);
  }

  updateSubcategory(subcategoryId: string, subcategoryData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/subcategories/${subcategoryId}`, subcategoryData);
  }

  deleteSubcategory(subcategoryId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subcategories/${subcategoryId}`);
  }
}
