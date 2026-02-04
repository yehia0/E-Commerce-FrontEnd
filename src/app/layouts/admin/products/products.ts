import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Admin } from '../../../core/services/admin';
import { ToastService } from '../../../core/services/toast';
import { Product } from '../../../core/models/product';
import { ConfirmationModalComponent, ConfirmationConfig } from '../../../shared/components/confirmation/confirmation';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class AdminProducts implements OnInit {
  private adminService = inject(Admin);
  private toast = inject(ToastService);

  products: Product[] = [];
  loading = true;
  currentPage = 1;
  totalPages = 1;
  totalProducts = 0;
  limit = 10; // ✅ عدد المنتجات في كل صفحة

  searchQuery = '';
  filterCategory = '';
  filterGender = '';

  showModal = false;
  editingProduct: Partial<Product> | null = null;

  newSize = '';
  newColor = '';
  uploadingImages = false;
  selectedFiles: File[] = [];

  categories: any[] = [];
  filteredCategories: any[] = [];
  filteredSubcategories: any[] = [];
  loadingCategories = false;

  // Confirmation Modal
  showConfirmModal = false;
  confirmConfig: ConfirmationConfig = {
    title: 'Confirm',
    message: 'Are you sure?'
  };
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  private showConfirmation(config: ConfirmationConfig, action: () => void): void {
    this.confirmConfig = config;
    this.pendingAction = action;
    this.showConfirmModal = true;
  }

  onModalConfirm(): void {
    this.showConfirmModal = false;
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
  }

  onModalCancel(): void {
    this.showConfirmModal = false;
    this.pendingAction = null;
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.adminService.getAllCategories().subscribe({
      next: (response) => {
        this.categories = response.data || response.categories || [];

        if (this.categories.length === 0) {
          this.toast.warning('No categories found. Please create categories first.');
        }

        if (this.editingProduct?.gender) {
          this.filterCategoriesByGender(this.editingProduct.gender);
        }

        this.loadingCategories = false;
      },
      error: () => {
        this.loadingCategories = false;
        this.toast.error('Failed to load categories');
      }
    });
  }

  onGenderChange(): void {
    if (!this.editingProduct?.gender) {
      this.filteredCategories = [];
      if (this.editingProduct) {
        this.editingProduct.category = '';
      }
      return;
    }

    this.filterCategoriesByGender(this.editingProduct.gender);

    if (this.editingProduct?.category) {
      const categoryExists = this.filteredCategories.find(
        cat => cat._id === this.editingProduct!.category
      );
      if (!categoryExists && this.editingProduct) {
        this.editingProduct.category = '';
      }
    }
  }

  filterCategoriesByGender(gender: string): void {
    this.filteredCategories = this.categories.filter(cat => {
      if (cat.gender) {
        return cat.gender === gender || cat.gender === 'unisex' || cat.gender === 'all';
      }
      return true;
    });

    if (this.filteredCategories.length === 0) {
      this.toast.warning(`No categories available for ${gender}`);
    }
  }

  onCategoryChange(): void {
    if (!this.editingProduct?.category) {
      this.filteredSubcategories = [];
      if (this.editingProduct) {
        this.editingProduct.subcategory = '';
      }
      return;
    }

    const categoryId = typeof this.editingProduct.category === 'object'
      ? this.editingProduct.category._id
      : this.editingProduct.category;
    this.filterSubcategoriesByCategory(categoryId);

    if (this.editingProduct?.subcategory) {
      const subcategoryExists = this.filteredSubcategories.find(
        subcat => subcat._id === this.editingProduct!.subcategory
      );
      if (!subcategoryExists && this.editingProduct) {
        this.editingProduct.subcategory = '';
      }
    }
  }

  filterSubcategoriesByCategory(categoryId: string): void {
    const selectedCategory = this.filteredCategories.find(cat => cat._id === categoryId);

    if (selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0) {
      this.filteredSubcategories = selectedCategory.subcategories.filter((sub: any) => sub.isActive !== false);
    } else {
      this.filteredSubcategories = [];
    }
  }

  loadProducts(): void {
    this.loading = true;
    const filters: any = {
      page: this.currentPage,
      limit: this.limit // ✅ بعت الـ limit
    };

    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.filterCategory) filters.category = this.filterCategory;
    if (this.filterGender) filters.gender = this.filterGender;

    this.adminService.getAllProducts(this.currentPage, this.limit, filters).subscribe({
      next: (response) => {
        this.products = response.products || response.data || [];
        this.totalPages = response.totalPages || response.pagination?.totalPages || 1;
        this.totalProducts = response.total || response.pagination?.total || this.products.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load products');
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1; // ✅ ارجع للصفحة الأولى
    this.loadProducts();
  }

  onFilter(): void {
    this.currentPage = 1; // ✅ ارجع للصفحة الأولى
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterCategory = '';
    this.filterGender = '';
    this.currentPage = 1; // ✅ ارجع للصفحة الأولى
    this.loadProducts();
    this.toast.info('Filters cleared');
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' }); // ✅ scroll للأعلى
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' }); // ✅ scroll للأعلى
    }
  }

  // ✅ Function جديدة للانتقال لصفحة معينة
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ✅ Helper لعرض أرقام الصفحات
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5; // عدد الأرقام اللي تظهر

    if (this.totalPages <= maxPages) {
      // لو الصفحات قليلة، اعرضهم كلهم
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // لو الصفحات كتير، اعرض حوالين الصفحة الحالية
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, this.currentPage + 2);

      if (this.currentPage <= 3) {
        end = maxPages;
      } else if (this.currentPage >= this.totalPages - 2) {
        start = this.totalPages - maxPages + 1;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  openEditModal(product: Product): void {
    this.editingProduct = { ...product };

    if (this.editingProduct.category && typeof this.editingProduct.category === 'object') {
      this.editingProduct.category = this.editingProduct.category._id;
    }
    if (this.editingProduct.subcategory && typeof this.editingProduct.subcategory === 'object') {
      this.editingProduct.subcategory = this.editingProduct.subcategory._id;
    }

    this.showModal = true;

    if (this.editingProduct.gender) {
      this.filterCategoriesByGender(this.editingProduct.gender);

      if (this.editingProduct.category) {
        this.filterSubcategoriesByCategory(this.editingProduct.category as string);
      }
    }
  }

  openCreateModal(): void {
    this.editingProduct = {
      name: '',
      slug: '',
      sku: '',
      description: '',
      price: 0,
      stock: 0,
      images: [],
      category: '',
      subcategory: '',
      gender: undefined,
      sizes: [],
      colors: [],
      isFeatured: false,
      isNewArrival: false,
      isActive: true
    };
    this.filteredCategories = [];
    this.filteredSubcategories = [];
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingProduct = null;
    this.newSize = '';
    this.newColor = '';
    this.uploadingImages = false;
    this.selectedFiles = [];
  }

  saveProduct(): void {
    if (!this.editingProduct) return;

    if (!this.editingProduct.name || !this.editingProduct.description) {
      this.toast.warning('Please fill in all required fields (Name, Description)');
      return;
    }

    if (!this.editingProduct.category) {
      this.toast.warning('Please select a category');
      return;
    }

    if (this.editingProduct.price === undefined || this.editingProduct.price <= 0) {
      this.toast.warning('Please enter a valid price');
      return;
    }

    if (this.editingProduct.stock === undefined || this.editingProduct.stock < 0) {
      this.toast.warning('Please enter a valid stock quantity');
      return;
    }

    if (!this.editingProduct.slug && this.editingProduct.name) {
      this.editingProduct.slug = this.editingProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    if (!this.editingProduct.sku && this.editingProduct.name) {
      const timestamp = Date.now().toString().slice(-6);
      this.editingProduct.sku = `PRD-${timestamp}`;
    }

    if (!this.editingProduct.images) this.editingProduct.images = [];
    if (!this.editingProduct.sizes) this.editingProduct.sizes = [];
    if (!this.editingProduct.colors) this.editingProduct.colors = [];

    const productData: any = { ...this.editingProduct };
    if (productData.subcategory) {
      productData.subCategory = productData.subcategory;
      delete productData.subcategory;
    }

    if (this.editingProduct._id) {
      this.adminService.updateProduct(this.editingProduct._id, productData).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
          this.toast.success('Product updated successfully!');
        },
        error: (err) => {
          this.toast.error('Failed to update product: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.adminService.createProduct(productData).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
          this.toast.success('Product created successfully!');
        },
        error: (err) => {
          this.toast.error('Failed to create product: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  deleteProduct(id: string): void {
    this.showConfirmation(
      {
        title: 'Delete Product',
        message: 'Are you sure you want to delete this product? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      },
      () => this.executeDelete(id)
    );
  }

  private executeDelete(id: string): void {
    this.adminService.deleteProduct(id).subscribe({
      next: () => {
        this.loadProducts();
        this.toast.success('Product deleted successfully!');
      },
      error: (err) => {
        this.toast.error('Failed to delete product: ' + (err.error?.message || err.message));
      }
    });
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) {
      return 'assets/images/placeholder.png';
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const baseUrl = 'http://localhost:5000';
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${cleanPath}`;
  }

  onImageSelected(event: any): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 5) {
      this.toast.warning('Maximum 5 images allowed!');
      event.target.value = '';
      return;
    }

    this.uploadingImages = true;
    this.toast.info(`Uploading ${files.length} image(s)...`);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    this.adminService.uploadProductImages(formData).subscribe({
      next: (response) => {
        const imageUrls = response.data || response.imageUrls || [];

        if (imageUrls.length > 0 && this.editingProduct?.images) {
          this.editingProduct.images.push(...imageUrls);
        }

        this.uploadingImages = false;
        event.target.value = '';
        this.toast.success(`${imageUrls.length} image(s) uploaded successfully!`);
      },
      error: (err) => {
        this.uploadingImages = false;
        event.target.value = '';
        this.toast.error('Failed to upload images: ' + (err.error?.message || err.message));
      }
    });
  }

  removeImage(index: number): void {
    this.showConfirmation(
      {
        title: 'Remove Image',
        message: 'Are you sure you want to remove this image?',
        confirmText: 'Remove',
        cancelText: 'Cancel',
        type: 'warning'
      },
      () => {
        if (this.editingProduct?.images) {
          this.editingProduct.images.splice(index, 1);
          this.toast.info('Image removed');
        }
      }
    );
  }

  addSize(): void {
    if (!this.newSize || !this.editingProduct) return;

    const size = this.newSize.trim().toUpperCase();
    if (!size) return;

    if (!this.editingProduct.sizes) {
      this.editingProduct.sizes = [];
    }

    if (this.editingProduct.sizes.includes(size)) {
      this.toast.warning('This size already exists!');
      return;
    }

    this.editingProduct.sizes.push(size);
    this.newSize = '';
    this.toast.success(`Size ${size} added`);
  }

  addColor(): void {
    if (!this.newColor || !this.editingProduct) return;

    const color = this.newColor.trim();
    if (!color) return;

    if (!this.editingProduct.colors) {
      this.editingProduct.colors = [];
    }

    if (this.editingProduct.colors.includes(color)) {
      this.toast.warning('This color already exists!');
      return;
    }

    this.editingProduct.colors.push(color);
    this.newColor = '';
    this.toast.success(`Color ${color} added`);
  }

  removeFromArray(array: any[], index: number): void {
    this.showConfirmation(
      {
        title: 'Remove Item',
        message: 'Are you sure you want to remove this item?',
        confirmText: 'Remove',
        cancelText: 'Cancel',
        type: 'warning'
      },
      () => {
        if (array && index >= 0 && index < array.length) {
          array.splice(index, 1);
          this.toast.info('Item removed');
        }
      }
    );
  }
}
