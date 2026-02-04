import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem as CartItemModel } from '../../../../core/models/cart';
import { ToastService } from '../../../../core/services/toast';
import { ConfirmationModalComponent, ConfirmationConfig } from '../../../../shared/components/confirmation/confirmation';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './cart-item.html',
  styleUrl: './cart-item.scss',
})
export class CartItem {
  @Input() item!: CartItemModel;
  @Output() quantityChange = new EventEmitter<number>();
  @Output() removeItem = new EventEmitter<void>();

  private readonly baseUrl = 'http://localhost:5000';
  private toastService = inject(ToastService);

  showConfirmation = false;
  confirmationConfig: ConfirmationConfig = {
    title: '',
    message: '',
    confirmText: 'Remove',
    cancelText: 'Cancel',
    type: 'danger'
  };

  increaseQuantity(): void {
    const newQuantity = this.item.quantity + 1;

    if (this.item.product.stock && newQuantity > this.item.product.stock) {
      this.toastService.warning(`Only ${this.item.product.stock} items available in stock`);
      return;
    }

    this.quantityChange.emit(newQuantity);
  }

  decreaseQuantity(): void {
    if (this.item.quantity > 1) {
      const newQuantity = this.item.quantity - 1;
      this.quantityChange.emit(newQuantity);
    }
  }

  onRemove(): void {
    this.confirmationConfig = {
      title: 'Remove Item',
      message: `Are you sure you want to remove "${this.item.product.name}" from your cart?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'danger'
    };
    this.showConfirmation = true;
  }

  onConfirmRemove(): void {
    this.showConfirmation = false;
    this.removeItem.emit();
    this.toastService.success(`"${this.item.product.name}" removed from cart`);
  }

  onCancelRemove(): void {
    this.showConfirmation = false;
  }

  // Calculate item total price
  getItemTotal(): number {
    return this.item.price * this.item.quantity;
  }

  // Handle product image display with fallback
  getProductImage(item: CartItemModel): string {
    const images = item.product?.images;

    if (!images || images.length === 0) {
      return 'assets/images/placeholder.png';
    }

    const imagePath = images[0];

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `${this.baseUrl}/${cleanPath}`;
  }

  // Get product name with fallback
  getProductName(item: CartItemModel): string {
    return item.product?.name || 'Product';
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/placeholder.png';
  }

  getSize(): string {
    return this.item.size || this.item.selectedSize || '-';
  }

  getColor(): string {
    return this.item.color || this.item.selectedColor || '-';
  }
}
