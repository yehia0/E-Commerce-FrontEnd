import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, UserProfile } from '../../../../core/services/user';
import { ToastService } from '../../../../core/services/toast';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private userService = inject(UserService);
  private toast = inject(ToastService);

  profile: UserProfile | null = null;
  isLoading = false;
  isEditing = false;

  editForm = {
    firstName: '',
    lastName: '',
    phone: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showPasswordForm = false;

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.userService.getUserProfile().subscribe({
      next: (response) => {
        this.profile = response.data;
        this.editForm = {
          firstName: this.profile.firstName,
          lastName: this.profile.lastName,
          phone: this.profile.phone
        };
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Failed to load profile');
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing && this.profile) {
      this.editForm = {
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        phone: this.profile.phone
      };
    }
  }

  saveProfile(): void {
    if (!this.isFormValid()) {
      this.toast.warning('Please fill in all required fields');
      return;
    }

    const updatedData = {
      firstName: this.editForm.firstName.trim(),
      lastName: this.editForm.lastName.trim(),
      phone: this.editForm.phone.trim()
    };

    this.userService.updateProfile(updatedData).subscribe({
      next: () => {
        this.toast.success('Profile updated successfully!');
        this.loadProfile();
        this.isEditing = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Failed to update profile';
        this.toast.error(errorMessage);
      }
    });
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.resetPasswordForm();
    }
  }

  changePassword(): void {
    if (!this.isPasswordFormValid()) {
      this.toast.warning('Please fill in all password fields');
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.toast.warning('New passwords do not match');
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.toast.warning('Password must be at least 6 characters long');
      return;
    }

    if (this.passwordForm.newPassword === this.passwordForm.currentPassword) {
      this.toast.warning('New password must be different from current password');
      return;
    }

    this.userService.changePassword(
      this.passwordForm.currentPassword,
      this.passwordForm.newPassword
    ).subscribe({
      next: () => {
        this.toast.success('Password changed successfully!');
        this.resetPasswordForm();
        this.showPasswordForm = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Failed to change password';
        this.toast.error(errorMessage);
      }
    });
  }

  resetPasswordForm(): void {
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  isFormValid(): boolean {
    return !!(
      this.editForm.firstName?.trim() &&
      this.editForm.lastName?.trim() &&
      this.editForm.phone?.trim()
    );
  }

  isPasswordFormValid(): boolean {
    return !!(
      this.passwordForm.currentPassword &&
      this.passwordForm.newPassword &&
      this.passwordForm.confirmPassword
    );
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getPasswordStrength(password: string): { strength: string; color: string; percentage: number } {
    if (!password) {
      return { strength: '', color: '', percentage: 0 };
    }

    let score = 0;

    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) {
      return { strength: 'Weak', color: '#ef4444', percentage: 33 };
    } else if (score <= 3) {
      return { strength: 'Medium', color: '#f59e0b', percentage: 66 };
    } else {
      return { strength: 'Strong', color: '#10b981', percentage: 100 };
    }
  }
}
