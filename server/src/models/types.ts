/** Domain types — the JSON shapes the API sends to the frontend (camelCase). */
export type Role = "customer" | "admin";
export type UserStatus = "active" | "suspended";
export type ProductStatus = "active" | "draft" | "archived";
export type ReviewStatus = "pending" | "approved" | "hidden" | "rejected";
export const ORDER_STATUSES = [
  "placed",
  "payment_verification",
  "payment_confirmed",
  "processing",
  "ready",
  "out_for_delivery",
  "delivered",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus =
  | "awaiting_receipt"
  | "pending_verification"
  | "paid"
  | "rejected"
  | "resubmit";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  image: string;
  images: string[];
  colors: string[];
  sizes: string[];
  stock: number;
  featured: boolean;
  newArrival: boolean;
  customizable: boolean;
  status: ProductStatus;
  specifications: string;
  description: string;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  image?: string;
  active: boolean;
};

export type DeliveryLocation = {
  id: string;
  name: string;
  address: string;
  description: string;
  fee: number;
  eta: string;
  active: boolean;
};

export type Review = {
  id: string;
  productId: string;
  customerId: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  status: ReviewStatus;
  image?: string;
};

export type Customization = {
  blank: string;
  instructions: string;
  designName?: string;
  designData?: string;
};

export type CartItem = {
  key: string;
  product: Product;
  quantity: number;
  size: string;
  color: string;
  customization?: Customization;
};

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  customization?: Customization;
};

export type Order = {
  id: string;
  customerId: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  deliveryFee: number;
  total: number;
  contact: { name: string; email: string; phone: string };
  delivery: { address: string; city: string; state: string; locationId: string; locationName: string };
  expectedDelivery: string;
  status: OrderStatus;
  paymentId: string;
};

export type Receipt = { name: string; type: string; dataUrl: string; uploadedAt: string };
export type PaymentNote = { at: string; text: string };
export type Payment = {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  date: string;
  status: PaymentStatus;
  receipt?: Receipt;
  notes: PaymentNote[];
};

export const iso = (d: Date | string) => (d instanceof Date ? d.toISOString() : new Date(d).toISOString());
