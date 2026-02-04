import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../../core/services/account';
import { ToastService } from '../../../../core/services/toast';

@Component({
  selector: 'app-shipping-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipping-form.html',
  styleUrl: './shipping-form.scss',
})
export class ShippingForm implements OnInit {
  private accountService = inject(AccountService);
  private toast = inject(ToastService);

  @Output() shippingSubmit = new EventEmitter<any>();

  savedAddresses: any[] = [];
  selectedAddressId: string | null = null;
  showNewAddressForm: boolean = false;
  loadingAddresses: boolean = false;

  newAddress = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    addressLine: '',
    city: '',
    state: '',
    type: 'home' as 'home' | 'office' | 'other',
    setAsDefault: false,
    isDefault: false
  };

  ngOnInit(): void {
    this.loadSavedAddresses();
  }

  loadSavedAddresses(): void {
    this.loadingAddresses = true;

    this.accountService.getAddresses().subscribe({
      next: (response: any) => {
        this.savedAddresses = response.data || response.addresses || response || [];

        if (this.savedAddresses.length > 0) {
          const defaultAddress = this.savedAddresses.find(addr => addr.isDefault);
          this.selectedAddressId = defaultAddress?._id || this.savedAddresses[0]._id;
          this.showNewAddressForm = false;
        } else {
          this.showNewAddressForm = true;
        }

        this.loadingAddresses = false;
      },
      error: (err: any) => {
        if (err.status === 404 || err.status === 401) {
          this.savedAddresses = [];
          this.showNewAddressForm = true;
        } else {
          this.toast.error('Failed to load saved addresses');
        }

        this.loadingAddresses = false;
      }
    });
  }

  selectAddress(addressId: string): void {
    this.selectedAddressId = addressId;
    this.showNewAddressForm = false;
  }

  toggleNewAddressForm(): void {
    this.showNewAddressForm = !this.showNewAddressForm;
    if (this.showNewAddressForm) {
      this.selectedAddressId = null;
    } else {
      if (this.savedAddresses.length > 0) {
        const defaultAddress = this.savedAddresses.find(addr => addr.isDefault);
        this.selectedAddressId = defaultAddress?._id || this.savedAddresses[0]._id;
      }
    }
  }

  onSubmit(): void {
    let address;

    if (this.selectedAddressId) {
      address = this.savedAddresses.find(a => a._id === this.selectedAddressId);

      if (!address) {
        this.toast.error('Selected address not found');
        return;
      }

      this.shippingSubmit.emit({
        ...address,
        addressId: address._id
      });

    } else {
      if (!this.isFormValid()) {
        this.toast.warning('Please fill in all required fields');
        return;
      }

      address = {
        firstName: this.newAddress.firstName.trim(),
        lastName: this.newAddress.lastName.trim(),
        email: this.newAddress.email.trim(),
        phone: this.newAddress.phone.trim(),
        address: this.newAddress.address.trim(),
        addressLine: this.newAddress.address.trim(),
        city: this.newAddress.city.trim(),
        state: this.newAddress.state.trim(),
        type: this.newAddress.type.toLowerCase() as 'home' | 'office' | 'other',
        setAsDefault: this.newAddress.setAsDefault,
        isDefault: this.newAddress.setAsDefault
      };

      this.shippingSubmit.emit(address);
    }
  }

  isFormValid(): boolean {
    if (this.selectedAddressId) {
      return true;
    }

    return !!(
      this.newAddress.firstName?.trim() &&
      this.newAddress.lastName?.trim() &&
      this.newAddress.email?.trim() &&
      this.newAddress.phone?.trim() &&
      this.newAddress.address?.trim() &&
      this.newAddress.city?.trim() &&
      this.newAddress.state?.trim()
    );
  }

  getFullAddress(address: any): string {
    const parts = [
      address.addressLine || address.address,
      address.city,
      address.state
    ].filter(Boolean);
    return parts.join(', ');
  }

  getAddressTypeLabel(type: string): string {
    const labels: any = {
      home: 'Home',
      office: 'Office',
      other: 'Other'
    };
    return labels[type?.toLowerCase()] || 'Home';
  }
}
