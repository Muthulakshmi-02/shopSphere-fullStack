import { Routes } from '@angular/router';
import { adminGuard } from './Guards/admin-guard';
import { AdminDashboard } from './Components/admin-dashboard/admin-dashboard';
import { Login } from './Components/login/login';
import { ProductDashboard } from './Components/product-dashboard/product-dashboard';
import { Register } from './Components/register/register';
import { Cart } from './Components/cart/cart';
// Import your new components
import { CheckoutPage } from './Components/checkout/checkout';
import { OrderSuccess } from './Components/order-succes/order-succes';
import { MyOrdersPage } from './Components/my-orders-page/my-orders-page';

export const routes: Routes = [
  // Browsing products is public on the backend (GET /api/products/** is
  // permitAll()) - the homepage should reflect that, not force a login wall.
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'products', component: ProductDashboard },
  { path: 'cart', component: Cart },

  // --- NEW PURCHASE FLOW ROUTES ---
  {
    path: 'checkout',
    component: CheckoutPage
    // canActivate: [userGuard] // Add this later to ensure only logged-in users buy
  },
  {
    path: 'order-success',
    component: OrderSuccess
  },
  {
    path: 'my-orders',
    component: MyOrdersPage
  },

  // --- ADMIN ROUTES ---
  {
    path: 'admindashboard',
    component: AdminDashboard,
    canActivate: [adminGuard]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];