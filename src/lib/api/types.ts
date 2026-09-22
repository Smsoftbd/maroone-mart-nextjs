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

export interface StoreLanguage {
  code: string;
  name: string;
  native_name: string | null;
  is_default: boolean;
}

/** Storefront login/checkout method configured per store in Eleven POS. */
export type AuthMode = "guest_only" | "email_password" | "sms_otp";

export interface Store {
  languages: StoreLanguage[];
  default_lang: string;
  name: string;
  logo: string;
  footer_logo: string;
  favicon: string;
  tagline: string;
  offer_message: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  currency: string;
  currency_symbol: string;
  guest_checkout: boolean;
  auth_mode: AuthMode;
  checkout_otp: boolean;
  social: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
    whatsapp?: string;
    tiktok?: string;
    pinterest?: string;
  };
  colors: {
    primary: string;
    primary_text: string;
    secondary: string;
    secondary_text: string;
    tertiary: string;
    tertiary_text: string;
    default_text: string;
  };
  /** Full Appearance theme; null when the backend predates it. */
  theme: StoreTheme | null;
  /** Server-validated `:root{…}` block for `theme` (safe to inline). */
  theme_css: string | null;
  /** Google Fonts stylesheet for the heading + body fonts. */
  theme_fonts_url: string | null;
  features: {
    wishlist: boolean;
    reviews: boolean;
    loyalty: boolean;
    appointments: boolean;
    blog: boolean;
  };
  sections: {
    featured_products: boolean;
    flash_sale: boolean;
    categories: boolean;
    new_arrivals: boolean;
    top_selling: boolean;
    reviews: boolean;
    newsletter: boolean;
    banner: boolean;
  };
  seo: {
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | string[] | null;
  };
  scripts: {
    header: string | null;
    footer: string | null;
  };
  tracking: {
    fb_pixel_id: string | null;
    fb_domain_verification_id: string | null;
  };
}

// ─── Appearance theme ───────────────────────────────────────────────────────
// Only the groups the app reads in TS are typed; every token is available as a
// CSS variable (see src/lib/utils/theme.ts).

export type HeaderStyle = "classic" | "centered" | "minimal";
export type CardStyle = "bordered" | "elevated" | "flat";

export interface StoreThemeLayout {
  container_width: number;
  header_style: HeaderStyle;
  sticky_header: boolean;
  card_style: CardStyle;
  image_ratio: string;
  products_per_row: number;
  mobile_columns: number;
}

export interface StoreTheme {
  version?: number;
  layout: StoreThemeLayout;
  [group: string]: unknown;
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
  value_code?: string;
  value_id?: number;
}

export interface Barcode {
  id: number;
  key: string;
  sku: string;
  barcode?: string;
  price: number;
  discount: number;
  discount_amount: number;
  sale_price: number;
  effective_price: number;
  flash_sale?: { id: number; ends_at: string | null } | null;
  whole_sale_price?: number;
  stock: number;
  in_stock: boolean;
  is_active: boolean;
  attributes: Attribute[];
}

export interface ProductMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical_url?: string | null;
}

export interface ProductCategoryRef {
  id: number;
  name: string;
  slug: string;
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
  video_id?: string | null;
  video_provider?: "youtube" | "vimeo" | "facebook" | "twitter" | null;
  type: "simple" | "complex" | "variable";
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  view_count: number;
  sale_count: number;
  /** Product-level total stock; present on the list endpoint. */
  stock_qty?: number;
  weight?: string;
  dimensions?: string;
  specifications: Specification[];
  tags: string[];
  tax_percentage?: number;
  tax_type?: "exclusive" | "inclusive";
  hsn_code?: string;
  manage_stock: boolean;
  /** Newer API key; older API used min_order_quantity. */
  min_order_qty?: number;
  max_order_qty?: number | null;
  min_order_quantity?: number;
  max_order_quantity?: number;
  is_returnable: boolean;
  is_refundable: boolean;
  unit?: ProductUnit;
  category: ProductCategoryRef;
  sub_category?: ProductCategoryRef | null;
  child_category?: ProductCategoryRef | null;
  brand?: { id: number; name: string; image?: string | null } | null;
  barcodes: Barcode[];
  meta?: ProductMeta;
  translations?: unknown[] | Record<string, { name: string; description: string }>;
}

export interface ProductListParams {
  search?: string;
  /** Single category slug (back-compat) or comma-joined via `categories`. */
  category?: string;
  categories?: string[];
  brand?: string;
  /** Multi-select brand ids. */
  brands?: (number | string)[];
  attribute_values?: (number | string)[];
  price_min?: number;
  price_max?: number;
  sort?: string;
  featured?: 1;
  lang?: string;
  per_page?: number;
  page?: number;
}

