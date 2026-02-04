import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment-method',
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-method.html',
  styleUrl: './payment-method.scss',
})
export class PaymentMethod {
  @Input() selectedMethod: string = 'cod';
  @Output() paymentSelect = new EventEmitter<string>();
  @Output() notesChange = new EventEmitter<string>();

  orderNotes: string = '';

  paymentMethods = [
    {
      id: 'cod',
      name: 'Cash on Delivery',
      description: 'Pay when you receive your order',
      icon: '💵'
    },
    {
      id: 'card',
      name: 'Credit / Debit Card',
      description: 'Visa, Mastercard accepted',
      icon: '💳'
    },
    {
      id: 'wallet',
      name: 'Mobile Wallet',
      description: 'Vodafone Cash, Orange Money',
      icon: '📱'
    }
  ];

  selectPayment(methodId: string): void {
    this.selectedMethod = methodId;
  }

  onNotesChange(): void {
    this.notesChange.emit(this.orderNotes);
  }

  onContinue(): void {
    this.paymentSelect.emit(this.selectedMethod);
  }
}
