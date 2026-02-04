import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Admin } from '../../../core/services/admin';
import { ToastService } from '../../../core/services/toast';
import { ConfirmationModalComponent, ConfirmationConfig } from '../../../shared/components/confirmation/confirmation';

interface Category {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  gender?: string;
  productCount?: number;
  subCategoriesCount?: number;
  isActive: boolean;
  image?: string;
  createdAt?: string;
  expanded?: boolean;
}

interface Subcategory {
  _id?: string;
  name: string;
  slug: string;
  category: string | any;
  isActive: boolean;
  createdAt?: string;
}

interface Stat {
  label: string;
  value: string;
  color: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories implements OnInit {
  private adminService = inject(Admin);
  private toast = inject(ToastService);

  searchTerm: string = '';
  statusFilter: string = 'all';
  genderFilter: string = 'all';

  stats: Stat[] = [];
  categories: Category[] = [];
  subcategories: Subcategory[] = [];
  isLoading: boolean = false;

  showModal: boolean = false;
  editingCategory: Partial<Category> | null = null;

  showSubcategoryModal: boolean = false;
  editingSubcategory: Partial<Subcategory> | null = null;
  selectedCategory: Category | null = null;

  // Confirmation Modal
  showConfirmModal = false;
  confirmConfig: ConfirmationConfig = {
    title: 'Confirm',
    message: 'Are you sure?'
  };
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.loadCategories();
    this.loadSubcategories();
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
    this.isLoading = true;

    this.adminService.getAllCategories().subscribe({
      next: (response) => {
        this.categories = (response.data || response.categories || []).map((cat: any) => ({
          ...cat,
          id: cat._id,
          productCount: +(cat.productCount ?? cat.productsCount ?? 0),
          subCategoriesCount: +(cat.subCategoriesCount ?? 0),
          expanded: false
        }));

        this.isLoading = false;
        this.updateStats();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Failed to load categories');
      }
    });
  }

  loadSubcategories(): void {
    this.adminService.getAllSubcategories().subscribe({
      next: (response) => {
        this.subcategories = response.data || response.subcategories || [];
        this.updateStats();
      },
      error: () => {}
    });
  }

  loadStats(): void {
    this.updateStats();
  }

  updateStats(): void {
    const activeCount = this.categories.filter(c => c.isActive).length;
    const inactiveCount = this.categories.filter(c => !c.isActive).length;
    const totalSubcategories = this.subcategories.length;

    this.stats = [
      {
        label: 'Total Categories',
        value: this.categories.length.toString(),
        color: 'blue'
      },
      {
        label: 'Active',
        value: activeCount.toString(),
        color: 'green'
      },
      {
        label: 'Inactive',
        value: inactiveCount.toString(),
        color: 'gray'
      },
      {
        label: 'Total Subcategories',
        value: totalSubcategories.toString(),
        color: 'purple'
      }
    ];
  }