export interface FilterAttributeValue {
  id: number;
  value: string;
  code?: string | null;
}

export interface FilterAttribute {
  id: number;
  name: string;
  code?: string | null;
  values: FilterAttributeValue[];
}

export interface ProductFiltersData {
  attributes: FilterAttribute[];
  price_range: { min: number; max: number };
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

export interface CartItem {
  id: number;
  barcode_id: number;
  product_name: string;
  product_slug: string;
  product_image: string;
  quantity: number;
  unit_price: number;
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
  | "on_hold"
  | "confirmed"
  | "processing"
  | "packaging"
  | "ready"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "returned"
  | "refunded";

export type PaymentStatus = "due" | "partial" | "paid";

export interface ShippingAddress {
  address: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface OrderDetailProduct {
  id: number;
  name: string;
  slug: string;
  sku?: string | null;
  image: string;
}

export interface OrderDetailBarcodeValue {
  id: number;
  value: string;
  code: string;
  attribute: {
    id: number;
    name: string;
    code: string;
    input_type: string;
  };
}

export interface OrderDetailBarcode {
  id: number;
  sku: string;
  barcode: string;
  selling_price: number;
  discount: number;
  discount_amount: number;
  after_discount: number;
  stock: number;
  is_active: boolean;
  values?: OrderDetailBarcodeValue[];
}

export interface StatusHistoryItem {
  id: number;
  from_status: string;
  from_label: string;
  to_status: string;
  to_label: string;
  note: string | null;
  changed_at: string;
}

export interface OrderDetail {
  id: number;
  sale_id: number;
  product_id: number;
  product_barcode_id?: number;
  batch_number?: string | null;
  qty: number;
  used_qty?: number;
  available_qty?: number;
  price: number;
  discount_percent: number;
  discount_amount: number;
  after_discount?: number;
  sub_total: number;
  net_total: number;
  note: string | null;
  product: OrderDetailProduct;
  barcode?: OrderDetailBarcode;
}

export interface OrderPaymentDetail {
  id: number;
  amount: number;
  payment_id: number;
  created_at: string;
}

export interface OrderCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface Order {
  id: number;
  invoice_number: string;
  invoice_suffix: string;
  date: string;
  tax_type: string;
  sub_total: number;
  discount_percent: number;
  discount_amount: number;
  tax_total: number;
  customer_delivery_charge: number;
  shipping_address: ShippingAddress;
  adjustment: number;
  net_total: number;
  paid_amount: number;
  coupon_code: string | null;
  return_amount: number;
  due_amount: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  status_label: string;
  sale_type: string;
  note: string | null;
  delivery_status: string | null;
  tracking_number: string | null;
  customer?: OrderCustomer;
  details: OrderDetail[];
  paymentDetails?: OrderPaymentDetail[];
  created_at: string;
  updated_at: string;
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

export interface CreateOrderItemPayload {
  barcode_id: number;
  qty: number;
  price: number;
  discount_percent: number;
  invoice_discount_percent: number;
  tax_percent: number;
  sub_total: number;
  net_total: number;
}

export interface CreateOrderSummary {
  sub_total: number;
  discount_amount: number;
  customer_delivery_charge: number;
  tax_total: number;
  net_total: number;
}

export interface CreateOrderPayload {
  customer: {
    name: string;
    email?: string;
    phone: string;
  };
  items: CreateOrderItemPayload[];
  summary: CreateOrderSummary;
  shipping_address: ShippingAddress;
  coupon_code?: string;
  note?: string;
}

export interface CreateOrderResponse {
  message: string;
  order: {
    id: number;
    invoice_number: string;
    invoice_url: string | null;
    net_total: number;
    payment_status: PaymentStatus;
    status: OrderStatus;
    status_label: string;
    created_at: string;
    points_earned: number | null;
  };
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

export interface ConfirmPaymentResponse {
  success: boolean;
  message: string;
  order_id: number;
  payment_status: string;
  paid_amount: number;
  due_amount: number;
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
  zone_name: { en?: string; bn?: string; [lang: string]: string | undefined };
  description?: { en?: string; bn?: string; [lang: string]: string | undefined };
  charge_type: string;
  charge_amount: string;
  min_order_amount: string | null;
  free_delivery_above: string | null;
}

export interface PaymentMethod {
  id: number;
  name: string | { en?: string; bn?: string; [lang: string]: string | undefined };
  icon?: string;
  code?: string;
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
