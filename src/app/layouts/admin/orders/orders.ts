import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Admin } from '../../../core/services/admin';
import { ToastService } from '../../../core/services/toast';
import { ConfirmationModalComponent, ConfirmationConfig } from '../../../shared/components/confirmation/confirmation';

interface ReturnRequest {
  requested: boolean;
  requestedAt?: Date;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
  adminResponseAt?: Date;
}

interface Order {
  _id?: string;
  orderId?: string;
  customer: string;
  email: string;
  phone?: string;
  date: string;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'refused' | 'return-requested' | 'returned';
  items: number;
  itemsData?: OrderItemData[];
  paymentMethod: string;
  shippingAddress: string;
  createdAt?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  returnRequest?: ReturnRequest;
}

interface OrderItemData {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  subtotal: number;
  product?: {
    _id: string;
    name: string;
    images?: string[];
  };
}

interface Stat {
  label: string;
  value: string;
  color: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders implements OnInit {
  private adminService = inject(Admin);
  private toast = inject(ToastService);

  searchTerm: string = '';
  statusFilter: string = 'all';

  startDate: string = '';
  endDate: string = '';
  showDatePicker: boolean = false;
  isExportingPDF: boolean = false;
  isExportingExcel: boolean = false;

  stats: Stat[] = [];
  orders: Order[] = [];
  isLoading: boolean = false;

  showViewModal: boolean = false;
  showStatusModal: boolean = false;
  showReturnModal: boolean = false;
  viewingOrder: Order | null = null;
  editingOrder: Order | null = null;
  returnOrder: Order | null = null;
  returnAction: 'approve' | 'reject' | null = null;
  adminResponse: string = '';

  // Confirmation Modal
  showConfirmModal = false;
  confirmConfig: ConfirmationConfig = {
    title: 'Confirm',
    message: 'Are you sure?'
  };
  pendingAction: (() => void) | null = null;

  availableStatuses: ('pending' | 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'refused')[] = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'shipped',
    'delivered',
    'cancelled',
    'refused'
  ];

  ngOnInit(): void {
    this.loadOrders();
    this.loadStats();
    this.setDefaultDates();
  }

  private showConfirmation(config: ConfirmationConfig, action: () => void): void {
    this.confirmConfig = config;
    this.pendingAction = action;
    this.showConfirmModal = true;
  }

  onModalConfirm(): void {
    this.showConfirmModal = false;
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
  }

  onModalCancel(): void {
    this.showConfirmModal = false;
    this.pendingAction = null;
  }

  setDefaultDates(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.endDate = this.formatDate(today);
    this.startDate = this.formatDate(thirtyDaysAgo);
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  toggleDatePicker(): void {
    this.showDatePicker = !this.showDatePicker;
  }

  setLastWeek(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    this.startDate = this.formatDate(lastWeek);
    this.endDate = this.formatDate(today);
  }

  setLastMonth(): void {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);

    this.startDate = this.formatDate(lastMonth);
    this.endDate = this.formatDate(today);
  }

  setLastYear(): void {
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);

    this.startDate = this.formatDate(lastYear);
    this.endDate = this.formatDate(today);
  }

  exportPDF(): void {
    if (!this.startDate || !this.endDate) {
      this.toast.warning('Please select a date range');
      return;
    }

    this.isExportingPDF = true;
    this.toast.info('Preparing PDF report...');

    this.adminService.downloadSalesReportPDF(this.startDate, this.endDate).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sales-report-${this.startDate}-${this.endDate}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.isExportingPDF = false;
        this.showDatePicker = false;
        this.toast.success('PDF report downloaded successfully!');
      },
      error: () => {
        this.toast.error('Failed to download PDF report');
        this.isExportingPDF = false;
      }
    });
  }

  exportExcel(): void {
    if (!this.startDate || !this.endDate) {
      this.toast.warning('Please select a date range');
      return;
    }

    this.isExportingExcel = true;
    this.toast.info('Preparing Excel report...');

    this.adminService.downloadSalesReportExcel(this.startDate, this.endDate).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sales-report-${this.startDate}-${this.endDate}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.isExportingExcel = false;
        this.showDatePicker = false;
        this.toast.success('Excel report downloaded successfully!');
      },
      error: () => {
        this.toast.error('Failed to download Excel report');
        this.isExportingExcel = false;
      }
    });
  }

