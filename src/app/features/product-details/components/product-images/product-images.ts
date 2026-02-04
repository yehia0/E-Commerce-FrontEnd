import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-images',
  imports: [CommonModule],
  templateUrl: './product-images.html',
  styleUrl: './product-images.scss',
})
export class ProductImages implements OnInit {
  @Input() images: string[] = [];
  @Input() productName: string = '';

  selectedImage: string = '';
  selectedIndex: number = 0;

  ngOnInit(): void {
    if (this.images && this.images.length > 0) {
      this.selectedImage = this.images[0];
    }
  }

  selectImage(image: string, index: number): void {
    this.selectedImage = image;
    this.selectedIndex = index;
  }

  nextImage(): void {
    if (this.selectedIndex < this.images.length - 1) {
      this.selectedIndex++;
      this.selectedImage = this.images[this.selectedIndex];
    }
  }

  prevImage(): void {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.selectedImage = this.images[this.selectedIndex];
    }
  }


  getImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/images/placeholder.png';


    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }


    const baseUrl = 'http://localhost:5000';
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${cleanPath}`;
  }
}
