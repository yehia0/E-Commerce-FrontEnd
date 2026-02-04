import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.loadUserFromToken();
    }
  }

  private loadUserFromToken(): void {
    const token = this.getToken();
    if (token && this.isTokenValid()) {
      const user = this.getUserFromStorage();
      if (user) {
        this.currentUserSubject.next(user);
      }
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        const token = response.token || response.data?.token;
        const user = response.user || response.data?.user;

        if (response.success && token && user) {
          this.setSession(token, user);
        }
      })
    );
  }

  register(
    firstName: string,
    lastName: string,
    email: string,
    phone: string | undefined,
    password: string
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      firstName,
      lastName,
      email,
      phone,
      password
    }).pipe(
      tap(response => {
        const token = response.token || response.data?.token;
        const user = response.user || response.data?.user;

        if (response.success && token && user) {
          this.setSession(token, user);
        }
      })
    );
  }

  logout(redirectTo?: string): void {
    const wasAdmin = this.isAdmin();

    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    this.currentUserSubject.next(null);

    if (redirectTo) {
      this.router.navigate([redirectTo]);
    } else if (wasAdmin) {
      this.router.navigate(['/admin-login']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && this.isTokenValid();
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() < expiry;
    } catch (error) {
      return false;
    }
  }

  private setSession(token: string, user: User): void {
    this.setToken(token);
    this.setUser(user);
  }

  private getUserFromStorage(): User | null {
    if (!this.isBrowser) return null;

    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        return JSON.parse(userJson);
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  private setToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem('token', token);
    }
  }

  private setUser(user: User): void {
    if (this.isBrowser) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }
}
