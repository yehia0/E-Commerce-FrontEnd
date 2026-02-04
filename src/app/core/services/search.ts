import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface SearchResult {
  products: any[];
  total: number;
  suggestions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/search`;

  search(query: string, filters?: any): Observable<SearchResult> {
    let params = new HttpParams().set('q', query);

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }

    return this.http.get<SearchResult>(this.apiUrl, { params });
  }

  getSearchSuggestions(query: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/suggestions`, {
      params: { q: query }
    });
  }

  getPopularSearches(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/popular`);
  }
}
