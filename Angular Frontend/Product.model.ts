export enum ProductStatus {
  IN_STOCK = 'IN_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}


/**
 * Matches your Backend: ProductResponse.java
 * Used for displaying data in the Dashboard and Grids.
 */
export interface ProductResponse {
  productId: number;     // private Long productId
  name: string;          // private String name
  description: string;   // private String description
  price: number;         // private Double price
  stock: number;         // private Integer stock
  imageUrl: string;      // private String imageUrl
  status: ProductStatus; // private ProductStatus status (Enum)
  categoryId: number;    // private Long categoryId
  categoryName: string;  // private String categoryName
  isNew?: boolean;
  inCart?: boolean;
  outOfStock?: boolean;
}

/**
 * Matches your Backend: ProductRequest.java
 * Used when the Admin creates or updates a product.
 */
export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  status: ProductStatus;
  categoryId: number;
}

// Shortcut alias for cleaner code in your components
export type Product = ProductResponse;