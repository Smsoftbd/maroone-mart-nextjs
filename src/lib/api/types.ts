// ─── Generic Wrappers ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

// ─── Store ──────────────────────────────────────────────────────────────────

export interface Store {
  name: string;
  logo: string;
  favicon: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  currency_symbol: string;
  social: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
  };
  colors: {
    primary: string;
    secondary: string;
  };
  features: {
    wishlist: boolean;
    reviews: boolean;
    loyalty: boolean;
    appointments: boolean;
    blog: boolean;
  };
}

// ─── Categories ─────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  description?: string;
  banner?: string | null;
  children: Category[];
}

export interface HomepageCategory {
  id: number;
  name: string;
  slug: string;
  image: string | null;
}

// ─── Brands ─────────────────────────────────────────────────────────────────

export interface Brand {
  id: number;
  name: string;
  logo?: string | null;
}

// ─── Products ───────────────────────────────────────────────────────────────

export interface ProductImage {
  id: number;
  url: string;
  sort_order?: number;
}

export interface Specification {
  label: string;
  value: string;
}

export interface Attribute {
  name: string;
  value: string;
}

export interface Barcode {
  id: number;
  sku: string;
  barcode?: string;
  selling_price: number;
  after_discount: number;
  discount: number;
  whole_sale_price?: number;
  stock: number;
  attributes: Attribute[];
}

