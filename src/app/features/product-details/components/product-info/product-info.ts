import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-info',
  imports: [CommonModule],
  templateUrl: './product-info.html',
  styleUrl: './product-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductInfo implements OnChanges {
  @Input() product: any;
  @Input() selectedSize: string = '';
  @Input() selectedColor: string = '';
  @Input() quantity: number = 1;

  @Output() sizeChange = new EventEmitter<string>();
  @Output() colorChange = new EventEmitter<string>();
  @Output() quantityChange = new EventEmitter<number>();
  @Output() addToCart = new EventEmitter<void>();
  @Output() addToWishlist = new EventEmitter<void>();

  cachedStars: string = '☆☆☆☆☆';
  cachedRating: number = 0;
  cachedReviewCount: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.calculateProductData();
    }
  }

  private calculateProductData(): void {
    this.cachedRating = this.product?.rating || 0;

    if (this.product?.reviewCount !== undefined && this.product?.reviewCount !== null) {
      this.cachedReviewCount = this.product.reviewCount;
    } else if (this.product?.reviews && Array.isArray(this.product.reviews)) {
      this.cachedReviewCount = this.product.reviews.length;
    } else {
      this.cachedReviewCount = 0;
    }

    this.cachedStars = this.calculateStars(this.cachedRating);
  }

  private calculateStars(rating: number): string {
    if (!rating || rating === 0) {
      return '☆☆☆☆☆';
    }

    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;

    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  }

  get sizes(): string[] {
    return this.product?.sizes || [];
  }

  get colors(): string[] {
    return this.product?.colors || [];
  }

  get isInStock(): boolean {
    return this.product?.stock > 0;
  }

  get stockStatus(): string {
    if (!this.product?.stock) return 'Out of Stock';
    if (this.product.stock <= 5) return `Only ${this.product.stock} left!`;
    return 'In Stock';
  }

  get stockClass(): string {
    if (!this.product?.stock) return 'out-of-stock';
    if (this.product.stock <= 5) return 'low-stock';
    return 'in-stock';
  }

  selectSize(size: string): void {
    this.selectedSize = size;
    this.sizeChange.emit(size);
  }

  selectColor(color: string): void {
    this.selectedColor = color;
    this.colorChange.emit(color);
  }

  increaseQuantity(): void {
    if (this.product?.stock && this.quantity >= this.product.stock) {
      alert('Maximum stock reached!');
      return;
    }
    this.quantity++;
    this.quantityChange.emit(this.quantity);
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
      this.quantityChange.emit(this.quantity);
    }
  }

  onAddToCart(): void {
    this.addToCart.emit();
  }

  onAddToWishlist(): void {
    this.addToWishlist.emit();
  }
}
