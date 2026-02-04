import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ShippingForm } from './components/shipping-form/shipping-form';
import { PaymentMethod } from './components/payment-method/payment-method';
import { OrderReview } from './components/order-review/order-review';
import { Carts } from '../../core/services/cart';
import { OrderService } from '../../core/services/order';
import { AddressService } from '../../core/services/address';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ShippingForm, PaymentMethod, OrderReview],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  private router = inject(Router);
  private cartService = inject(Carts);
  private orderService = inject(OrderService);
  private addressService = inject(AddressService);
  private toast = inject(ToastService);

  currentStep: 1 | 2 | 3 = 1;

  shippingAddress: any = null;
  selectedPaymentMethod: string = 'cod';
  orderNotes: string = '';

  cartItems: any[] = [];
  subtotal: number = 0;
  shipping: number = 0;
  discount: number = 0;
  total: number = 0;

  isPlacingOrder: boolean = false;

  ngOnInit(): void {
    this.loadCheckoutData();
  }

  loadCheckoutData(): void {
    const cart = this.cartService.getCart();

    this.cartItems = cart.items || [];
    this.subtotal = cart.subtotal || 0;
    this.shipping = cart.shipping || 0;
    this.discount = cart.discount || 0;
    this.total = cart.total || 0;

    if (this.cartItems.length === 0) {
      this.toast.warning('Your cart is empty! Please add items before checking out.');
      this.router.navigate(['/cart']);
    }
  }

  onShippingSubmit(address: any): void {
    if (address.addressId) {
      this.shippingAddress = {
        ...address,
        addressId: address.addressId
      };

      this.toast.success('Shipping address selected!');
    } else {
      this.shippingAddress = {
        ...address,
        addressId: 'temp-' + Date.now(),
        fullAddressData: {
          type: (address.type?.toLowerCase() || 'home') as 'home' | 'office' | 'other',
          addressLine: address.address || address.addressLine,
          city: address.city,
          state: address.state,
          phone: address.phone,
          isDefault: address.setAsDefault || address.isDefault || false
        }
      };

      this.toast.success('Shipping address added successfully!');
    }

    this.currentStep = 2;
    this.scrollToTop();
  }

  onPaymentSelect(method: string): void {
    this.selectedPaymentMethod = method;
    this.toast.info(`Payment method: ${method === 'cod' ? 'Cash on Delivery' : method}`);
    this.currentStep = 3;
    this.scrollToTop();
  }

  onOrderNotesChange(notes: string): void {
    this.orderNotes = notes;
  }

  onPlaceOrder(): void {
    if (this.isPlacingOrder) {
      this.toast.warning('Please wait, processing your order...');
      return;
    }

    if (!this.shippingAddress) {
      this.toast.warning('Please provide a shipping address');
      this.currentStep = 1;
      return;
    }

    this.isPlacingOrder = true;

    if (this.shippingAddress.addressId?.startsWith('temp-')) {
      this.toast.info('Saving your address...');

      this.addressService.createAddress(this.shippingAddress.fullAddressData).subscribe({
        next: (response: any) => {
          this.shippingAddress.addressId = response.data._id;
          this.placeOrderNow();
        },
        error: (error) => {
          this.toast.error('Failed to save address: ' + (error.error?.message || error.message || 'Unknown error'));
          this.isPlacingOrder = false;
        }
      });
    } else {
      this.placeOrderNow();
    }
  }

  private placeOrderNow(): void {
    this.toast.info('Processing your order...');

    const orderData = {
      addressId: this.shippingAddress.addressId,
      paymentMethod: 'cash' as 'cash',
      notes: this.orderNotes || undefined
    };

    this.orderService.placeOrder(orderData).subscribe({
      next: (response: any) => {
        const orderData = response.data?.order || response.data || response;
        const orderId = orderData._id || orderData.orderId;
        const orderNumber = orderData.orderId || orderId;

        if (!orderId) {
          this.toast.error('Order placed but could not get order ID');
          this.isPlacingOrder = false;
          return;
        }

        this.cartService.clearCart().subscribe({
          next: () => {},
          error: () => {}
        });

        this.toast.success(`Order placed successfully! Order Number: ${orderNumber}`, 6000);
        this.router.navigate(['/order-tracking', orderId]);
        this.isPlacingOrder = false;
      },
      error: (error) => {
        let errorMessage = 'Failed to place order. Please try again.';

        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.toast.error(errorMessage);
        this.isPlacingOrder = false;
      }
    });
  }

  goToStep(step: 1 | 2 | 3): void {
    if (step < this.currentStep) {
      this.currentStep = step;
      this.scrollToTop();
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    return item.product?.name || item.name || 'Unknown Product';
  }

  getProductPrice(item: any): number {
    return item.product?.price || item.price || 0;
  }
}