export interface ProductMeta {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface ProductUnit {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  image: string;
  images: ProductImage[];
  short_description: string;
  description: string;
  model_number?: string;
  type: "simple" | "complex";
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  view_count: number;
  sale_count: number;
  weight?: string;
  dimensions?: string;
  specifications: Specification[];
  tags: string[];
  tax_percentage?: number;
  tax_type?: "exclusive" | "inclusive";
  hsn_code?: string;
  manage_stock: boolean;
  min_order_quantity: number;
  max_order_quantity: number;
  is_returnable: boolean;
  is_refundable: boolean;
  unit?: ProductUnit;
  category: { id: number; name: string; slug: string };
  brand?: { id: number; name: string } | null;
  barcodes: Barcode[];
  meta?: ProductMeta;
  translations?: Record<string, { name: string; description: string }>;
}

export interface ProductListParams {
  search?: string;
  category?: string;
  brand?: string;
  featured?: 1;
  lang?: string;
  per_page?: number;
  page?: number;
}

// ─── Flash Sales ─────────────────────────────────────────────────────────────

export interface FlashSale {
  id: number;
  title: string;
  ends_at: string;
  discount_percentage: number;
  products: Product[];
}

// ─── Banners ─────────────────────────────────────────────────────────────────

export interface HeroBanner {
  id: number;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  sort_order: number;
}

export interface Slider {
  id: number;
  image: string;
  link?: string;
  sort_order: number;
}

export interface Popup {
  id: number;
  title?: string;
  image: string;
  link?: string;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItemBarcode {
  sku: string;
  selling_price: number;
  after_discount: number;
  stock: number;
  attributes?: Attribute[];
}

export interface CartItemProduct {
  name: string;
  slug: string;
  image: string;
}

export interface CartItem {
  id: number;
  barcode_id: number;
  quantity: number;
  product: CartItemProduct;
  barcode: CartItemBarcode;
  line_total: number;
}

export interface CartData {
  items: CartItem[];
  total_items: number;
  sub_total: number;
}

export interface AddToCartResponse {
  cart_token?: string;
  data: CartData;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentStatus = "due" | "partial" | "paid";

export interface ShippingAddress {
  address: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface OrderItem {
  id: number;
  product_name: string;
  sku: string;
  quantity: number;
  price: number;
  sub_total: number;
}

export interface Order {
  id: number;
  invoice_number: string;
  date: string;
  shipping_address: ShippingAddress;
  payment_method: string;
  sub_total: number;
  shipping_cost: number;
  net_total: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  tracking_number?: string;
  estimated_delivery_date?: string;
  note?: string;
  items: OrderItem[];
}

export interface OrderListItem {
  id: number;
  invoice_number: string;
  date: string;
  net_total: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  tracking_number?: string;
}

export interface CreateOrderPayload {
  customer: {
    name: string;
    email?: string;
    phone: string;
  };
  items: { barcode_id: number; quantity: number }[];
  shipping_address: ShippingAddress;
  payment_method: string;
  coupon_code?: string;
  shipping_cost?: number;
  note?: string;
}

export interface CreateOrderResponse {
  message: string;
  order: {
    id: number;
    invoice_number: string;
    net_total: number;
    payment_status: PaymentStatus;
    status: OrderStatus;
    created_at: string;
  };
  points_earned: number;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface InitiatePaymentResponse {
  gateway_url?: string;
  client_secret?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  transaction_id?: string;
  order_id?: number;
}

// ─── Coupons ─────────────────────────────────────────────────────────────────

export interface CouponValidationResponse {
  valid: boolean;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  discount_amount: number;
  final_total: number;
}

// ─── Customer / Auth ─────────────────────────────────────────────────────────

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  password?: string;
  password_confirmation?: string;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  token_type: string;
  customer: Customer;
}

// ─── Wishlist ────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image: string;
}

// ─── Loyalty ─────────────────────────────────────────────────────────────────

export interface LoyaltyTransaction {
  id: number;
  type: "earn" | "redeem" | "expire" | string;
  points: number;
  description: string;
  created_at: string;
}

export interface LoyaltyData {
  balance: number;
  point_value: number;
  min_redeem: number;
  can_redeem: boolean;
  transactions: LoyaltyTransaction[];
}

// ─── Returns ─────────────────────────────────────────────────────────────────

export type ReturnStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface ReturnItem {
  id: number;
  sale_detail_id: number;
  quantity: number;
  product_name?: string;
}

export interface ReturnRequest {
  id: number;
  order_id: number;
  reason: string;
  status: ReturnStatus;
  created_at: string;
  items: ReturnItem[];
}

export interface CreateReturnPayload {
  order_id: number;
  reason: string;
  items: { sale_detail_id: number; quantity: number }[];
}

// ─── Reviews / Q&A ──────────────────────────────────────────────────────────

export interface Review {
  id: number;
  customer_name: string;
  rating: number;
  review: string;
  created_at: string;
}

export interface Question {
  id: number;
  customer_name: string;
  question: string;
  answer?: string;
  created_at: string;
}

export interface Comment {
  id: number;
  customer_name: string;
  comment: string;
  created_at: string;
}

// ─── Checkout Support ────────────────────────────────────────────────────────

export interface DeliveryCharge {
  id: number;
  name: string | { en?: string; bn?: string; [lang: string]: string | undefined };
  cost: number;
  estimated_days?: number;
}

export interface PaymentMethod {
  id: number;
  name: string | { en?: string; bn?: string; [lang: string]: string | undefined };
  icon?: string;
}

// ─── Blog ────────────────────────────────────────────────────────────────────

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featured_image: string;
  published_at: string;
  author?: string;
  category: { name: string; slug: string };
  tags: string[];
  meta_title?: string;
  meta_description?: string;
}

export interface BlogListParams {
  category?: string;
  tag?: string;
  per_page?: number;
  page?: number;
}

// ─── Content ─────────────────────────────────────────────────────────────────

export interface Faq {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

export interface Outlet {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  map_link?: string;
}

export interface PageSummary {
  id: number;
  title: string;
  slug: string;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
}

// ─── Support ─────────────────────────────────────────────────────────────────

export interface SupportTicketType {
  id: number;
  name: string;
}

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface CreateTicketPayload {
  type_id?: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  subject: string;
  message: string;
  priority?: TicketPriority;
}

// ─── Appointments ────────────────────────────────────────────────────────────

export interface AppointmentInfo {
  title: string;
  description: string;
  working_days: string[];
  start_time: string;
  end_time: string;
  off_days: string[];
}

export interface CreateAppointmentPayload {
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  service?: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiErrorShape {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
