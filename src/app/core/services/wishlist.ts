import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/account/wishlist`;

  wishlistCount = signal(0);

  getWishlist(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => {
        this.wishlistCount.set(response.count || 0);
      })
    );
  }

  addToWishlist(productId: string): Observable<any> {
    return this.http.post(this.apiUrl, { productId }).pipe(
      tap(() => {
        this.wishlistCount.update(count => count + 1);
      })
    );
  }

  removeFromWishlist(wishlistItemId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${wishlistItemId}`).pipe(
      tap(() => {
        this.wishlistCount.update(count => Math.max(0, count - 1));
      })
    );
  }

  loadWishlistCount(): void {
    this.getWishlist().subscribe();
  }
}
