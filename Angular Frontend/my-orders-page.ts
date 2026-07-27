

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { OrderService } from '../../Services/order-service';
import { OrderResponse } from '../../Models/Order.model';
import { productImageUrl } from '../../shared/api.config';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './my-orders-page.html',
  styleUrls: ['./my-orders-page.css']
})
export class MyOrdersPage implements OnInit {
  private orderService = inject(OrderService);
  protected readonly productImageUrl = productImageUrl;
  
  orders = signal<OrderResponse[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.orderService.getUserOrderHistory().subscribe({
      next: (res) => {
        // Your ApiResponse has a 'data' field containing the list
        this.orders.set(res.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.loading.set(false);
      }
    });
  }
}