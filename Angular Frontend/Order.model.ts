export interface OrderRequest {
  shippingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  paymentMethod: string;
  gatewayToken?: string;
}

export interface OrderItemResponse {
  productId: number;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  imageUrl: string;
}

export interface OrderResponse {
  orderId: number;
  orderDate: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  shippingAddress: string;
  items: OrderItemResponse[];
}
export interface PaymentRequest {
  orderId: number;
  transactionId: string;
  paymentMethod: string;
  paymentGateway: string;
  status: string;
}