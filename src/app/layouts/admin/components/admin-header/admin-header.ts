import { Component, Inject, PLATFORM_ID, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Auth } from '../../../../core/services/auth';
import { User } from '../../../../core/models/user';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation/confirmation';
import { ToastService } from '../../../../core/services/toast';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmationModalComponent],
  templateUrl: './admin-header.html',
  styleUrls: ['./admin-header.scss']
})
export class AdminHeader implements OnDestroy {
  currentDate = new Date();
  pageTitle = 'Admin Panel';
  private intervalId?: any;

  currentUser$: Observable<User | null>;

  showUserMenu = false;
  showNotifications = false;

  private toast = inject(ToastService);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private authService: Auth
  ) {
    this.currentUser$ = this.authService.currentUser$;

    this.pageTitle = this.getPageTitle();

    if (isPlatformBrowser(this.platformId)) {
      this.intervalId = setInterval(() => {
        this.currentDate = new Date();
      }, 60000);

      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.pageTitle = this.getPageTitle();
        });
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getUserName(user: User | null): string {
    if (!user) return 'Admin';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  }

  getUserInitials(user: User | null): string {
    if (!user) return 'A';
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || user.email.charAt(0).toUpperCase();
  }

  getPageTitle(): string {
    if (isPlatformBrowser(this.platformId)) {
      const path = window.location.pathname;
      if (path.includes('dashboard')) return '📊 Dashboard';
      if (path.includes('products')) return '📦 Products Management';
      if (path.includes('orders')) return '🛒 Orders Management';
      if (path.includes('users')) return '👥 Users Management';
      if (path.includes('categories')) return '📂 Categories Management';
      if (path.includes('settings')) return '⚙️ Settings';
      if (path.includes('profile')) return '👤 Profile';
    }
    return 'Admin Panel';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotifications = false;
    }
  }

  showLogoutConfirm = false;

  logout(): void {
    this.showLogoutConfirm = true;
  }

  onLogoutConfirm(): void {
    this.showLogoutConfirm = false;
    this.authService.logout();
    this.toast.success('Logged out');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.header-item');

    if (!clickedInside) {
      this.showNotifications = false;
      this.showUserMenu = false;
    }
  }
}
