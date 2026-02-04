import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductFilter } from './components/product-filter/product-filter';
import { ProductSort } from './components/product-sort/product-sort';
import { ProductS } from '../../core/services/product';
import { Carts } from '../../core/services/cart';
import { ToastService } from '../../core/services/toast';
import { Product } from '../../core/models/product';

@Component({
  selector: 'app-products',
  imports: [CommonModule, ProductFilter, ProductSort],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements OnInit {
  private productService = inject(ProductS);
  private cartService = inject(Carts);
  private toast = inject(ToastService);

  gender: 'men' | 'women' = 'men';
  products: Product[] = [];
  filteredProducts: Product[] = [];
  displayedProducts: Product[] = [];

  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;
  loading = false;
  error: string | null = null;

  activeFilters: any = {
    categories: [],
    subcategories: [],
    priceRange: { min: 0, max: 5000 },
    sizes: [],
    colors: []
  };

  sortBy = 'featured';
  searchQuery = '';
  addingToCartIds = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.gender = data['gender'] || 'men';

      this.route.queryParams.subscribe(params => {
        this.searchQuery = params['search'] || '';
        this.loadProducts();
      });
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;

    this.productService.getProducts({
      page: this.currentPage,
      limit: 100,
      gender: this.gender,
      sort: this.sortBy,
      search: this.searchQuery || undefined
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.products = response.data;

          if (this.searchQuery) {
            this.products = this.products.filter(product =>
              product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
              product.description?.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
          }

          this.filteredProducts = [...this.products];

          if (response.pagination) {
            this.totalPages = response.pagination.totalPages || 1;
          }

          this.sortFilteredProducts();
          this.applyFiltersAndSort();
        }

        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load products';
        this.loading = false;
      }
    });
  }

  onFilterChange(filters: any): void {
    this.activeFilters = filters;
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onSortChange(sortBy: string): void {
    this.sortBy = sortBy;
    this.currentPage = 1;
    this.sortFilteredProducts();
    this.updateDisplayedProducts();
  }

  sortFilteredProducts(): void {
    switch (this.sortBy) {
      case 'price-asc':
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        this.filteredProducts.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        break;
      case 'rating':
        this.filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default: // featured
        this.filteredProducts.sort((a, b) => {
          if (a.isFeatured === b.isFeatured) {
            return (b.rating || 0) - (a.rating || 0);
          }
          return a.isFeatured ? -1 : 1;
        });
    }
  }

  applyFiltersAndSort(): void {
    this.filteredProducts = this.products.filter(product => {
      if (this.activeFilters.categories.length > 0) {
        const categoryId = typeof product.category === 'object'
          ? product.category._id
          : product.category;

        if (!this.activeFilters.categories.includes(categoryId)) {
          return false;
        }
      }

      if (this.activeFilters.subcategories.length > 0) {
        let subcategoryId: string | undefined;

        if (typeof product.subCategory === 'object' && product.subCategory?._id) {
          subcategoryId = product.subCategory._id;
        } else if (typeof product.subCategory === 'string') {
          subcategoryId = product.subCategory;
        } else if (typeof product.subcategory === 'object' && product.subcategory?._id) {
          subcategoryId = product.subcategory._id;
        } else if (typeof product.subcategory === 'string') {
          subcategoryId = product.subcategory;
        }

        if (!subcategoryId || !this.activeFilters.subcategories.includes(subcategoryId)) {
          return false;
        }
      }

      if (product.price < this.activeFilters.priceRange.min ||
          product.price > this.activeFilters.priceRange.max) {
        return false;
      }

      if (this.activeFilters.sizes.length > 0) {
        if (!product.sizes || product.sizes.length === 0) {
          return false;
        }
        const hasMatchingSize = this.activeFilters.sizes.some((size: string) =>
          product.sizes?.includes(size)
        );
        if (!hasMatchingSize) {
          return false;
        }
      }

      if (this.activeFilters.colors.length > 0) {
        if (!product.colors || product.colors.length === 0) {
          return false;
        }
        const hasMatchingColor = this.activeFilters.colors.some((color: string) =>
          product.colors?.includes(color)
        );
        if (!hasMatchingColor) {
          return false;
        }
      }

      return true;
    });

    this.updateDisplayedProducts();
  }

  updateDisplayedProducts(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getStars(rating: number): string {
    return '★'.repeat(Math.floor(rating || 0));
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/images/placeholder.png';

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const baseUrl = 'http://localhost:5000';
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${cleanPath}`;
  }

  goToProductDetails(productId: string | undefined): void {
    if (productId) {
      this.router.navigate(['/product', productId]);
    }
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const productId = product._id || product.id;

    if (!productId) {
      this.toast.error('Error: Product ID not found');
      return;
    }

    if (this.addingToCartIds.has(productId)) {
      return;
    }

    if (product.stock !== undefined && product.stock <= 0) {
      this.toast.warning('Sorry, this product is out of stock.');
      return;
    }

    this.addingToCartIds.add(productId);

    const defaultSize = product.sizes && product.sizes.length > 0
      ? product.sizes[0]
      : undefined;

    const defaultColor = product.colors && product.colors.length > 0
      ? product.colors[0]
      : undefined;

    this.cartService.addToCart(productId, 1, defaultSize, defaultColor).subscribe({
      next: () => {
        this.addingToCartIds.delete(productId);
        this.toast.success(`${product.name} added to cart!`);
      },
      error: (error) => {
        this.addingToCartIds.delete(productId);

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

  isAddingToCart(productId: string | undefined): boolean {
    if (!productId) return false;
    return this.addingToCartIds.has(productId);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getCategoryName(category: any): string {
    if (!category) return 'Casual';

    if (typeof category === 'string') {
      return category;
    }

    return category.name || 'Casual';
  }
}
