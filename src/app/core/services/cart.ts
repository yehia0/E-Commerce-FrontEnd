import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cart, CartItem, CartResponse } from '../models/cart';

@Injectable({
  providedIn: 'root'
})
export class Carts {
  private apiUrl = `${environment.apiUrl}/cart`;
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private http = inject(HttpClient);
  private cartLoaded = false;

  private readonly EMPTY_CART: Cart = {
    items: [],
    subtotal: 0,
    shipping: 0,
    discount: 0,
    total: 0
  };

  cart = signal<Cart>(this.EMPTY_CART);

  cartItemsCount = computed(() => {
    const currentCart = this.cart();
    return currentCart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  });

  isLoading = signal<boolean>(false);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.loadLocalCart();
      this.loadCart();
    }
  }

  loadCart(): void {
    if (this.isLoading() || this.cartLoaded) {
      return;
    }

    this.isLoading.set(true);

    this.http.get<CartResponse>(this.apiUrl).pipe(
      map(response => this.extractCartFromResponse(response)),
      shareReplay(1),
      catchError(() => of(this.EMPTY_CART))
    ).subscribe({
      next: (cart) => {
        this.cart.set(cart);
        this.saveLocalCart();
        this.isLoading.set(false);
        this.cartLoaded = true;
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  addToCart(productId: string, quantity: number, size?: string, color?: string): Observable<Cart> {
    this.isLoading.set(true);

    return this.http.post<CartResponse>(`${this.apiUrl}/add`, {
      productId,
      quantity,
      size,
      color
    }).pipe(
      map(response => this.extractCartFromResponse(response)),
      tap(cart => {
        this.cart.set(cart);
        this.saveLocalCart();
        this.isLoading.set(false);
        this.cartLoaded = true;
      }),
      catchError((error) => {
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  updateQuantity(itemId: string, quantity: number): Observable<Cart> {
    this.isLoading.set(true);

    return this.http.put<CartResponse>(`${this.apiUrl}/${itemId}`, { quantity }).pipe(
      map(response => this.extractCartFromResponse(response)),
      tap(cart => {
        this.cart.set(cart);
        this.saveLocalCart();
        this.isLoading.set(false);
      }),
      catchError((error) => {
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  removeItem(itemId: string): Observable<Cart> {
    this.isLoading.set(true);

    return this.http.delete<CartResponse>(`${this.apiUrl}/${itemId}`).pipe(
      map(response => this.extractCartFromResponse(response)),
      tap(cart => {
        this.cart.set(cart);
        this.saveLocalCart();
        this.isLoading.set(false);
      }),
      catchError((error) => {
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  applyCoupon(code: string): Observable<Cart> {
    this.isLoading.set(true);

    return this.http.post<CartResponse>(`${this.apiUrl}/coupon`, { code }).pipe(
      map(response => this.extractCartFromResponse(response)),
      tap(cart => {
        this.cart.set(cart);
        this.saveLocalCart();
        this.isLoading.set(false);
      }),
      catchError((error) => {
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  clearCart(): Observable<void> {
    this.isLoading.set(true);

    return this.http.delete<void>(this.apiUrl).pipe(
      tap(() => {
        this.cart.set(this.EMPTY_CART);
        this.clearLocalCart();
        this.isLoading.set(false);
        this.cartLoaded = false;
      }),
      catchError(() => {
        this.cart.set(this.EMPTY_CART);
        this.clearLocalCart();
        this.isLoading.set(false);
        return of(undefined);
      })
    );
  }

  getCart(): Cart {
    return this.cart();
  }

  private extractCartFromResponse(response: CartResponse | any): Cart {
    if (response?.success && response.data) {
      return {
        items: response.data.items || [],
        subtotal: response.data.subtotal || 0,
        shipping: response.data.shippingCost || response.data.shipping || 0,
        discount: response.data.discount || 0,
        total: response.data.total || 0
      };
    }

    if (response?.items !== undefined) {
      return {
        items: response.items || [],
        subtotal: response.subtotal || 0,
        shipping: response.shippingCost || response.shipping || 0,
        discount: response.discount || 0,
        total: response.total || 0
      };
    }

    return { ...this.EMPTY_CART };
  }

  private loadLocalCart(): void {
    if (!this.isBrowser) return;

    try {
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        const cart = JSON.parse(localCart);
        this.cart.set(cart);
      }
    } catch (e) {
      this.clearLocalCart();
    }
  }

  private saveLocalCart(): void {
    if (!this.isBrowser) return;

    try {
      const cartData = this.cart();
      localStorage.setItem('cart', JSON.stringify(cartData));
    } catch (e) {
      // Silent fail
    }
  }

  private clearLocalCart(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem('cart');
  }
}
