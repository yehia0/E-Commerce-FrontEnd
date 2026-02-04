import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WishlistService } from '../../../../core/services/wishlist';
import { Carts } from '../../../../core/services/cart';
import { ToastService } from '../../../../core/services/toast';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation/confirmation';

interface WishlistItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
    rating?: number;
    reviewCount?: number;
  };
  createdAt: string;
  user: string;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
})
export class Wishlist implements OnInit {
  private wishlistService = inject(WishlistService);
  private cartService = inject(Carts);
  private router = inject(Router);
  private toast = inject(ToastService);
  private readonly baseUrl = 'http://localhost:5000';

  wishlistItems: WishlistItem[] = [];
  isLoading = false;

  showRemoveConfirmation = false;
  itemToRemove: string | null = null;
  removeConfirmationConfig = {
    title: 'Remove from Wishlist?',
    message: 'Are you sure you want to remove this item from your wishlist?',
    confirmText: 'Yes, Remove',
    cancelText: 'Cancel',
    type: 'warning' as 'warning'
  };

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.isLoading = true;

    this.wishlistService.getWishlist().subscribe({
      next: (response) => {
        if (response.data && Array.isArray(response.data)) {
          this.wishlistItems = response.data;
        } else {
          this.wishlistItems = [];
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Failed to load wishlist');
      }
    });
  }

  getProductImage(images: string[]): string {
    if (!images || images.length === 0) {
      return 'assets/images/placeholder.png';
    }

    const imagePath = images[0];

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  removeFromWishlist(wishlistItemId: string): void {
    this.itemToRemove = wishlistItemId;
    this.showRemoveConfirmation = true;
  }

  onConfirmRemove(): void {
    this.showRemoveConfirmation = false;

    if (!this.itemToRemove) return;

    this.wishlistService.removeFromWishlist(this.itemToRemove).subscribe({
      next: () => {
        this.toast.success('Item removed from wishlist');
        this.loadWishlist();
        this.itemToRemove = null;
      },
      error: () => {
        this.toast.error('Failed to remove item from wishlist');
        this.itemToRemove = null;
      }
    });
  }

  onCancelRemove(): void {
    this.showRemoveConfirmation = false;
    this.itemToRemove = null;
  }

  moveToCart(item: WishlistItem): void {
    if (item.product.stock <= 0) {
      this.toast.warning('This product is out of stock');
      return;
    }

    this.toast.info('Adding to cart...');

    this.cartService.addToCart(item.product._id, 1).subscribe({
      next: () => {
        this.toast.success(`${item.product.name} moved to cart!`);
        this.wishlistService.removeFromWishlist(item._id).subscribe({
          next: () => {
            this.loadWishlist();
          },
          error: () => {
            this.loadWishlist();
          }
        });
      },
      error: (err) => {
        let errorMessage = 'Failed to move item to cart';

        if (err.status === 401) {
          errorMessage = 'Please login to add items to cart';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }

        this.toast.error(errorMessage);
      }
    });
  }

  goToProduct(productId: string): void {
    this.router.navigate(['/products', productId]);
  }

  getStockStatus(stock: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 3) return 'Low Stock';
    return 'In Stock';
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'stock-out';
    if (stock <= 3) return 'stock-low';
    return 'stock-in';
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  getStars(rating?: number): string[] {
    if (!rating || rating === 0) {
      return ['☆', '☆', '☆', '☆', '☆'];
    }

    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

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

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
