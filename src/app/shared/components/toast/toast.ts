// src/app/shared/components/toast/toast
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrls: ['./toast.scss']
})
export class ToastComponent {
  private toastService = inject(ToastService);

  toasts$ = this.toastService.toasts$;

  removeToast(id: number): void {
    this.toastService.remove(id);
  }
}
