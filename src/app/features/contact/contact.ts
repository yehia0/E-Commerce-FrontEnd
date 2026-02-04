import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class Contact {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  formData = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  loading = false;
  success = false;
  error = '';

  contactInfo = [
    {
      icon: '📍',
      title: 'Visit Us',
      content: '123 Fashion Street\nCairo, Egypt\n12345'
    },
    {
      icon: '📞',
      title: 'Call Us',
      content: '+20 123 456 7890\n+20 123 456 7891'
    },
    {
      icon: '✉️',
      title: 'Email Us',
      content: 'info@urbanstyle.com\nsupport@urbanstyle.com'
    },
    {
      icon: '🕒',
      title: 'Working Hours',
      content: 'Monday - Friday: 9:00 AM - 8:00 PM\nSaturday: 10:00 AM - 6:00 PM\nSunday: Closed'
    }
  ];

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.success = false;

    this.http.post(`${this.apiUrl}/contact`, this.formData).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        this.resetForm();
      },
      error: (err) => {
        this.error = 'Failed to send message. Please try again.';
        this.loading = false;
        console.error('Error:', err);
      }
    });
  }

  resetForm(): void {
    this.formData = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    };
  }
}
