import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-reviews',
  imports: [CommonModule],
  templateUrl: './product-reviews.html',
  styleUrl: './product-reviews.scss',
})
export class ProductReviews {
  @Input() set reviews(value: any[]) {
    // Filter out reviews that don't have rating or comment
    this._reviews = (value || []).filter(review =>
      review.rating !== undefined &&
      review.rating !== null &&
      review.comment &&
      review.comment.trim() !== ''
    );
  }

  get reviews(): any[] {
    return this._reviews;
  }

  private _reviews: any[] = [];

  getStars(rating: number): string {
    return '★'.repeat(Math.floor(rating));
  }

  getEmptyStars(rating: number): string {
    return '☆'.repeat(5 - Math.floor(rating));
  }

  getUserName(review: any): string {
    if (review.user && typeof review.user === 'object') {
      const firstName = review.user.firstName || '';
      const lastName = review.user.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'Anonymous User';
    }

    if (review.userName) {
      return review.userName;
    }

    return 'Anonymous User';
  }

  getUserInitials(review: any): string {
    const userName = this.getUserName(review);
    const names = userName.split(' ');

    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }

    return userName.charAt(0).toUpperCase();
  }

  formatDate(date: Date | string): string {
    if (!date) return 'Unknown date';

    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return 'Unknown date';
    }

    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getRelativeTime(date: Date | string): string {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffInMs = now.getTime() - d.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;

    return `${Math.floor(diffInDays / 365)} years ago`;
  }

  getAverageRating(): number {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / this.reviews.length;
  }

  getRatingDistribution(star: number): number {
    if (this.reviews.length === 0) return 0;
    const count = this.reviews.filter(r => Math.floor(r.rating) === star).length;
    return (count / this.reviews.length) * 100;
  }
}
