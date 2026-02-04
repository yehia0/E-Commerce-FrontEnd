import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Admin } from '../../../core/services/admin';
import { ToastService } from '../../../core/services/toast';
import { ConfirmationModalComponent, ConfirmationConfig } from '../../../shared/components/confirmation/confirmation';

interface User {
  _id?: string;
  id?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'admin' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  joinDate?: string;
  totalOrders?: number;
  totalSpent?: number;
  address?: string;
  createdAt?: string;
}

interface Stat {
  label: string;
  value: string;
  color: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  private adminService = inject(Admin);
  private toast = inject(ToastService);

  searchTerm: string = '';
  roleFilter: string = 'all';
  statusFilter: string = 'all';

  stats: Stat[] = [];
  users: User[] = [];
  isLoading: boolean = false;

  showModal: boolean = false;
  showViewModal: boolean = false;
  editingUser: Partial<User> | null = null;
  viewingUser: User | null = null;

  // Confirmation Modal
  showConfirmModal = false;
  confirmConfig: ConfirmationConfig = {
    title: 'Confirm',
    message: 'Are you sure?'
  };
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.loadUsers();
    this.loadStats();
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

  loadUsers(): void {
    this.isLoading = true;

    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        this.users = (response.data || response.users || []).map((user: any) => ({
          ...user,
          id: user._id,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          totalOrders: user.totalOrders || 0,
          totalSpent: user.totalSpent || 0,
          joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'
        }));
        this.isLoading = false;
        this.updateStats();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Failed to load users');
      }
    });
  }

  loadStats(): void {
    this.updateStats();
  }

  updateStats(): void {
    const totalUsers = this.users.length;
    const activeUsers = this.users.filter(u => u.status === 'active').length;
    const adminUsers = this.users.filter(u => u.role === 'admin').length;
    const totalRevenue = this.users.reduce((sum, u) => sum + (u.totalSpent || 0), 0);

    this.stats = [
      {
        label: 'Total Users',
        value: totalUsers.toString(),
        color: 'blue'
      },
      {
        label: 'Active Users',
        value: activeUsers.toString(),
        color: 'green'
      },
      {
        label: 'Admins',
        value: adminUsers.toString(),
        color: 'purple'
      },
      {
        label: 'Total Revenue',
        value: `${totalRevenue.toFixed(2)} EGP`,
        color: 'orange'
      }
    ];
  }

  get filteredUsers(): User[] {
    return this.users.filter(user => {
      const name = user.name || '';
      const email = user.email || '';
      const phone = user.phone || '';
      const searchLower = this.searchTerm.toLowerCase();

      const matchesSearch =
        name.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower) ||
        phone.toLowerCase().includes(searchLower);

      const matchesRole =
        this.roleFilter === 'all' || user.role === this.roleFilter;

      const matchesStatus =
        this.statusFilter === 'all' || user.status === this.statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return colors[status] || '';
  }

  getRoleColor(role: string): string {
    const colors: { [key: string]: string } = {
      admin: 'bg-purple-100 text-purple-800',
      customer: 'bg-blue-100 text-blue-800'
    };
    return colors[role] || '';
  }

  openCreateModal(): void {
    this.editingUser = {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'customer',
      status: 'active',
      address: ''
    };
    this.showModal = true;
  }

  openEditModal(user: User): void {
    this.editingUser = {
      ...user,
      password: ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingUser = null;
  }

  saveUser(): void {
    if (!this.editingUser) return;

    if (!this.editingUser.name || !this.editingUser.email) {
      this.toast.warning('Please fill in all required fields (Name, Email)');
      return;
    }

    if (!(this.editingUser._id || this.editingUser.id) && !this.editingUser.password) {
      this.toast.warning('Password is required for new users');
      return;
    }

    if (this.editingUser._id || this.editingUser.id) {
      const id = this.editingUser._id || this.editingUser.id!;

      const updateData = { ...this.editingUser };
      if (!updateData.password) {
        delete updateData.password;
      }
      delete updateData.id;
      delete updateData._id;
      delete updateData.joinDate;
      delete updateData.totalOrders;
      delete updateData.totalSpent;
      delete updateData.createdAt;

      this.adminService.updateUser(id, updateData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          this.toast.success('User updated successfully!');
        },
        error: (err) => {
          this.toast.error('Failed to update user: ' + (err.error?.message || err.message));
        }
      });
    } else {
      const createData = { ...this.editingUser };
      delete createData.id;
      delete createData._id;
      delete createData.joinDate;
      delete createData.totalOrders;
      delete createData.totalSpent;
      delete createData.createdAt;
      delete createData.firstName;
      delete createData.lastName;

      this.adminService.createUser(createData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          this.toast.success('User created successfully!');
        },
        error: (err) => {
          let errorMessage = 'Failed to create user';
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.error?.errors) {
            const errors = Object.entries(err.error.errors)
              .map(([field, error]: [string, any]) => `${field}: ${error.message}`)
              .join(', ');
            errorMessage = `Validation failed: ${errors}`;
          }

          this.toast.error(errorMessage);
        }
      });
    }
  }

  viewUser(user: User): void {
    this.viewingUser = user;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.viewingUser = null;
  }

  editFromView(): void {
    if (this.viewingUser) {
      this.closeViewModal();
      this.openEditModal(this.viewingUser);
    }
  }

  deleteUser(user: User): void {
    const id = user._id || user.id;
    if (!id) {
      this.toast.error('User ID not found');
      return;
    }

    this.showConfirmation(
      {
        title: 'Delete User',
        message: `Are you sure you want to delete "${user.name || 'this user'}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      },
      () => this.executeDeleteUser(id, user.name)
    );
  }

  private executeDeleteUser(id: string, name: string): void {
    this.adminService.deleteUser(id).subscribe({
      next: () => {
        this.loadUsers();
        this.toast.success('User deleted successfully!');
      },
      error: (err) => {
        let errorMsg = 'Failed to delete user';
        if (err.status === 404) {
          errorMsg = 'User not found. It may have already been deleted.';
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }

        this.toast.error(errorMsg);
        this.loadUsers();
      }
    });
  }

  toggleUserStatus(user: User): void {
    const id = user._id || user.id;
    if (!id) return;

    let newStatus: 'active' | 'inactive' | 'suspended';
    if (user.status === 'active') {
      newStatus = 'inactive';
    } else if (user.status === 'inactive') {
      newStatus = 'suspended';
    } else {
      newStatus = 'active';
    }

    const statusMessages: { [key: string]: string } = {
      active: 'activate',
      inactive: 'deactivate',
      suspended: 'suspend'
    };

    this.showConfirmation(
      {
        title: 'Change User Status',
        message: `Are you sure you want to ${statusMessages[newStatus]} "${user.name || 'this user'}"?`,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        type: 'warning'
      },
      () => this.executeToggleStatus(id, user, newStatus)
    );
  }

  private executeToggleStatus(id: string, user: User, newStatus: 'active' | 'inactive' | 'suspended'): void {
    const hasStatusMethod = typeof (this.adminService as any).updateUserStatus === 'function';

    if (hasStatusMethod) {
      (this.adminService as any).updateUserStatus(id, newStatus).subscribe({
        next: () => {
          user.status = newStatus;
          this.toast.success(`User status changed to ${newStatus}`);
        },
        error: (err: any) => {
          this.toast.error('Failed to toggle status: ' + (err.error?.message || err.message));
          this.loadUsers();
        }
      });
    } else {
      this.adminService.updateUser(id, { status: newStatus }).subscribe({
        next: () => {
          user.status = newStatus;
          this.toast.success(`User status changed to ${newStatus}`);
        },
        error: (err: any) => {
          this.toast.error('Failed to toggle status: ' + (err.error?.message || err.message));
          this.loadUsers();
        }
      });
    }
  }
}
