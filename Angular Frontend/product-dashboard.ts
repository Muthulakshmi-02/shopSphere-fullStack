import { Component, OnInit, signal, inject, effect, computed } from '@angular/core';
import { ProductService, Page } from '../../Services/product-service';
import { CategoryService } from '../../Services/category-service';
import { CartService } from '../../Services/cart-service';
import { ProductResponse } from '../../Models/Product.model';
import { CategoryResponse } from '../../Models/Category.model';
import { Router } from '@angular/router';
import {
  CommonModule,
  CurrencyPipe,
  NgFor,
  NgIf,
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/toast/toast-service';

export interface SortOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-product-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, NgFor],
  templateUrl: './product-dashboard.html',
  styleUrls: ['./product-dashboard.css'],
})
export class ProductDashboard implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // ---------- State ----------
  products = signal<ProductResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  totalProducts = signal<number>(0);
  totalPages = signal<number>(0);
  loading = signal<boolean>(false);
  pageNumbers = signal<number[]>([]);
  readonly API_URL = 'http://localhost:8080';

  // ---------- Filters & pagination ----------
  searchKeyword = signal<string>('');
  selectedCategory = signal<number | null>(null);
  selectedSort = signal<string>('price,asc');
  currentPage = signal<number>(0);
  pageSize = signal<number>(12);

  sortOptions: SortOption[] = [
    { value: 'price,asc', label: 'Price: Low to High' },
    { value: 'price,desc', label: 'Price: High to Low' },
    { value: 'name,asc', label: 'Name: A to Z' },
    { value: 'name,desc', label: 'Name: Z to A' },
  ];

  constructor() {
    effect(
      () => {
        this.searchKeyword();
        this.selectedCategory();
        this.selectedSort();
        this.currentPage();
        this.pageSize();
        this.loadProducts();
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (res) => this.categories.set(res.data || []),
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  loadProducts() {
    this.loading.set(true);
    this.productService
      .getFilteredProducts(
        this.searchKeyword() || '',
        this.selectedCategory(),
        0,
        1_000_000,
        this.currentPage(),
        this.pageSize(),
        this.selectedSort() || 'price,asc',
      )
      .subscribe({
        next: (res) => {
          const page = (res.data as Page<ProductResponse>) || { content: [], totalElements: 0, totalPages: 1 };
          const content = page.content || [];
          const totalElements = page.totalElements ?? content.length;
          const totalPages = page.totalPages ?? 1;

          this.products.set(content);
          this.totalProducts.set(totalElements);
          this.totalPages.set(totalPages);
          this.pageNumbers.set(Array.from({ length: totalPages }, (_, i) => i));
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load products', err);
          this.loading.set(false);
        },
      });
  }

  // ---------- Type-Safe Event Handlers ----------
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchKeyword.set(target.value || '');
    this.currentPage.set(0);
  }

  onSortChangeSafe(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.onSortChange(target.value);
  }

  // ---------- Cart Logic ----------
  addToCart(productId: number): void {
    this.cartService.addItemToCart(productId, 1).subscribe({
      next: (res) => {
        this.toastService.success('Item added to your cart!');
        console.log('Item added:', res);
      },
      error: (err) => {
        console.error("Add to cart failed", err);
        if (err.status === 401) {
          this.toastService.error('Please login first to add items to the cart.');
        } else {
          this.toastService.error('Could not add item to cart.');
        }
      }
    });
  }

  buyNow(productId: number): void {
    // Pass product details directly to checkout via route state or query params
    this.router.navigate(['/checkout'], {
      queryParams: {
        buyNow: productId,
        quantity: 1
      }
    });
  }


  // ---------- Paging & Helpers ----------
  clearFilters(): void {
    this.searchKeyword.set('');
    this.selectedCategory.set(null);
    this.selectedSort.set('price,asc');
    this.currentPage.set(0);
  }

  onSortChange(sortValue: string): void {
    this.selectedSort.set(sortValue);
    this.currentPage.set(0);
  }

  trackByProductId(index: number, product: ProductResponse): number {
    return product.productId;
  }

  goPrevPage(): void {
    if (this.currentPage() > 0) this.currentPage.set(this.currentPage() - 1);
  }

  goNextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) this.currentPage.set(this.currentPage() + 1);
  }

  goToPage(pageIndex: number): void {
    this.currentPage.set(pageIndex);
  }
  // ---------- Type-Safe Event Handlers ----------

  onCategoryChange(event: Event): void {  // ← NEW METHOD
    const target = event.target as HTMLSelectElement;
    const value = target.value ? +target.value : null;
    this.selectedCategory.set(value);
    this.currentPage.set(0);
  }
  trackByIndex(index: number): number {
    return index;
  }


}
