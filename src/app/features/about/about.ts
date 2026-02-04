import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About {
  stats = [
    { value: '50K+', label: 'Happy Customers' },
    { value: '1000+', label: 'Products' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '4.8', label: 'Average Rating' }
  ];

  values = [
    {
      icon: '✨',
      title: 'Quality First',
      description: 'We never compromise on quality. Every product is carefully inspected before reaching you.'
    },
    {
      icon: '💰',
      title: 'Fair Pricing',
      description: 'Great style shouldn\'t cost a fortune. We keep our prices honest and competitive.'
    },
    {
      icon: '🤝',
      title: 'Customer First',
      description: 'Your satisfaction is our priority. We\'re here to help at every step of your shopping journey.'
    },
    {
      icon: '🌱',
      title: 'Sustainability',
      description: 'We care about our planet. We\'re committed to sustainable practices in everything we do.'
    }
  ];

  team = [
    {
      name: 'Ahmed Hassan',
      role: 'Founder & CEO',
      bio: 'Passionate about fashion and entrepreneurship, Ahmed founded Urban Style to bring quality casual wear to everyone.',
      image: '👨'
    },
    {
      name: 'Sara Mohamed',
      role: 'Head of Design',
      bio: 'With 10 years of fashion experience, Sara curates our collections to keep you looking stylish.',
      image: '👩'
    },
    {
      name: 'Omar Ali',
      role: 'Customer Success Manager',
      bio: 'Omar ensures every customer has an amazing experience from browsing to delivery.',
      image: '👨'
    },
    {
      name: 'Nour Ibrahim',
      role: 'Operations Manager',
      bio: 'Nour keeps everything running smoothly, ensuring fast delivery and quality service.',
      image: '👩'
    }
  ];
}
