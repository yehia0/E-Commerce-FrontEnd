import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductsResponse } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductS {
  private apiUrl = `${environment.apiUrl}/products`;
  private adminApiUrl = `${environment.apiUrl}/admin/products`; // ✅ Added

  constructor(private http: HttpClient) {}

  getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    subcategory?: string;
    gender?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sort?: string;
  }): Observable<ProductsResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.category) httpParams = httpParams.set('category', params.category);
      if (params.subcategory) httpParams = httpParams.set('subcategory', params.subcategory);
      if (params.gender) httpParams = httpParams.set('gender', params.gender);
      if (params.minPrice) httpParams = httpParams.set('minPrice', params.minPrice.toString());
      if (params.maxPrice) httpParams = httpParams.set('maxPrice', params.maxPrice.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
    }

    return this.http.get<ProductsResponse>(this.apiUrl, { params: httpParams });
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.product || res.data || res)
    );
  }

  getProductBySlug(slug: string): Observable<Product> {
    return this.http.get<any>(`${this.apiUrl}/slug/${slug}`).pipe(
      map(res => res.product || res.data || res)
    );
  }

  getBestSellers(gender: string = 'all', limit: number = 8): Observable<Product[]> {
    const params = new HttpParams()
      .set('gender', gender)
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/featured`, { params }).pipe(
      map(res => {
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res)) return res;
        return [];
      })
    );
  }

  getFeaturedProducts(gender?: string): Observable<Product[]> {
    let params = new HttpParams().set('isFeatured', 'true');
    if (gender) {
      params = params.set('gender', gender);
    }

    return this.http
      .get<ProductsResponse | any>(`${this.apiUrl}/featured`, { params })
      .pipe(
        map(res => {
          if (Array.isArray(res?.products)) return res.products;
          if (Array.isArray(res?.data)) return res.data;
          if (Array.isArray(res)) return res;
          return [];
        })
      );
  }

  getNewArrivals(gender?: string, limit: number = 8): Observable<Product[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (gender && gender !== 'all') {
      params = params.set('gender', gender);
    }

    return this.http
      .get<any>(`${this.apiUrl}/new`, { params })
      .pipe(
        map(res => {
          if (Array.isArray(res?.data)) return res.data;
          if (Array.isArray(res)) return res;
          return [];
        })
      );
  }

  getProductsByCategory(category: string, page = 1, limit = 12): Observable<ProductsResponse> {
    const params = new HttpParams()
      .set('category', category)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ProductsResponse>(this.apiUrl, { params });
  }

  getProductsBySubcategory(subcategory: string, page = 1, limit = 12): Observable<ProductsResponse> {
    const params = new HttpParams()
      .set('subcategory', subcategory)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ProductsResponse>(this.apiUrl, { params });
  }

  getProductsByGender(gender: string, page = 1, limit = 12): Observable<ProductsResponse> {
    const params = new HttpParams()
      .set('gender', gender)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ProductsResponse>(this.apiUrl, { params });
  }

  searchProducts(query: string, page = 1, limit = 12): Observable<ProductsResponse> {
    const params = new HttpParams()
      .set('search', query)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ProductsResponse>(`${this.apiUrl}/search`, { params });
  }

  getRelatedProducts(productId: string, limit = 4): Observable<Product[]> {
    return this.http
      .get<any>(`${this.apiUrl}/${productId}/related?limit=${limit}`)
      .pipe(
        map(res => {
          if (Array.isArray(res?.products)) return res.products;
          if (Array.isArray(res?.data)) return res.data;
          if (Array.isArray(res)) return res;
          return [];
        })
      );
  }

  // ===================================
  // ✅ ADMIN METHODS - Using /admin/products
  // ===================================

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<any>(this.adminApiUrl, product).pipe(
      map(res => res.product || res.data || res)
    );
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<any>(`${this.adminApiUrl}/${id}`, product).pipe(
      map(res => res.product || res.data || res)
    );
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.adminApiUrl}/${id}`);
  }

  updateStock(id: string, stock: number): Observable<Product> {
    return this.http.patch<any>(`${this.adminApiUrl}/${id}/stock`, { stock }).pipe(
      map(res => res.product || res.data || res)
    );
  }

  toggleProductStatus(id: string): Observable<Product> {
    return this.http.patch<any>(`${this.adminApiUrl}/${id}/toggle-status`, {}).pipe(
      map(res => res.product || res.data || res)
    );
  }

  uploadProductImages(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.adminApiUrl}/upload`, formData);
  }

  // ===================================
  // Other Methods (unchanged)
  // ===================================

  getLowStockProducts(threshold = 10): Observable<Product[]> {
    const params = new HttpParams().set('threshold', threshold.toString());
    return this.http.get<any>(`${this.apiUrl}/low-stock`, { params }).pipe(
      map(res => {
        if (Array.isArray(res?.products)) return res.products;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res)) return res;
        return [];
      })
    );
  }

  getProductStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}
