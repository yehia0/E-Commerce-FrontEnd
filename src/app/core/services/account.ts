// src/app/core/services/account.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/account`;

  addAddress(addressData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addresses`, addressData);
  }

  getAddresses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/addresses`);
  }
}
