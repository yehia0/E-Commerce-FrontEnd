import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast';

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart-summary.html',
  styleUrl: './cart-summary.scss',
})
export class CartSummary {
  @Input() subtotal: number = 0;
  @Input() shipping: number = 0;
  @Input() discount: number = 0;
  @Input() total: number = 0;
  @Input() couponCode?: string;

  @Output() applyDiscount = new EventEmitter<string>();
  @Output() checkout = new EventEmitter<void>();

  private toastService = inject(ToastService);

  discountCodeInput: string = '';
  isApplyingCoupon: boolean = false;

  ngOnInit(): void {
    if (this.couponCode) {
      this.discountCodeInput = this.couponCode;
    }
  }

  onApplyDiscount(): void {
    const code = this.discountCodeInput.trim();

    if (!code) {
      this.toastService.warning('Please enter a discount code');
      return;
    }

    if (this.couponCode === code) {
      this.toastService.info('This coupon is already applied');
      return;
    }

    this.isApplyingCoupon = true;
    this.applyDiscount.emit(code);

    setTimeout(() => {
      this.isApplyingCoupon = false;
    }, 2000);
  }

  onCheckout(): void {
    this.checkout.emit();
  }

  getShippingText(): string {
    if (this.shipping === 0) {
      return 'Free';
    }
    return `${this.shipping} EGP`;
  }

  getShippingInfo(): string {
    if (this.subtotal >= 500) {
      return '✅ You qualify for free shipping!';
    }
    const remaining = 500 - this.subtotal;
    return `Add ${remaining.toFixed(2)} EGP more for free shipping`;
  }
}
