import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, SubCategory } from '../models/category';

interface CategoryResponse {
  success: boolean;
  data?: Category[];
  categories?: Category[];
}

interface SingleCategoryResponse {
  success: boolean;
  data?: Category;
  category?: Category;
}

interface SubCategoryResponse {
  success: boolean;
  data?: SubCategory[];
  subcategories?: SubCategory[];
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categories`;

  getCategories(): Observable<Category[]> {
    return this.http.get<CategoryResponse>(this.apiUrl).pipe(
      map(response => response.data || response.categories || []),
      catchError(() => of([]))
    );
  }

  getCategoryById(id: string): Observable<Category | null> {
    return this.http.get<SingleCategoryResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response.category || null),
      catchError(() => of(null))
    );
  }

  getSubCategories(categoryId: string): Observable<SubCategory[]> {
    return this.http.get<SubCategoryResponse>(`${this.apiUrl}/${categoryId}/subcategories`).pipe(
      map(response => response.data || response.subcategories || []),
      catchError(() => of([]))
    );
  }

  getAllSubCategories(): Observable<SubCategory[]> {
    return this.http.get<SubCategoryResponse>(`${environment.apiUrl}/subcategories`).pipe(
      map(response => response.data || response.subcategories || []),
      catchError(() => of([]))
    );
  }
}
