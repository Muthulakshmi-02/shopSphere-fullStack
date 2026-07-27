import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// Adjust path
import { OrderRequest, OrderResponse, PaymentRequest } from '../Models/Order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api'; 
  private apiUrl = `${this.baseUrl}/orders`;
  private adminApiUrl = `${this.baseUrl}/admin/orders`;
  private paymentUrl = `${this.baseUrl}/payments`;

  /**
   * Place a new order
   * Maps to: POST /api/orders/checkout
   */
  checkout(request: OrderRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/checkout`, request, {
      withCredentials: true,
    });
  }

  /**
   * Fetch current user's order history
   * Maps to: GET /api/orders/my-orders
   */
  getUserOrderHistory(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my-orders`, {
      withCredentials: true,
    });
  }

  /**
   * For Admin: Fetch all orders
   * Maps to: GET /api/admin/orders/all
   */
  getAllOrders(): Observable<any> {
    return this.http.get<any>(`${this.adminApiUrl}/all`, {
      withCredentials: true,
    });
  }

  /**
   * Verify and save payment details after checkout
   * Maps to: POST /api/payments/verify
   */
  verifyPayment(request: PaymentRequest): Observable<any> {
    return this.http.post<any>(`${this.paymentUrl}/verify`, request, {
      withCredentials: true,
    });
  }

  /**
   * Update Order Status (Admin feature)
   * Maps to: PUT /api/admin/orders/{orderId}/status?status=NEW_STATUS
   */
  updateOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.put<any>(
      `${this.adminApiUrl}/${orderId}/status?status=${status}`,
      {},
      { withCredentials: true }
    );
  }
}