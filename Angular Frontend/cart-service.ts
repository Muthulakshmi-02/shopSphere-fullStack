import { signal } from '@angular/core';
import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../Models/User.model';
import { CartRequest } from '../Models/Cart.model';
import { tap, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/cart';

  // State Signals
  cartData = signal<CartRequest | null>(null);
  isCartOpen = signal(false);

  // Computed total quantity for the navbar badge
  itemCount = computed(() =>
    this.cartData()?.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0
  );

  /**
   * Load current user's cart from DB
   */
  loadCart(): Observable<ApiResponse<CartRequest>> {
    return this.http.get<ApiResponse<CartRequest>>(this.API_URL).pipe(
      tap((res) => {
        this.cartData.set(res.success && res.data ? res.data : null);
      })
    );
  }

  /**
   * Add Item: Used by Buy Now and Add to Cart
   */
  addItemToCart(productId: number, quantity: number = 1): Observable<ApiResponse<CartRequest>> {
    return this.http.post<ApiResponse<CartRequest>>(
      `${this.API_URL}/add/${productId}/${quantity}`, {}
    ).pipe(
      tap((res) => {
        if (res.success && res.data) this.cartData.set(res.data);
      })
    );
  }

  /**
   * Update Quantity: Used for + / - buttons in Cart UI
   */
  updateQuantity(productId: number, quantity: number): Observable<ApiResponse<CartRequest>> {
    return this.http.put<ApiResponse<CartRequest>>(
      `${this.API_URL}/update/${productId}/${quantity}`, {}
    ).pipe(
      tap((res) => {
        if (res.success && res.data) this.cartData.set(res.data);
      })
    );
  }

  /**
   * Remove Single Item
   */
  removeItem(productId: number): Observable<ApiResponse<CartRequest>> {
    return this.http.delete<ApiResponse<CartRequest>>(
      `${this.API_URL}/remove/${productId}`
    ).pipe(
      tap((res) => {
        if (res.success) this.cartData.set(res.data || null);
      })
    );
  }

  /**
   * Clear Cart Manually
   */
  clearCart(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/clear`).pipe(
      tap((res) => {
        if (res.success) this.cartData.set(null);
      })
    );
  }

  /**
   * UI Helper: Toggle Sidebar
   */
  toggleCart() {
    this.isCartOpen.update((v) => !v);
  }
}