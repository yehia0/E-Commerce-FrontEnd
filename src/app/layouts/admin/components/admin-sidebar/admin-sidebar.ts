import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../../../../core/services/auth';
import { User } from '../../../../core/models/user';
import { ConfirmationModalComponent, ConfirmationConfig } from '../../../../shared/components/confirmation/confirmation';

interface MenuItem {
  route: string;
  icon: string;
  label: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmationModalComponent],
  templateUrl: './admin-sidebar.html',
  styleUrls: ['./admin-sidebar.scss']
})
export class AdminSidebar {
  authService = inject(Auth);
  currentUser$ = this.authService.currentUser$;

  showConfirmModal = false;
  confirmConfig: ConfirmationConfig = {
    title: 'Confirm',
    message: 'Are you sure?'
  };
  pendingAction: (() => void) | null = null;

  menuItems: MenuItem[] = [
    { route: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { route: '/admin/products', icon: '📦', label: 'Products', badge: 5 },
    { route: '/admin/orders', icon: '🛒', label: 'Orders', badge: 12 },
    { route: '/admin/users', icon: '👥', label: 'Users' },
    { route: '/admin/categories', icon: '📂', label: 'Categories' },
    { route: '/admin/reviews', icon: '⭐', label: 'Reviews' },
  ];

  getUserFullName(user: User | null): string {
    if (!user) return 'Admin User';

    const firstName = user.firstName || '';
    const lastName = user.lastName || '';

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    return firstName || lastName || user.email || 'Admin User';
  }

  getUserInitial(user: User | null): string {
    if (!user) return 'A';

    if (user.firstName && user.firstName.length > 0) {
      return user.firstName.charAt(0).toUpperCase();
    }

    if (user.lastName && user.lastName.length > 0) {
      return user.lastName.charAt(0).toUpperCase();
    }

    if (user.email && user.email.length > 0) {
      return user.email.charAt(0).toUpperCase();
    }

    return 'A';
  }

  private showConfirmation(config: ConfirmationConfig, action: () => void): void {
    this.confirmConfig = config;
    this.pendingAction = action;
    this.showConfirmModal = true;
    // debug: showConfirmModal toggled
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

  logout(): void {
    this.showConfirmation(
      {
        title: 'Logout',
        message: 'Are you sure you want to logout?',
        confirmText: 'Logout',
        cancelText: 'Cancel',
        type: 'warning'
      },
      () => {
        this.authService.logout('/admin-login');
      }
    );
  }
}
