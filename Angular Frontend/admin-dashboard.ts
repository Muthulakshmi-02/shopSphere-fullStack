import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Page } from '../../Services/product-service';
import { CategoryService } from '../../Services/category-service';
import {
  ProductResponse,
  ProductRequest,
  ProductStatus,
} from '../../Models/Product.model';
import {
  CategoryResponse,
  CategoryRequest,
} from '../../Models/Category.model';
import { productImageUrl } from '../../shared/api.config';
import { OrderService } from '../../Services/order-service';
import { OrderResponse } from '../../Models/Order.model';
import { ToastService } from '../../shared/toast/toast-service';
import { ConfirmService } from '../../shared/confirm-modal/confirm-service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboard implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  protected readonly productImageUrl = productImageUrl;
  protected readonly orderStatusOptions = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  // View state
  activeTab = signal<'products' | 'categories' | 'orders' | ''>('products');
  isModalOpen = signal(false);
  isEditMode = signal(false);
  selectedId = signal<number | null>(null);
  loading = signal(false);

  // Data
  products = signal<ProductResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  orders = signal<OrderResponse[]>([]);
  ordersLoading = signal(false);
  updatingOrderId = signal<number | null>(null);
  searchTerm = signal('');
  page = signal(0);
  size = signal(10);
  totalPages = signal(0);
  totalElements = signal(0);

  // Sorting (maps to backend sort param)
  currentSort = 'price,asc';

  // Forms
  productForm: ProductRequest = this.initProductForm();
  categoryForm: CategoryRequest = { name: '', description: '' };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadOrders();
  }

  loadOrders(): void {
    this.ordersLoading.set(true);
    this.orderService.getAllOrders().subscribe({
      next: (res) => {
        // Backend may wrap data (ApiResponse) or return a raw array - handle both.
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        this.orders.set(list);
        this.ordersLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.ordersLoading.set(false);
        this.toastService.error('Could not load orders.');
      },
    });
  }

  updateOrderStatus(orderId: number, status: string): void {
    this.updatingOrderId.set(orderId);
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.updatingOrderId.set(null);
        this.orders.update(list =>
          list.map(o => (o.orderId === orderId ? { ...o, orderStatus: status } : o))
        );
        this.toastService.success(`Order #${orderId} marked ${status}.`);
      },
      error: (err) => {
        this.updatingOrderId.set(null);
        console.error('Failed to update order status', err);
        this.toastService.error('Could not update order status.');
      },
    });
  }

  loadProducts(): void {
    this.loading.set(true);

    this.productService
      .getFilteredProducts(
        this.searchTerm(),
        null,
        0,
        1_000_000,
        this.page(),
        this.size(),
        this.currentSort
      )
      .subscribe({
        next: (res) => {
          const data = res.data as Page<ProductResponse> | undefined;
          this.products.set(data?.content || []);
          this.totalPages.set(data?.totalPages || 0);
          this.totalElements.set(data?.totalElements || 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (res) => this.categories.set(res.data || []),
    });
  }

  // UI actions
  openAddProduct(): void {
    this.isEditMode.set(false);
    this.productForm = this.initProductForm();
    this.isModalOpen.set(true);
  }

  openEditProduct(p: ProductResponse): void {
    this.isEditMode.set(true);
    this.selectedId.set(p.productId);
    this.productForm = {
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      imageUrl: p.imageUrl,
      status: p.status,
      categoryId: p.categoryId,
    };
    this.isModalOpen.set(true);
  }

  async saveProduct(): Promise<void> {
    const confirmed = await this.confirmService.ask({
      title: this.isEditMode() ? 'Save changes?' : 'Create product?',
      message: this.isEditMode()
        ? 'This will update the product for all customers immediately.'
        : 'This will add a new product to your store.',
      confirmLabel: this.isEditMode() ? 'Save changes' : 'Create product',
    });
    if (!confirmed) return;

    const request = this.isEditMode()
      ? this.productService.updateProduct(this.selectedId()!, this.productForm)
      : this.productService.createProduct(this.productForm);

    this.loading.set(true);
    request.subscribe({
      next: () => {
        this.isModalOpen.set(false);
        this.loading.set(false);
        this.toastService.success(this.isEditMode() ? 'Product updated.' : 'Product created.');
        this.loadProducts();
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error(err.error?.message || 'Failed to save product.');
      },
    });
  }

  saveCategory(): void {
    if (!this.categoryForm.name.trim()) return;

    this.categoryService.createCategory(this.categoryForm).subscribe({
      next: () => {
        this.categoryForm = { name: '', description: '' };
        this.toastService.success('Category created.');
        this.loadCategories();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to create category.');
      },
    });
  }

  async deleteProduct(id: number): Promise<void> {
    const confirmed = await this.confirmService.ask({
      title: 'Delete this product?',
      message: 'This will permanently remove the product from your store. This can\'t be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.loading.set(true);
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastService.success('Product deleted.');
        this.loadProducts();
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Could not delete product.');
      },
    });
  }

  // Pagination helpers
  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.page.set(0);
    this.loadProducts();
  }

  goPrevPage(): void {
    if (this.page() > 0) {
      this.page.set(this.page() - 1);
      this.loadProducts();
    }
  }

  goNextPage(): void {
    if (this.page() < this.totalPages() - 1) {
      this.page.set(this.page() + 1);
      this.loadProducts();
    }
  }

  changeSort(sort: string): void {
    this.currentSort = sort;
    this.page.set(0);
    this.loadProducts();
  }


  // Form init
  private initProductForm(): ProductRequest {
    return {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      imageUrl: '',
      status: ProductStatus.IN_STOCK,
      categoryId: 0,
    };
  }
}