  get filteredCategories(): Category[] {
    return this.categories.filter(category => {
      const matchesSearch =
        category.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (category.description?.toLowerCase() || '').includes(this.searchTerm.toLowerCase());

      const matchesStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'active' && category.isActive === true) ||
        (this.statusFilter === 'inactive' && category.isActive === false);

      const matchesGender =
        this.genderFilter === 'all' ||
        category.gender === this.genderFilter;

      return matchesSearch && matchesStatus && matchesGender;
    });
  }

  getCategorySubcategories(category: Category): Subcategory[] {
    const categoryId = category._id || category.id;
    return this.subcategories.filter(sub => {
      const subCategoryId = typeof sub.category === 'string' ? sub.category : sub.category?._id;
      return subCategoryId === categoryId;
    });
  }

  toggleCategory(category: Category): void {
    category.expanded = !category.expanded;
  }

  getStatusColor(isActive: boolean): string {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  openCreateModal(): void {
    this.editingCategory = {
      name: '',
      slug: '',
      description: '',
      gender: 'all',
      isActive: true
    };
    this.showModal = true;
  }

  openEditModal(category: Category): void {
    this.editingCategory = { ...category };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingCategory = null;
  }

  saveCategory(): void {
    if (!this.editingCategory) return;

    if (!this.editingCategory.slug && this.editingCategory.name) {
      this.editingCategory.slug = this.editingCategory.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    if (this.editingCategory._id || this.editingCategory.id) {
      const id = this.editingCategory._id || this.editingCategory.id!;

      this.adminService.updateCategory(id, this.editingCategory).subscribe({
        next: () => {
          this.loadCategories();
          this.closeModal();
          this.toast.success('Category updated successfully!');
        },
        error: (err) => {
          this.toast.error('Failed to update category: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.adminService.createCategory(this.editingCategory).subscribe({
        next: () => {
          this.loadCategories();
          this.closeModal();
          this.toast.success('Category created successfully!');
        },
        error: (err) => {
          this.toast.error('Failed to create category: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  deleteCategory(category: Category): void {
    const id = category._id || category.id;
    if (!id) return;

    this.showConfirmation(
      {
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.name}"? This will also delete all its subcategories.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      },
      () => this.executeDeleteCategory(id, category.name)
    );
  }

  private executeDeleteCategory(id: string, name: string): void {
    this.adminService.deleteCategory(id).subscribe({
      next: () => {
        this.loadCategories();
        this.loadSubcategories();
        this.toast.success('Category deleted successfully!');
      },
      error: (err) => {
        this.toast.error('Failed to delete category: ' + (err.error?.message || err.message));
      }
    });
  }

  toggleCategoryStatus(category: Category): void {
    const id = category._id || category.id;
    if (!id) return;

    const newStatus = !category.isActive;
    const updatedCategory = {
      ...category,
      isActive: newStatus
    };

    this.adminService.updateCategory(id, updatedCategory).subscribe({
      next: () => {
        const index = this.categories.findIndex(c => (c._id || c.id) === id);
        if (index !== -1) {
          this.categories[index].isActive = newStatus;
          this.updateStats();
        }
        this.toast.success(`Category ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      },
      error: (err) => {
        this.toast.error('Failed to toggle status: ' + (err.error?.message || err.message));
      }
    });
  }

  openAddSubcategoryModal(category: Category): void {
    this.selectedCategory = category;
    this.editingSubcategory = {
      name: '',
      slug: '',
      category: category._id || category.id || '',
      isActive: true
    };
    this.showSubcategoryModal = true;
  }

  openEditSubcategoryModal(subcategory: Subcategory): void {
    const categoryId = typeof subcategory.category === 'string'
      ? subcategory.category
      : subcategory.category?._id;

    this.selectedCategory = this.categories.find(
      cat => (cat._id || cat.id) === categoryId
    ) || null;

    this.editingSubcategory = { ...subcategory };
    this.showSubcategoryModal = true;
  }

  closeSubcategoryModal(): void {
    this.showSubcategoryModal = false;
    this.editingSubcategory = null;
    this.selectedCategory = null;
  }

  saveSubcategory(): void {
    if (!this.editingSubcategory || !this.selectedCategory) return;

    if (!this.editingSubcategory.slug && this.editingSubcategory.name) {
      this.editingSubcategory.slug = this.editingSubcategory.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    const categoryId = this.selectedCategory._id || this.selectedCategory.id;

    if (this.editingSubcategory._id) {
      this.adminService.updateSubcategory(this.editingSubcategory._id, this.editingSubcategory).subscribe({
        next: () => {
          this.loadSubcategories();
          this.closeSubcategoryModal();
          this.toast.success('Subcategory updated successfully!');
        },
        error: (err: any) => {
          this.toast.error('Failed to update subcategory: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.adminService.createSubcategory(categoryId!, this.editingSubcategory).subscribe({
        next: () => {
          this.loadSubcategories();
          this.loadCategories();
          this.closeSubcategoryModal();
          this.toast.success('Subcategory created successfully!');
        },
        error: (err: any) => {
          this.toast.error('Failed to create subcategory: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  deleteSubcategory(subcategory: Subcategory): void {
    if (!subcategory._id) return;

    this.showConfirmation(
      {
        title: 'Delete Subcategory',
        message: `Are you sure you want to delete "${subcategory.name}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      },
      () => this.executeDeleteSubcategory(subcategory._id!, subcategory.name)
    );
  }

  private executeDeleteSubcategory(id: string, name: string): void {
    this.adminService.deleteSubcategory(id).subscribe({
      next: () => {
        this.loadSubcategories();
        this.loadCategories();
        this.toast.success('Subcategory deleted successfully!');
      },
      error: (err: any) => {
        this.toast.error('Failed to delete subcategory: ' + (err.error?.message || err.message));
      }
    });
  }

  toggleSubcategoryStatus(subcategory: Subcategory): void {
    if (!subcategory._id) return;

    const newStatus = !subcategory.isActive;
    const updatedSubcategory = {
      ...subcategory,
      isActive: newStatus
    };

    this.adminService.updateSubcategory(subcategory._id, updatedSubcategory).subscribe({
      next: () => {
        const index = this.subcategories.findIndex(s => s._id === subcategory._id);
        if (index !== -1) {
          this.subcategories[index].isActive = newStatus;
        }
        this.toast.success(`Subcategory ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      },
      error: (err: any) => {
        this.toast.error('Failed to toggle status: ' + (err.error?.message || err.message));
      }
    });
  }
}
