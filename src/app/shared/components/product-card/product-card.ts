import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../core/models/product';
import { Carts } from '../../../core/services/cart';
import { ToastService } from '../../../core/services/toast';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss'
})
export class ProductCard {
  @Input() product!: Product;

  private cartService = inject(Carts);
  private toast = inject(ToastService);
  private readonly baseUrl = 'http://localhost:5000';

  isAddingToCart = false;
  Math = Math;

  getImageUrl(imagePath?: string): string {
    if (!imagePath) {
      return 'assets/images/placeholder.png';
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  getProductImage(): string {
    const images = this.product?.images;
    if (!images || images.length === 0) {
      return 'assets/images/placeholder.png';
    }
    return this.getImageUrl(images[0]);
  }

  getAverageRating(): number {
    if (this.product.rating !== undefined && this.product.rating !== null) {
      return this.product.rating;
    }

    if (!this.product.reviews || this.product.reviews.length === 0) {
      return 0;
    }

    const sum = this.product.reviews.reduce((acc: number, review: any) => {
      const rating = typeof review === 'object' && 'rating' in review
        ? review.rating
        : 0;
      return acc + rating;
    }, 0);

    return sum / this.product.reviews.length;
  }

  getReviewCount(): number {
    if (this.product.reviewCount !== undefined && this.product.reviewCount !== null) {
      return this.product.reviewCount;
    }

    return this.product.reviews?.length || 0;
  }

  getStars(rating?: number): string[] {
    const actualRating = rating ?? this.getAverageRating();
    const reviewCount = this.getReviewCount();

    if (!actualRating || actualRating === 0 || reviewCount === 0) {
      return ['☆', '☆', '☆', '☆', '☆'];
    }

    const stars: string[] = [];
    const fullStars = Math.floor(actualRating);
    const hasHalfStar = actualRating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('★');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('★');
      } else {
        stars.push('☆');
      }
    }

    return stars;
  }

  getCategoryName(): string {
    if (!this.product.category) return '';

    if (typeof this.product.category === 'string') {
      return this.product.category;
    }

    return this.product.category.name || '';
  }

  addToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (this.isAddingToCart) {
      return;
    }

    const productId = this.product._id || this.product.id;

    if (!productId) {
      this.toast.error('Error: Product ID not found');
      return;
    }

    if (this.product.stock !== undefined && this.product.stock <= 0) {
      this.toast.warning('Sorry, this product is out of stock.');
      return;
    }

    this.isAddingToCart = true;

    const defaultSize = this.product.sizes && this.product.sizes.length > 0
      ? this.product.sizes[0]
      : undefined;

    const defaultColor = this.product.colors && this.product.colors.length > 0
      ? this.product.colors[0]
      : undefined;

    this.cartService.addToCart(productId, 1, defaultSize, defaultColor).subscribe({
      next: () => {
        this.isAddingToCart = false;
        this.toast.success(`${this.product.name} added to cart!`);
      },
      error: (error) => {
        this.isAddingToCart = false;

        let errorMessage = 'Failed to add item to cart. ';

        if (error.status === 401) {
          errorMessage = 'Please login to add items to cart.';
        } else if (error.status === 404) {
          errorMessage = 'Product not found.';
        } else if (error.status === 400 && error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else {
          errorMessage += 'Please try again.';
        }

        this.toast.error(errorMessage);
      }
    });
  }

  isNewProduct(): boolean {
    return this.product.isNewArrival || this.product.isNew || false;
  }

  isOnSale(): boolean {
    return !!(this.product.oldPrice && this.product.oldPrice > this.product.price);
  }

  isLowStock(): boolean {
    return this.product.stock !== undefined && this.product.stock > 0 && this.product.stock <= 3;
  }
}
