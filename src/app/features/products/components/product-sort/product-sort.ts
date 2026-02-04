// product-sort.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-sort',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-sort.html',
  styleUrl: './product-sort.scss',
})
export class ProductSort {
  @Output() sortChange = new EventEmitter<string>();

  sortBy: string = 'featured';

  sortOptions = [
    { value: 'featured', label: 'Sort by: Featured' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'rating', label: 'Best Rating' }
  ];

  onSortChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.sortBy = selectElement.value;
    this.sortChange.emit(this.sortBy);
  }
}
