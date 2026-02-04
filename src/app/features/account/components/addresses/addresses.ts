import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddressService, Address } from '../../../../core/services/address';
import { ToastService } from '../../../../core/services/toast';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation/confirmation';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './addresses.html',
  styleUrl: './addresses.scss',
})
export class Addresses implements OnInit {
  private addressService = inject(AddressService);
  private toast = inject(ToastService);

  addresses = this.addressService.addresses;
  isLoading = this.addressService.isLoading;

  showAddForm: boolean = false;
  editingAddress: Address | null = null;

  newAddress = {
    type: 'home' as 'home' | 'office' | 'other',
    addressLine: '',
    city: '',
    state: '',
    phone: '',
    isDefault: false
  };

  showDeleteConfirmation = false;
  addressToDelete: string | null = null;
  deleteConfirmationConfig = {
    title: 'Delete Address?',
    message: 'Are you sure you want to delete this address? This action cannot be undone.',
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel',
    type: 'danger' as 'danger'
  };

  ngOnInit(): void {
    this.addressService.loadAddresses();
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  editAddress(address: Address): void {
    this.editingAddress = address;
    this.newAddress = {
      type: address.type,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      phone: address.phone || '',
      isDefault: address.isDefault || false
    };
    this.showAddForm = true;

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  deleteAddress(addressId: string): void {
    this.addressToDelete = addressId;
    this.showDeleteConfirmation = true;
  }

  onConfirmDelete(): void {
    this.showDeleteConfirmation = false;

    if (!this.addressToDelete) return;

    this.addressService.deleteAddress(this.addressToDelete).subscribe({
      next: () => {
        this.toast.success('Address deleted successfully!');
        this.addressToDelete = null;
      },
      error: () => {
        this.toast.error('Failed to delete address');
        this.addressToDelete = null;
      }
    });
  }

  onCancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.addressToDelete = null;
  }

  setDefaultAddress(addressId: string): void {
    this.addressService.setDefaultAddress(addressId).subscribe({
      next: () => {
        this.toast.success('Default address updated!');
      },
      error: () => {
        this.toast.error('Failed to set default address');
      }
    });
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.toast.warning('Please fill in all required fields');
      return;
    }

    if (this.editingAddress && this.editingAddress._id) {
      this.addressService.updateAddress(this.editingAddress._id, this.newAddress).subscribe({
        next: () => {
          this.toast.success('Address updated successfully!');
          this.resetForm();
          this.showAddForm = false;
        },
        error: () => {
          this.toast.error('Failed to update address');
        }
      });
    } else {
      this.addressService.createAddress(this.newAddress).subscribe({
        next: () => {
          this.toast.success('Address added successfully!');
          this.resetForm();
          this.showAddForm = false;
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Failed to add address';
          this.toast.error(errorMessage);
        }
      });
    }
  }

  resetForm(): void {
    this.newAddress = {
      type: 'home',
      addressLine: '',
      city: '',
      state: '',
      phone: '',
      isDefault: false
    };
    this.editingAddress = null;
  }

  isFormValid(): boolean {
    return !!(
      this.newAddress.addressLine?.trim() &&
      this.newAddress.city?.trim() &&
      this.newAddress.state?.trim()
    );
  }

  getAddressType(type: string): string {
    const types: { [key: string]: string } = {
      'home': 'Home',
      'office': 'Office',
      'other': 'Other'
    };
    return types[type] || type;
  }

  getFullAddress(address: Address): string {
    const parts = [
      address.addressLine,
      address.city,
      address.state
    ].filter(Boolean);
    return parts.join(', ');
  }
}
