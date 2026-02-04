import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface FAQ {
  question: string;
  answer: string;
  category: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './faq.html',
  styleUrl: './faq.scss'
})
export class Faq {
  searchQuery = '';
  activeCategory = 'all';

  categories = [
    { id: 'all', name: 'All' },
    { id: 'orders', name: 'Orders' },
    { id: 'shipping', name: 'Shipping' },
    { id: 'returns', name: 'Returns' },
    { id: 'payment', name: 'Payment' }
  ];

  faqs: FAQ[] = [
    // Orders
    {
      question: 'How do I place an order?',
      answer: 'Simply browse our products, add items to your cart, and proceed to checkout. You\'ll need to provide your shipping information and choose a payment method. Once confirmed, you\'ll receive an order confirmation email.',
      category: 'orders',
      isOpen: false
    },
    {
      question: 'Can I modify my order after placing it?',
      answer: 'Yes, you can modify or cancel your order within 2 hours of placing it. After that, the order enters processing and cannot be modified. Please contact our customer service immediately if you need to make changes.',
      category: 'orders',
      isOpen: false
    },
    {
      question: 'How can I track my order?',
      answer: 'You can track your order by logging into your account and visiting the "My Orders" section. You\'ll also receive email updates with tracking information once your order ships.',
      category: 'orders',
      isOpen: false
    },
    // Shipping
    {
      question: 'What are the shipping costs?',
      answer: 'We offer free shipping on orders over 500 EGP. For orders below this amount, standard shipping costs 50 EGP. Express shipping is available for an additional 100 EGP.',
      category: 'shipping',
      isOpen: false
    },
    {
      question: 'How long does delivery take?',
      answer: 'Standard delivery takes 3-5 business days. Express delivery takes 1-2 business days. Delivery times may vary depending on your location and product availability.',
      category: 'shipping',
      isOpen: false
    },
    {
      question: 'Do you deliver internationally?',
      answer: 'Currently, we only deliver within Egypt. We\'re working on expanding our shipping to other countries soon. Stay tuned!',
      category: 'shipping',
      isOpen: false
    },
    // Returns
    {
      question: 'What is your return policy?',
      answer: 'We offer a 14-day return policy from the date of delivery. Items must be in their original condition with tags attached. You can initiate a return from your account dashboard.',
      category: 'returns',
      isOpen: false
    },
    {
      question: 'How do I return an item?',
      answer: 'Log into your account, go to "My Orders", select the order you want to return, and click "Request Return". Our team will review your request and arrange pickup if approved.',
      category: 'returns',
      isOpen: false
    },
    {
      question: 'When will I receive my refund?',
      answer: 'Refunds are processed within 7-10 business days after we receive and inspect the returned item. The refund will be credited to your original payment method.',
      category: 'returns',
      isOpen: false
    },
    // Payment
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept Cash on Delivery (COD), Credit/Debit Cards (Visa, Mastercard), and Mobile Wallets (Vodafone Cash, Orange Money).',
      category: 'payment',
      isOpen: false
    },
    {
      question: 'Is Cash on Delivery available?',
      answer: 'Yes! Cash on Delivery is available for all orders. Simply choose this option at checkout and pay when you receive your order.',
      category: 'payment',
      isOpen: false
    },
    {
      question: 'Do you offer discounts or promo codes?',
      answer: 'Yes! We regularly offer discounts and promo codes. Subscribe to our newsletter or follow us on social media to stay updated on our latest offers and promotions.',
      category: 'payment',
      isOpen: false
    }
  ];

  get filteredFaqs(): FAQ[] {
    let filtered = this.faqs;

    // Filter by category
    if (this.activeCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === this.activeCategory);
    }

    // Filter by search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  toggleFaq(faq: FAQ): void {
    faq.isOpen = !faq.isOpen;
  }

  setCategory(categoryId: string): void {
    this.activeCategory = categoryId;
  }
}
