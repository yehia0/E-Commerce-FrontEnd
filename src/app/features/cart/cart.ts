import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Carts } from '../../core/services/cart';
import { CartItem as CartItemComponent } from './components/cart-item/cart-item';
import { CartSummary } from './components/cart-summary/cart-summary';
import { CartItem } from '../../core/models/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, CartItemComponent, CartSummary],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart implements OnInit {
  private cartService = inject(Carts);
  private router = inject(Router);

  cart = this.cartService.cart;
  isLoading = this.cartService.isLoading;

  ngOnInit(): void {}

  trackByItemId(index: number, item: CartItem): string {
    return item._id;
  }

  onQuantityChange(item: CartItem, quantity: number): void {
    this.cartService.updateQuantity(item._id, quantity).subscribe({
      next: () => {},
      error: () => {
        alert('Failed to update quantity. Please try again.');
      }
    });
  }

  onRemoveItem(item: CartItem): void {
    this.cartService.removeItem(item._id).subscribe({
      next: () => {},
      error: () => {
        alert('Failed to remove item. Please try again.');
      }
    });
  }

  onApplyDiscount(code: string): void {
    this.cartService.applyCoupon(code).subscribe({
      next: () => {
        alert('Discount code applied successfully!');
      },
      error: (err) => {
        alert(err.error?.message || 'Invalid discount code');
      }
    });
  }

  proceedToCheckout(): void {
    const currentCart = this.cart();

    if (currentCart.items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    const priceChangedItems = currentCart.items.filter((item: CartItem) => item.priceChanged);
    if (priceChangedItems.length > 0) {
      alert('Some items have price changes. Please remove and re-add them.');
      return;
    }

    this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }
}
