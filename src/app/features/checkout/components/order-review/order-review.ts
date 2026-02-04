import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../core/services/toast';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation/confirmation';

@Component({
  selector: 'app-order-review',
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './order-review.html',
  styleUrl: './order-review.scss',
})
export class OrderReview {
  private toast = inject(ToastService);

  @Input() shippingAddress: any;
  @Input() paymentMethod: string = '';
  @Input() orderNotes: string = '';
  @Input() cartItems: any[] = [];
  @Input() subtotal: number = 0;
  @Input() shipping: number = 0;
  @Input() discount: number = 0;
  @Input() total: number = 0;

  @Output() placeOrder = new EventEmitter<void>();
  @Output() editShipping = new EventEmitter<void>();
  @Output() editPayment = new EventEmitter<void>();

  showConfirmation = false;
  confirmationConfig = {
    title: 'Confirm Your Order',
    message: 'Are you sure you want to place this order?',
    confirmText: 'Place Order',
    cancelText: 'Review Again',
    type: 'success' as 'success'
  };

  getPaymentMethodName(): string {
    const methods: any = {
      'cod': 'Cash on Delivery',
      'card': 'Credit / Debit Card',
      'wallet': 'Mobile Wallet'
    };
    return methods[this.paymentMethod] || this.paymentMethod;
  }

  onPlaceOrder(): void {
    if (!this.shippingAddress) {
      this.toast.warning('Please add a shipping address');
      return;
    }

    if (!this.paymentMethod) {
      this.toast.warning('Please select a payment method');
      return;
    }

    if (!this.cartItems || this.cartItems.length === 0) {
      this.toast.warning('Your cart is empty');
      return;
    }

    this.showConfirmation = true;
  }

  onConfirmOrder(): void {
    this.showConfirmation = false;
    this.placeOrder.emit();
  }

  onCancelOrder(): void {
    this.showConfirmation = false;
  }

  onEditShipping(): void {
    this.editShipping.emit();
  }

  onEditPayment(): void {
    this.editPayment.emit();
  }

  getProductImage(item: any): string {
    const images = item.product?.images || item.images || [];

    if (!images || images.length === 0) {
      return 'assets/images/placeholder.png';
    }

    const imagePath = images[0];

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const baseUrl = 'http://localhost:5000';
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${cleanPath}`;
  }

  getProductName(item: any): string {
    return item.product?.name || item.productName || item.name || 'Unknown Product';
  }

  getProductPrice(item: any): number {
    return item.price || item.product?.price || 0;
  }
}
