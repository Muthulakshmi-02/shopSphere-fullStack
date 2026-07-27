import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CartService } from '../../Services/cart-service';
import { OrderService } from '../../Services/order-service';
import { OrderRequest, OrderResponse, PaymentRequest } from '../../Models/Order.model';
import { ToastService } from '../../shared/toast/toast-service';

type CheckoutStep = 'shipping' | 'payment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class CheckoutPage implements OnInit {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  route = inject(ActivatedRoute);

  // Get live cart data from your CartService signals
  cart = this.cartService.cartData;
  isProcessing = signal(false);

  // Two-step checkout: fill shipping/method -> (card methods only) enter card details & pay
  step = signal<CheckoutStep>('shipping');
  // The order created (PENDING) while we wait for card payment to be verified
  pendingOrder = signal<OrderResponse | null>(null);
  paymentError = signal<string | null>(null);

  // This matches your Java OrderRequest DTO perfectly
  orderForm: OrderRequest = {
    shippingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: '',
    paymentMethod: 'CREDIT_CARD' // Default value
  };

  // Mock card entry - never sent anywhere except our own simulated gateway call
  card = {
    nameOnCard: '',
    cardNumber: '',
    expiry: '',   // MM/YY
    cvv: ''
  };

  get isCardPayment(): boolean {
    return this.orderForm.paymentMethod === 'CREDIT_CARD' || this.orderForm.paymentMethod === 'DEBIT_CARD';
  }

  ngOnInit() {
    // Handle Buy Now - check for query params
    const buyNowId = this.route.snapshot.queryParams['buyNow'];
    const quantity = +this.route.snapshot.queryParams['quantity'] || 1;

    if (buyNowId) {
      console.log('Buy Now detected:', buyNowId, quantity);
      this.handleBuyNow(+buyNowId, quantity);
    }
  }

  private handleBuyNow(productId: number, quantity: number) {
    this.cartService.clearCart().subscribe({
      next: () => {
        this.cartService.addItemToCart(productId, quantity).subscribe({
          next: () => console.log('Buy Now item added to cart'),
          error: (err) => console.error('Failed to add Buy Now item:', err)
        });
      },
      error: (err) => console.error('Failed to clear cart for Buy Now:', err)
    });
  }

  /**
   * Step 1: validate shipping info and place the order (created as PENDING
   * on the backend). For COD we're done - the order is confirmed and paid
   * on delivery. For card payments, we move to the in-page card entry step
   * and only mark the order PAID once /api/payments/verify confirms it.
   */
  confirmOrder() {
    if (!this.orderForm.shippingAddress || !this.orderForm.city) {
      this.toastService.error('Please fill in all required fields.');
      return;
    }

    this.isProcessing.set(true);
    this.paymentError.set(null);

    this.orderService.checkout(this.orderForm).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        const order: OrderResponse = res.data;

        if (this.isCardPayment) {
          // Hold onto the order and move to the card entry step - cart is
          // cleared later, once payment is actually verified.
          this.pendingOrder.set(order);
          this.step.set('payment');
        } else {
          // Cash on Delivery: order is confirmed now, payment happens on delivery.
          this.finishAndGoToSuccess(order);
        }
      },
      error: (err) => {
        this.isProcessing.set(false);
        console.error('Order Error:', err);
        this.toastService.error(err.error?.message || 'Failed to place order.');
      }
    });
  }

  /**
   * Step 2 (card payments only): validate the card fields, simulate talking
   * to a payment gateway, then call the real backend /api/payments/verify
   * endpoint so the order is actually marked PAID server-side.
   */
  payWithCard() {
    const order = this.pendingOrder();
    if (!order) return;

    const error = this.validateCard();
    if (error) {
      this.paymentError.set(error);
      return;
    }

    this.paymentError.set(null);
    this.isProcessing.set(true);

    // Simulate a brief gateway round-trip for a realistic feel, then verify
    // against the backend - this is a mock gateway, not a real card network.
    setTimeout(() => {
      const request: PaymentRequest = {
        orderId: order.orderId,
        transactionId: 'MOCK-' + Date.now() + '-' + Math.floor(Math.random() * 100000),
        paymentMethod: this.orderForm.paymentMethod,
        paymentGateway: 'MockPay',
        status: 'SUCCESS'
      };

      this.orderService.verifyPayment(request).subscribe({
        next: () => {
          this.isProcessing.set(false);
          const paidOrder: OrderResponse = { ...order, paymentStatus: 'PAID' };
          this.finishAndGoToSuccess(paidOrder);
        },
        error: (err) => {
          this.isProcessing.set(false);
          console.error('Payment verification failed', err);
          this.paymentError.set(err.error?.message || 'Payment failed. Please try again.');
        }
      });
    }, 1200);
  }

  backToShipping() {
    this.step.set('shipping');
    this.paymentError.set(null);
  }

  private validateCard(): string | null {
    const digitsOnly = this.card.cardNumber.replace(/\s+/g, '');
    if (!this.card.nameOnCard.trim()) {
      return 'Please enter the name on the card.';
    }
    if (!/^\d{13,19}$/.test(digitsOnly)) {
      return 'Please enter a valid card number.';
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.card.expiry)) {
      return 'Expiry must be in MM/YY format.';
    }
    const [mm, yy] = this.card.expiry.split('/').map(Number);
    const expiryDate = new Date(2000 + yy, mm); // first day of the month after expiry
    if (expiryDate < new Date()) {
      return 'This card has expired.';
    }
    if (!/^\d{3,4}$/.test(this.card.cvv)) {
      return 'Please enter a valid CVV.';
    }
    return null;
  }

  private finishAndGoToSuccess(order: OrderResponse) {
    this.cartService.cartData.set(null);
    this.router.navigate(['/order-success'], { state: { order } });
  }
}
