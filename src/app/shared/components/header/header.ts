// src/app/shared/components/header/header.ts - FIXED
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Carts } from '../../../core/services/cart';
import { User } from '../../../core/models/user';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  authService = inject(Auth);
  cartService = inject(Carts);

  // Expose observables for cleaner template
  currentUser$ = this.authService.currentUser$;

  /**
   * Get user display name from firstName/lastName
   */
  getUserDisplayName(user: User | null): string {
    if (!user) return 'User';

    if (user.firstName) {
      return user.firstName;
    }

    if (user.email) {
      return user.email.split('@')[0];
    }

    return 'User';
  }

}
