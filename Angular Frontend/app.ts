import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './Components/header/header';
import { CartService } from './Services/cart-service';
import { inject } from '@angular/core';
import { AuthService } from './Services/auth-service';
import { OnInit } from '@angular/core';
import { ToastContainer } from './shared/toast/toast-container';
import { ConfirmModal } from './shared/confirm-modal/confirm-modal';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, ToastContainer, ConfirmModal],
  template: `
    <app-header />
    <div class="page-body">
      <router-outlet />
    </div>
    <app-toast-container />
    <app-confirm-modal />
  `
})
export class App implements OnInit {
  private cartService = inject(CartService);
  private authService = inject(AuthService);

  ngOnInit() {
    // Only load the cart if a user session actually exists
    if (this.authService.isLoggedIn()) {
      this.cartService.loadCart();
    }
  }
}