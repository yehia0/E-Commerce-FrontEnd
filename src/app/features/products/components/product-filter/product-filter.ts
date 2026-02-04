import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Admin } from '../../../../core/services/admin';

interface Category {
  _id: string;
  name: string;
  slug: string;
  gender?: string;
  subcategories?: Subcategory[];
}

interface Subcategory {
  _id: string;
  name: string;
  slug: string;
}

@Component({
  selector: 'app-product-filter',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-filter.html',
  styleUrl: './product-filter.scss',
})
export class ProductFilter implements OnInit {
  @Input() gender: 'men' | 'women' = 'men';
  @Output() filterChange = new EventEmitter<any>();

  private adminService = inject(Admin);

  categories: Category[] = [];
  sizeOptions: string[] = [];
  colorOptions: string[] = [];

  expandedCategories: Set<string> = new Set();

  selectedCategories: Set<string> = new Set();
  selectedSubcategories: Set<string> = new Set();
  minPrice = 0;
  maxPrice = 5000;
  selectedSizes: Set<string> = new Set();
  selectedColors: Set<string> = new Set();

  loading = false;

  ngOnInit(): void {
    this.initializeFilters();
  }

  initializeFilters(): void {
    this.loadCategories();

    if (this.gender === 'men') {
      this.sizeOptions = ['S', 'M', 'L', 'XL', 'XXL'];
      this.colorOptions = ['Black', 'White', 'Blue', 'Gray', 'Navy'];
    } else {
      this.sizeOptions = ['XS', 'S', 'M', 'L', 'XL'];
      this.colorOptions = ['Red', 'Pink', 'White', 'Black', 'Blue'];
    }

    this.emitFilterChange();
  }

  loadCategories(): void {
    this.loading = true;

    this.adminService.getAllCategories().subscribe({
      next: (response) => {
        const allCategories = response.data || response.categories || [];

        this.categories = allCategories.filter((cat: Category) => {
          if (!cat.gender) return true;
          return cat.gender === this.gender || cat.gender === 'unisex' || cat.gender === 'all';
        });

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  toggleCategoryExpansion(categoryId: string): void {
    if (this.expandedCategories.has(categoryId)) {
      this.expandedCategories.delete(categoryId);
    } else {
      this.expandedCategories.add(categoryId);
    }
  }

  isCategoryExpanded(categoryId: string): boolean {
    return this.expandedCategories.has(categoryId);
  }

  toggleCategory(categoryId: string): void {
    if (this.selectedCategories.has(categoryId)) {
      this.selectedCategories.delete(categoryId);

      const category = this.categories.find(c => c._id === categoryId);
      if (category && category.subcategories) {
        category.subcategories.forEach(sub => {
          this.selectedSubcategories.delete(sub._id);
        });
      }
    } else {
      this.selectedCategories.add(categoryId);
    }
    this.emitFilterChange();
  }

  toggleSubcategory(subcategoryId: string): void {
    if (this.selectedSubcategories.has(subcategoryId)) {
      this.selectedSubcategories.delete(subcategoryId);
    } else {
      this.selectedSubcategories.add(subcategoryId);
    }
    this.emitFilterChange();
  }

  toggleSize(size: string): void {
    if (this.selectedSizes.has(size)) {
      this.selectedSizes.delete(size);
    } else {
      this.selectedSizes.add(size);
    }
    this.emitFilterChange();
  }

  toggleColor(color: string): void {
    if (this.selectedColors.has(color)) {
      this.selectedColors.delete(color);
    } else {
      this.selectedColors.add(color);
    }
    this.emitFilterChange();
  }

  onPriceChange(): void {
    this.emitFilterChange();
  }

  clearAllFilters(): void {
    this.selectedCategories.clear();
    this.selectedSubcategories.clear();
    this.selectedSizes.clear();
    this.selectedColors.clear();
    this.expandedCategories.clear();
    this.minPrice = 0;
    this.maxPrice = 5000;
    this.emitFilterChange();
  }

  emitFilterChange(): void {
    const filters = {
      categories: Array.from(this.selectedCategories),
      subcategories: Array.from(this.selectedSubcategories),
      priceRange: { min: this.minPrice, max: this.maxPrice },
      sizes: Array.from(this.selectedSizes),
      colors: Array.from(this.selectedColors)
    };

    this.filterChange.emit(filters);
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategories.has(categoryId);
  }

  isSubcategorySelected(subcategoryId: string): boolean {
    return this.selectedSubcategories.has(subcategoryId);
  }

  isSizeSelected(size: string): boolean {
    return this.selectedSizes.has(size);
  }

  isColorSelected(color: string): boolean {
    return this.selectedColors.has(color);
  }

  getSubcategoriesCount(category: Category): number {
    return category.subcategories?.length || 0;
  }
}
