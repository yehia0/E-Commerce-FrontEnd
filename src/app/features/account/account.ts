import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user';
import { Auth } from '../../core/services/auth';
import { ToastService } from '../../core/services/toast';
import { ConfirmationModalComponent } from '../../shared/components/confirmation/confirmation';
import { Dashboard } from './components/dashboard/dashboard';
import { Orders } from './components/orders/orders';
import { Profile } from './components/profile/profile';
import { Addresses } from './components/addresses/addresses';
import { Wishlist } from './components/wishlist/wishlist';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    ConfirmationModalComponent,
    Dashboard,
    Orders,
    Profile,
    Addresses,
    Wishlist
  ],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account implements OnInit {
  private userService = inject(UserService);
  private auth = inject(Auth);
  private router = inject(Router);
  private toast = inject(ToastService);

  activeSection: 'dashboard' | 'orders' | 'profile' | 'addresses' | 'wishlist' = 'dashboard';

  user = this.userService.currentUser;
  isLoading = this.userService.isLoading;

  showLogoutConfirmation = false;
  logoutConfirmationConfig = {
    title: 'Logout?',
    message: 'Are you sure you want to logout from your account?',
    confirmText: 'Yes, Logout',
    cancelText: 'Cancel',
    type: 'warning' as 'warning'
  };

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.userService.loadCurrentUser();

    const user = this.user();
    if (!user && !this.isLoading()) {
      this.toast.error('Failed to load user data');
    }
  }

  setActiveSection(section: 'dashboard' | 'orders' | 'profile' | 'addresses' | 'wishlist'): void {
    this.activeSection = section;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  logout(): void {
    this.showLogoutConfirmation = true;
  }

  onConfirmLogout(): void {
    this.showLogoutConfirmation = false;

    this.auth.logout();
    this.toast.success('Logged out successfully!');
    this.router.navigate(['/']);

    try {
      this.userService.currentUser.set(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();

      this.toast.success('Logged out successfully!');

      setTimeout(() => {
        this.router.navigate(['/']);
      }, 500);

    } catch (error) {
      this.toast.error('Failed to logout');
    }
  }

  onCancelLogout(): void {
    this.showLogoutConfirmation = false;
  }

  getUserAvatar(): string {
    const user = this.user();
    if (!user) return '👤';
    return this.userService.getInitials();
  }

  getUserName(): string {
    return this.userService.getFullName();
  }

  getUserEmail(): string {
    const user = this.user();
    return user?.email || '';
  }

  getSectionTitle(): string {
    const titles: { [key: string]: string } = {
      dashboard: 'Dashboard',
      orders: 'My Orders',
      profile: 'Profile Settings',
      addresses: 'Saved Addresses',
      wishlist: 'My Wishlist'
    };
    return titles[this.activeSection] || 'My Account';
  }

  getSectionIcon(): string {
    const icons: { [key: string]: string } = {
      dashboard: '📊',
      orders: '📦',
      profile: '👤',
      addresses: '📍',
      wishlist: '❤️'
    };
    return icons[this.activeSection] || '📋';
  }
}
