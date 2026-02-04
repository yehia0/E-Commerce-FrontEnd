import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductImages } from './components/product-images/product-images';
import { ProductInfo } from './components/product-info/product-info';
import { ProductReviews } from './components/product-reviews/product-reviews';
import { ProductS } from '../../core/services/product';
import { Carts } from '../../core/services/cart';
import { WishlistService } from '../../core/services/wishlist';
import { ReviewService } from '../../core/services/review';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, ProductImages, ProductInfo, ProductReviews],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails implements OnInit {
  private productService = inject(ProductS);
  private cartService = inject(Carts);
  private wishlistService = inject(WishlistService);
  private reviewService = inject(ReviewService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  productId: string = '';
  product: any = null;
  relatedProducts: any[] = [];
  reviews: any[] = [];
  loading = true;
  loadingReviews = false;
  loadingRelated = false;

  activeTab: 'description' | 'reviews' | 'shipping' = 'description';

  selectedSize: string = '';
  selectedColor: string = '';
  quantity: number = 1;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productId = params['id'];
      this.loadProductDetails();
      this.loadProductReviews();
    });
  }

  loadProductDetails(): void {
    this.loading = true;

    this.productService.getProduct(this.productId).subscribe({
      next: (data) => {
        this.product = data;
        this.loading = false;

        if (this.product.sizes && this.product.sizes.length > 0) {
          this.selectedSize = this.product.sizes[0];
        }
        if (this.product.colors && this.product.colors.length > 0) {
          this.selectedColor = this.product.colors[0];
        }

        // Load related products after product is loaded
        this.loadRelatedProducts();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load product details');
      }
    });
  }

  loadRelatedProducts(): void {
    if (!this.product) return;

    // Extract IDs from category/subcategory objects
    const subcategoryId = typeof this.product.subcategory === 'object'
      ? (this.product.subcategory._id || this.product.subcategory.id)
      : this.product.subcategory;

    const categoryId = typeof this.product.category === 'object'
      ? (this.product.category._id || this.product.category.id)
      : this.product.category;

    // Try subcategory first, then category
    if (subcategoryId) {
      this.loadRelatedProductsBySubcategory(subcategoryId);
    } else if (categoryId) {
      this.loadRelatedProductsByCategory(categoryId);
    }
  }

  loadProductReviews(): void {
    this.loadingReviews = true;

    this.reviewService.getProductReviews(this.productId).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.loadingReviews = false;
      },
      error: () => {
        this.reviews = [];
        this.loadingReviews = false;
      }
    });
  }

  loadRelatedProductsBySubcategory(subcategoryId: string): void {
    this.loadingRelated = true;

    this.productService.getProducts({
      subcategory: subcategoryId,
      limit: 8, // Increased limit to have more options after filtering
      sort: '-rating'
    }).subscribe({
      next: (response) => {

        // Handle different response structures
        const products = Array.isArray(response) ? response : (response.data || response.products || []);

        // Get current product ID (handle both _id and id)
        const currentProductId = this.product._id || this.product.id || this.productId;

        // Filter and limit related products
        this.relatedProducts = products
          .filter((p: any) => {
            const productId = p._id || p.id;
            return productId && productId !== currentProductId;
          })
          .slice(0, 4);


        this.loadingRelated = false;

        // Fallback to category if no related products found
        if (this.relatedProducts.length === 0) {
          const categoryId = typeof this.product.category === 'object'
            ? (this.product.category._id || this.product.category.id)
            : this.product.category;

          if (categoryId) {
            this.loadRelatedProductsByCategory(categoryId);
          }
        }
      },
      error: (err) => {
        this.relatedProducts = [];
        this.loadingRelated = false;

        // Fallback to category on error
        if (this.product.category) {
          const categoryId = typeof this.product.category === 'object'
            ? (this.product.category._id || this.product.category.id)
            : this.product.category;

          if (categoryId) {
            this.loadRelatedProductsByCategory(categoryId);
          }
        }
      }
    });
  }

  loadRelatedProductsByCategory(categoryId: string): void {
    // Prevent loading if already loading
    if (this.loadingRelated && this.relatedProducts.length > 0) {
      return;
    }

    this.loadingRelated = true;

    this.productService.getProducts({
      category: categoryId,
      limit: 8, // Increased limit
      sort: '-rating'
    }).subscribe({
      next: (response) => {

        // Handle different response structures
        const products = Array.isArray(response) ? response : (response.data || response.products || []);

        // Get current product ID
        const currentProductId = this.product._id || this.product.id || this.productId;

        // Filter and limit related products
        this.relatedProducts = products
          .filter((p: any) => {
            const productId = p._id || p.id;
            return productId && productId !== currentProductId;
          })
          .slice(0, 4);


        this.loadingRelated = false;
      },
      error: (err) => {
        this.relatedProducts = [];
        this.loadingRelated = false;
      }
    });
  }

  onSizeChange(size: string): void {
    this.selectedSize = size;
  }

  onColorChange(color: string): void {
    this.selectedColor = color;
  }

  onQuantityChange(quantity: number): void {
    this.quantity = quantity;
  }

  addToCart(): void {
    if (!this.product) {
      this.toast.error('No product to add');
      return;
    }

    const productId = this.product._id || this.product.id;

    this.cartService.addToCart(
      productId,
      this.quantity,
      this.selectedSize,
      this.selectedColor
    ).subscribe({
      next: () => {
        this.toast.success(
          `${this.product.name} added to cart!${this.selectedSize ? '\nSize: ' + this.selectedSize : ''}${this.selectedColor ? '\nColor: ' + this.selectedColor : ''}`
        );
      },
      error: (err) => {
        let errorMessage = 'Failed to add item to cart';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.status === 401) {
          errorMessage = 'Please login first';
        } else if (err.status === 404) {
          errorMessage = 'Product not found';
        }

        this.toast.error(errorMessage);
      }
    });
  }

  addToWishlist(): void {
    if (!this.product) {
      this.toast.error('No product to add to wishlist');
      return;
    }

    const productId = this.product._id || this.product.id;

    this.wishlistService.addToWishlist(productId).subscribe({
      next: () => {
        this.toast.success(`${this.product.name} added to wishlist!`);
      },
      error: (err) => {
        let errorMessage = 'Failed to add to wishlist';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.status === 401) {
          errorMessage = 'Please login first';
        } else if (err.status === 400 && err.error?.message?.includes('already')) {
          errorMessage = 'Product already in wishlist!';
        }

        this.toast.error(errorMessage);
      }
    });
  }

  setActiveTab(tab: 'description' | 'reviews' | 'shipping'): void {
    this.activeTab = tab;
  }

  goToProduct(productId: string): void {
    this.router.navigate(['/product', productId]);
    window.scrollTo(0, 0);
  }

  getStars(rating: number): string {
    if (!rating) return '☆☆☆☆☆';
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  }

  getProductImage(product: any): string {
    if (!product || !product.images || product.images.length === 0) {
      return 'assets/images/placeholder.png';
    }

    const imagePath = product.images[0];
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const baseUrl = 'http://localhost:5000';
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${cleanPath}`;
  }
}
