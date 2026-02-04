import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductS } from '../../core/services/product';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { Product } from '../../core/models/product';
import { ReviewService } from '../../core/services/review';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCard, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {

  private productService = inject(ProductS);
  private reviewService = inject(ReviewService);
  private router = inject(Router);
  private toast = inject(ToastService);

  menBestSellers: Product[] = [];
  womenBestSellers: Product[] = [];
  menNewArrivals: Product[] = [];
  womenNewArrivals: Product[] = [];

  customerReviews: any[] = [];
  currentReviewIndex = 0;

  searchSuggestions: Product[] = [];
  showSuggestions = false;
  isSearching = false;

  loading = true;
  loadingReviews = false;
  searchQuery = '';

  ngOnInit(): void {
    this.loadProducts();
    this.loadRecentReviews();
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll);
    }
  }

  private setupScrollListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScroll.bind(this));
    }
  }

  private handleScroll = (): void => {
    if (this.showSuggestions) {
      this.showSuggestions = false;
    }
  };

  loadRecentReviews(): void {
    this.loadingReviews = true;

    this.reviewService.getAllApprovedReviews(10).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customerReviews = response.data
            .filter((r: any) => r.rating >= 4)
            .slice(0, 6);

          if (this.customerReviews.length > 0) {
            this.startReviewRotation();
          }
        }
        this.loadingReviews = false;
      },
      error: () => {
        this.loadingReviews = false;
      }
    });
  }

  startReviewRotation(): void {
    setInterval(() => {
      if (this.customerReviews.length > 0) {
        this.currentReviewIndex = (this.currentReviewIndex + 1) % this.customerReviews.length;
      }
    }, 5000);
  }

  getVisibleReviews(): any[] {
    if (this.customerReviews.length === 0) return [];

    const reviews = [];
    const seen = new Set();

    for (let i = 0; i < 3; i++) {
      const index = (this.currentReviewIndex + i) % this.customerReviews.length;
      const review = this.customerReviews[index];

      if (!seen.has(review._id)) {
        reviews.push(review);
        seen.add(review._id);
      }
    }

    return reviews;
  }

  nextReview(): void {
    this.currentReviewIndex = (this.currentReviewIndex + 1) % this.customerReviews.length;
  }

  previousReview(): void {
    this.currentReviewIndex =
      (this.currentReviewIndex - 1 + this.customerReviews.length) % this.customerReviews.length;
  }

  getStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  getUserName(review: any): string {
    if (review.user && typeof review.user === 'object') {
      const firstName = review.user.firstName || '';
      const lastName = review.user.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'Anonymous';
    }
    return 'Anonymous';
  }

  getUserInitials(review: any): string {
    const name = this.getUserName(review);
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0].charAt(0) + names[1].charAt(0);
    }
    return name.charAt(0);
  }

  getProductName(review: any): string {
    if (review.product && typeof review.product === 'object') {
      return review.product.name || 'Product';
    }
    return 'Product';
  }

  getProductImageUrl(product: Product): string {
    if (product.images && product.images[0]) {
      const imagePath = product.images[0];
      if (imagePath.startsWith('http')) {
        return imagePath;
      }
      return `http://localhost:5000${imagePath}`;
    }
    return 'assets/images/placeholder.png';
  }

  searchProducts(): void {
    if (!this.searchQuery || this.searchQuery.trim().length === 0) {
      this.toast.warning('Please enter a search term');
      return;
    }

    this.showSuggestions = false;

    this.router.navigate(['/products'], {
      queryParams: { search: this.searchQuery.trim() }
    });
  }

  onSearchInput(): void {
    const query = this.searchQuery.trim();

    if (query.length < 2) {
      this.searchSuggestions = [];
      this.showSuggestions = false;
      return;
    }

    this.isSearching = true;

    this.productService.getProducts({
      search: query,
      limit: 5
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.searchSuggestions = response.data;
          this.showSuggestions = this.searchSuggestions.length > 0;
        }
        this.isSearching = false;
      },
      error: () => {
        this.isSearching = false;
      }
    });
  }

  goToProduct(product: any): void {
    const productId = product._id || product.id;

    if (!productId) {
      this.toast.error('Error: Product ID not found');
      return;
    }

    this.showSuggestions = false;
    this.searchQuery = '';

    setTimeout(() => {
      this.router.navigate(['/product', productId]);
    }, 100);
  }

  hideSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 300);
  }

  onSuggestionsMouseDown(event: MouseEvent): void {
    event.preventDefault();
  }

  onSearchKeypress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchProducts();
    }
  }

  // Load Products with Real Best Sellers
  loadProducts(): void {
    let completedRequests = 0;
    const totalRequests = 4;

    const checkAllComplete = () => {
      completedRequests++;
      if (completedRequests === totalRequests) {
        this.loading = false;
      }
    };

    // Men's Best Sellers
    this.productService.getProducts({ gender: 'men', limit: 4 }).subscribe({
      next: (response) => {
        if (response && response.data && response.data.length > 0) {
          this.menBestSellers = response.data;
        }
        checkAllComplete();
      },
      error: (err) => {
        checkAllComplete();
      }
    });

    // Women's Best Sellers
    this.productService.getProducts({ gender: 'women', limit: 4 }).subscribe({
      next: (response) => {
        if (response && response.data && response.data.length > 0) {
          this.womenBestSellers = response.data;
        }
        checkAllComplete();
      },
      error: (err) => {
        checkAllComplete();
      }
    });

    // Men's New Arrivals
    this.productService.getNewArrivals('men', 4).subscribe({
      next: products => {
        if (products && products.length > 0) {
          this.menNewArrivals = products;
        }
        checkAllComplete();
      },
      error: (err) => {
        checkAllComplete();
      }
    });

    // Women's New Arrivals
    this.productService.getNewArrivals('women', 4).subscribe({
      next: products => {
        if (products && products.length > 0) {
          this.womenNewArrivals = products;
        }
        checkAllComplete();
      },
      error: (err) => {
        checkAllComplete();
      }
    });
  }
}
