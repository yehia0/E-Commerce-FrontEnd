import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Address {
  _id?: string;
  type: 'home' | 'office' | 'other';
  addressLine: string;
  city: string;
  state: string;
  phone?: string;
  isDefault?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/account/addresses`;

  addresses = signal<Address[]>([]);
  isLoading = signal(false);

  loadAddresses(): void {
    this.isLoading.set(true);
    this.http.get<{ success: boolean; data: Address[] }>(`${this.apiUrl}`)
      .subscribe({
        next: (response) => {
          this.addresses.set(response.data || []);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  createAddress(address: Partial<Address>): Observable<any> {
    return this.http.post(`${this.apiUrl}`, address).pipe(
      tap(() => this.loadAddresses())
    );
  }

  updateAddress(id: string, address: Partial<Address>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, address).pipe(
      tap(() => this.loadAddresses())
    );
  }

  deleteAddress(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadAddresses())
    );
  }

  setDefaultAddress(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { isDefault: true }).pipe(
      tap(() => this.loadAddresses())
    );
  }
}
