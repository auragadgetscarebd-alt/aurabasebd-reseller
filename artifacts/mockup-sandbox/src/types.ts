export type Role = "admin" | "reseller" | "customer";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: number;
  customerId: number;
  resellerId: number | null;
  status: string;
  totalAmount: string;
  shippingAddress: string | null;
  notes: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: string;
}

export interface Payment {
  id: number;
  orderId: number;
  userId: number;
  method: string;
  transactionId: string;
  amount: string;
  status: string;
  notes: string | null;
  createdAt: string;
}