loadOrders(): void {
  this.isLoading = true;

  this.adminService.getAllOrders().subscribe({
    next: (response) => {
      this.orders = (response.data || response.orders || []).map((order: any) => {
        let customerName = 'Unknown';
        if (order.user) {
          if (order.user.firstName && order.user.lastName) {
            customerName = `${order.user.firstName} ${order.user.lastName}`;
          } else if (order.user.name) {
            customerName = order.user.name;
          }
        } else if (order.customer) {
          customerName = order.customer;
        }

        let itemsCount = 0;
        let itemsDataArray = [];

        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
          itemsDataArray = order.items;
          itemsCount = order.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        } else if (order.itemsData && Array.isArray(order.itemsData) && order.itemsData.length > 0) {
          itemsDataArray = order.itemsData;
          itemsCount = order.itemsData.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        } else if (order.itemsCount) {
          itemsCount = order.itemsCount;
        } else if (typeof order.items === 'number') {
          itemsCount = order.items;
        }

        return {
          _id: order._id,
          orderId: order.orderId || order.orderNumber || order._id,
          customer: customerName,
          email: order.user?.email || order.email || '-',
          phone: order.user?.phone || order.phone || '-',
          date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-',
          total: order.finalAmount || order.totalAmount || order.total || 0,
          items: itemsCount,
          itemsData: itemsDataArray,
          paymentMethod: order.paymentMethod || 'Cash',
          shippingAddress: this.formatAddress(order.shippingAddress) || order.address || '-',
          status: order.status,
          user: order.user,
          returnRequest: order.returnRequest
        };
      });

      this.isLoading = false;
      this.updateStats();
    },
    error: () => {
      this.isLoading = false;
      this.toast.error('Failed to load orders');
    }
  });
}

  formatAddress(address: any): string {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address !== null) {
      const parts = [
        address.addressLine,
        address.city,
        address.state
      ].filter(Boolean);
      return parts.join(', ') || '-';
    }
    return '-';
  }

  loadStats(): void {
    this.updateStats();
  }

  updateStats(): void {
    const totalOrders = this.orders.length;
    const pendingOrders = this.orders.filter(o => o.status === 'pending').length;
    const returnRequests = this.orders.filter(o => o.status === 'return-requested').length;
    const totalRevenue = this.orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    this.stats = [
      { label: 'Total Orders', value: totalOrders.toString(), color: 'blue' },
      { label: 'Pending', value: pendingOrders.toString(), color: 'yellow' },
      { label: 'Returns', value: returnRequests.toString(), color: 'orange' },
      { label: 'Revenue', value: `${totalRevenue.toFixed(2)} EGP`, color: 'green' }
    ];
  }

  get filteredOrders(): Order[] {
    return this.orders.filter(order => {
      const matchesSearch =
        order.customer.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (order.orderId?.toLowerCase() || '').includes(this.searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus =
        this.statusFilter === 'all' || order.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refused: 'Refused',
      'return-requested': 'Return Requested',
      'returned': 'Returned'
    };
    return texts[status] || status;
  }

  handleReturnRequest(order: Order, action: 'approve' | 'reject'): void {
    this.returnOrder = order;
    this.returnAction = action;
    this.adminResponse = '';
    this.showReturnModal = true;
  }

  closeReturnModal(): void {
    this.showReturnModal = false;
    this.returnOrder = null;
    this.returnAction = null;
    this.adminResponse = '';
  }

  submitReturnDecision(): void {
    if (!this.returnOrder || !this.returnAction || !this.returnOrder._id) return;

    const actionText = this.returnAction === 'approve' ? 'approve' : 'reject';
    const message = this.returnAction === 'approve'
      ? `Are you sure you want to approve this return request? The order will be marked as returned.`
      : `Are you sure you want to reject this return request?`;

    this.showConfirmation(
      {
        title: `${this.returnAction === 'approve' ? 'Approve' : 'Reject'} Return Request`,
        message: message,
        confirmText: this.returnAction === 'approve' ? 'Approve' : 'Reject',
        cancelText: 'Cancel',
        type: this.returnAction === 'approve' ? 'success' : 'warning'
      },
      () => this.executeReturnDecision()
    );
  }

  private executeReturnDecision(): void {
    if (!this.returnOrder || !this.returnAction || !this.returnOrder._id) return;

    const data = {
      action: this.returnAction,
      adminResponse: this.adminResponse.trim() || `Return ${this.returnAction}d by admin`
    };

    this.adminService.handleReturnRequest(this.returnOrder._id, data).subscribe({
      next: () => {
        this.toast.success(`Return request ${this.returnAction}d successfully!`);
        this.closeReturnModal();
        this.loadOrders();
      },
      error: (err: any) => {
        this.toast.error('Failed to handle return request: ' + (err.error?.message || err.message));
      }
    });
  }

  viewOrder(order: Order): void {
    this.viewingOrder = order;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.viewingOrder = null;
  }

  changeStatus(order: Order): void {
    this.editingOrder = order;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.editingOrder = null;
  }

  updateOrderStatus(newStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'refused'): void {
    if (!this.editingOrder) return;

    const id = this.editingOrder._id;
    if (!id) return;

    this.showConfirmation(
      {
        title: 'Update Order Status',
        message: `Are you sure you want to change the order status to "${this.getStatusText(newStatus)}"?`,
        confirmText: 'Update',
        cancelText: 'Cancel',
        type: 'info'
      },
      () => this.executeUpdateStatus(id, newStatus)
    );
  }

  private executeUpdateStatus(id: string, newStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'refused'): void {
    this.adminService.updateOrderStatus(id, newStatus).subscribe({
      next: () => {
        this.loadOrders();
        this.closeStatusModal();
        this.toast.success(`Order status updated to ${this.getStatusText(newStatus)}!`);
      },
      error: (err: any) => {
        this.toast.error('Failed to update order status: ' + (err.error?.message || err.message));
      }
    });
  }

  deleteOrder(order: Order): void {
    const id = order._id;
    if (!id) return;

    this.showConfirmation(
      {
        title: 'Delete Order',
        message: `Are you sure you want to delete order #${order.orderId}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      },
      () => this.executeDeleteOrder(id)
    );
  }

  private executeDeleteOrder(id: string): void {
    this.adminService.deleteOrder(id).subscribe({
      next: () => {
        this.loadOrders();
        this.toast.success('Order deleted successfully!');
      },
      error: (err: any) => {
        this.toast.error('Failed to delete order: ' + (err.error?.message || err.message));
      }
    });
  }

  printOrder(order: Order): void {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) {
      this.toast.error('Please disable popup blockers to print');
      return;
    }

    const itemsHtml = order.itemsData
      ?.map(
        (item) => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.quantity}</td>
        <td>${item.price.toFixed(2)} EGP</td>
        <td>${item.subtotal.toFixed(2)} EGP</td>
      </tr>
    `
      )
      .join('') || '';

    const status = this.getStatusText(order.status);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${order.orderId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .print-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            border-bottom: 3px solid #FF6B35;
            padding-bottom: 20px;
            margin-bottom: 30px;
            text-align: center;
          }
          .header h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 5px;
          }
          .header p {
            color: #666;
            font-size: 14px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #FF6B35;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #eee;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 10px;
          }
          .info-item {
            padding: 8px 0;
          }
          .info-label {
            display: block;
            font-weight: bold;
            color: #333;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .info-value {
            display: block;
            color: #666;
            font-size: 14px;
          }
          .full-width {
            grid-column: 1 / -1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #f0f0f0;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            font-size: 12px;
            color: #333;
            border-bottom: 2px solid #ddd;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
          }
          .total-section {
            text-align: right;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #eee;
          }
          .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .total-row.final {
            font-size: 18px;
            font-weight: bold;
            color: #FF6B35;
            margin-top: 10px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-pending {
            background-color: #FFF3CD;
            color: #856404;
          }
          .status-preparing {
            background-color: #D1ECF1;
            color: #0C5460;
          }
          .status-shipped {
            background-color: #D4EDDA;
            color: #155724;
          }
          .status-delivered {
            background-color: #D4EDDA;
            color: #155724;
          }
          .status-cancelled {
            background-color: #F8D7DA;
            color: #721C24;
          }
          @media print {
            body {
              background-color: white;
            }
            .print-container {
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- Header -->
          <div class="header">
            <h1>🛍️ Order Invoice</h1>
            <p>Order #${order.orderId}</p>
          </div>

          <!-- Customer Information -->
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Full Name</span>
                <span class="info-value">${order.customer}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${order.email}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone</span>
                <span class="info-value">${order.phone || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Payment Method</span>
                <span class="info-value">${order.paymentMethod}</span>
              </div>
              <div class="info-item full-width">
                <span class="info-label">Shipping Address</span>
                <span class="info-value">${order.shippingAddress}</span>
              </div>
            </div>
          </div>

          <!-- Order Information -->
          <div class="section">
            <div class="section-title">Order Details</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Order Date</span>
                <span class="info-value">${order.date}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status</span>
                <span class="status-badge status-${order.status}">${status}</span>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="section">
            <div class="section-title">Order Items</div>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Total Section -->
          <div class="total-section">
            <div class="total-row final">
              Total: <span style="margin-left: 20px;">${order.total.toFixed(2)} EGP</span>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>Thank you for your purchase!</p>
            <p>Printed on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      this.toast.success('Print dialog opened!');
    }, 250);
  }

  printFromView(): void {
    if (this.viewingOrder) {
      this.printOrder(this.viewingOrder);
    }
  }

  exportOrders(): void {
    this.showDatePicker = !this.showDatePicker;
  }
}
