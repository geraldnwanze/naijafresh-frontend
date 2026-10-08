// Shapes returned by the NaijaFresh Laravel API (app/Http/Resources/*).

export type ProductType = "ingredient" | "meal_kit" | "food_pack";

/** How a product is sold. For "weight", price is per kg and quantities/stock are grams. */
export type SoldBy = "unit" | "weight";

export type StorageType = "ambient" | "chilled" | "frozen";

export interface WeightRules {
  min_grams: number;
  step_grams: number;
  max_grams: number | null;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "refunded";

export type PaymentMethodValue = "paystack" | "bank_transfer" | "cash_on_delivery";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  position: number;
  is_active: boolean;
  products_count?: number;
}

export interface ProductVariant {
  id: number;
  kind: string;
  name: string;
  price_delta_kobo: number;
  price_delta_display: string | null;
  /** Staff only. */
  cost_delta_kobo?: number;
  is_default: boolean;
}

export interface MealKitDetail {
  serves: string | null;
  prep_time_minutes: number | null;
  included_items: string[];
  not_included_items: string[];
  storage_instructions: string | null;
  cooking_instructions: string | null;
}

/** A fixed combo of non-perishable foodstuffs sold as one pack. */
export interface FoodPackDetail {
  /** "What's inside", one entry per item, e.g. "Parboiled rice (5 kg)". */
  contents: string[];
  item_count: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  type: ProductType;
  is_meal_kit: boolean;
  is_food_pack: boolean;
  description: string;
  price_kobo: number;
  price: string;
  compare_at_price_kobo: number | null;
  compare_at_price: string | null;
  /** Staff only: what it costs us, per item or per kg. Never sent to shoppers. */
  cost_price_kobo?: number | null;
  profit_per_unit_kobo?: number | null;
  margin_pct?: number | null;
  unit: string;
  sold_by: SoldBy;
  is_sold_by_weight: boolean;
  /** "per kg" or "per <unit>" */
  price_label: string;
  weight?: WeightRules;
  storage_type: StorageType;
  storage_label: string;
  is_frozen: boolean;
  image_url: string | null;
  tags: string[];
  is_featured: boolean;
  is_available: boolean;
  in_stock: boolean;
  /** Admin only. Grams for weight-sold products, otherwise a unit count. */
  stock_quantity?: number;
  stock_label?: string;
  preparation_type: string | null;
  preparation_label: string | null;
  category?: Category;
  meal_kit?: MealKitDetail;
  food_pack?: FoodPackDetail;
  variants?: ProductVariant[];
}

export interface Address {
  id: number;
  label: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  street: string;
  area: string;
  city: string;
  state: string | null;
  country: string;
  notes: string | null;
  is_default: boolean;
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_slug?: string | null;
  name: string;
  type: ProductType;
  sold_by: SoldBy;
  storage_type: StorageType;
  is_frozen: boolean;
  unit: string;
  variant_name: string | null;
  image_url: string | null;
  /** Price per unit, or per kg for weight-sold items. */
  unit_price_kobo: number;
  unit_price: string;
  /** Item count, or grams for weight-sold items. */
  quantity: number;
  /** "3" or "2.5 kg" */
  quantity_label: string;
  line_total_kobo: number;
  line_total: string;
  /** Staff only: cost snapshot at the time of sale (null if the product had no cost price). */
  unit_cost_kobo?: number | null;
  line_cost_kobo?: number | null;
  line_profit_kobo?: number | null;
}

export interface TimelineStep {
  key: string;
  label: string;
  state: "done" | "current" | "upcoming";
  at: string | null;
}

export interface OrderPayment {
  reference: string;
  provider: string;
  is_mock: boolean;
  method: PaymentMethodValue;
  method_label: string;
  status: PaymentStatus;
  status_label: string;
  amount_kobo: number;
  amount: string;
  currency: string;
  authorization_url: string | null;
  paid_at: string | null;
}

export interface OrderDelivery {
  status: string;
  status_label: string;
  window_label: string | null;
  window_time: string | null;
  scheduled_date: string | null;
  rider_name?: string | null;
  rider_phone?: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  notes?: string | null;
}

export interface Order {
  id: number;
  reference: string;
  status: OrderStatus;
  status_label: string;
  is_cancelled: boolean;
  cancellation_reason: string | null;
  contact: { first_name: string; last_name: string; phone: string; email: string };
  delivery_address: {
    street: string;
    area: string;
    city: string;
    state: string | null;
    country: string;
    notes: string | null;
  };
  delivery_window: { label: string | null; time: string | null; date: string | null };
  payment_method: PaymentMethodValue;
  payment_method_label: string;
  currency: string;
  subtotal_kobo: number;
  subtotal: string;
  delivery_fee_kobo: number;
  delivery_fee: string;
  discount_kobo: number;
  discount: string;
  total_kobo: number;
  total: string;
  items?: OrderItem[];
  has_frozen_items?: boolean;
  /** Staff only: profit on the products sold (delivery fee excluded). */
  cost_kobo?: number;
  profit_kobo?: number;
  has_uncosted_items?: boolean;
  payment?: OrderPayment;
  delivery?: OrderDelivery;
  timeline: TimelineStep[];
  placed_at: string | null;
  created_at: string | null;
  user?: { id: number; name: string; email: string; phone?: string };
}

export interface DeliveryWindow {
  id: number;
  label: string;
  starts_at: string;
  ends_at: string;
  display: string;
  is_active: boolean;
}

export interface StoreConfig {
  store_name: string;
  tagline: string;
  currency: string;
  store_open: boolean;
  default_country: string;
  delivery: {
    fee_kobo: number;
    fee: string;
    free_threshold_kobo: number;
    free_threshold: string | null;
  };
  payment: {
    provider: string;
    is_mock: boolean;
    paystack_public_key: string | null;
    methods: { value: PaymentMethodValue; label: string }[];
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "customer" | "admin" | "super_admin";
  is_admin: boolean;
  is_super_admin: boolean;
  /** Only on the super admin user list. */
  orders_count?: number;
  created_at: string | null;
}

export interface PricedCartLine {
  product_id: number;
  slug: string;
  name: string;
  unit: string;
  image_url: string | null;
  variant_id: number | null;
  variant_name: string | null;
  quantity: number;
  quantity_label: string;
  sold_by: SoldBy;
  storage_type: StorageType;
  unit_price_kobo: number;
  unit_price: string;
  line_total_kobo: number;
  line_total: string;
  in_stock: boolean;
  available_quantity: number;
}

export interface PricedCart {
  currency: string;
  item_count: number;
  lines: PricedCartLine[];
  subtotal_kobo: number;
  subtotal: string;
  delivery_fee_kobo: number;
  delivery_fee: string;
  discount_kobo: number;
  discount: string;
  total_kobo: number;
  total: string;
}

export interface Paginated<T> {
  data: T[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    [key: string]: unknown;
  };
}

export interface AdminStats {
  orders_total: number;
  orders_today: number;
  orders_pending: number;
  orders_awaiting_delivery: number;
  orders_delivered: number;
  revenue_kobo: number;
  revenue: string;
  revenue_today_kobo: number;
  revenue_today: string;
  products_total: number;
  products_out_of_stock: number;
  recent_orders: Order[];
}

// ---------------------------------------------------------------------------
// Accounting
// ---------------------------------------------------------------------------

export type ReportBasis = "delivered" | "placed";
export type ReportGroupBy = "day" | "week" | "month";

export interface ProfitLossSummary {
  orders: number;
  product_sales_kobo: number;
  delivery_fees_kobo: number;
  discounts_kobo: number;
  revenue_kobo: number;
  cogs_kobo: number;
  gross_profit_kobo: number;
  gross_margin_pct: number | null;
  expenses_kobo: number;
  net_profit_kobo: number;
  net_margin_pct: number | null;
  average_order_value_kobo: number;
}

export interface ProfitLossProductRow {
  product_id: number | null;
  name: string;
  category: string;
  sold_by: SoldBy;
  quantity: number;
  quantity_label: string;
  revenue_kobo: number;
  cost_kobo: number;
  profit_kobo: number;
  margin_pct: number | null;
  has_uncosted: boolean;
}

export interface ProfitLossCategoryRow {
  category: string;
  revenue_kobo: number;
  cost_kobo: number;
  profit_kobo: number;
  margin_pct: number | null;
}

export interface ProfitLossBucket {
  /** First local day of the bucket, Y-m-d. */
  period_start: string;
  orders: number;
  revenue_kobo: number;
  cogs_kobo: number;
  gross_profit_kobo: number;
  expenses_kobo: number;
  net_profit_kobo: number;
}

export interface ProfitLossReport {
  period: { from: string; to: string; basis: ReportBasis; group_by: ReportGroupBy; timezone: string };
  summary: ProfitLossSummary;
  cost_coverage: { uncosted_lines: number; uncosted_sales_kobo: number };
  expenses_by_category: { category: string; label: string; amount_kobo: number }[];
  by_product: ProfitLossProductRow[];
  by_category: ProfitLossCategoryRow[];
  series: ProfitLossBucket[];
}

export interface Expense {
  id: number;
  category: string;
  category_label: string;
  description: string;
  amount_kobo: number;
  amount: string;
  incurred_on: string;
  notes: string | null;
  created_at: string | null;
}

// ---------------------------------------------------------------------------
// Notifications (the bell)
// ---------------------------------------------------------------------------

export interface AppNotification {
  id: string;
  kind: "order_placed" | "order_status" | "payment_received" | "payment_failed" | "new_order" | "low_stock" | string;
  title: string;
  body: string;
  /** Storefront or admin route this notification opens, e.g. "/orders/12". */
  url: string | null;
  order_id: number | null;
  order_reference: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
}

// ---------------------------------------------------------------------------
// System area (super admin): audit trail, activity, application logs, users
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  id: number;
  event: "created" | "updated" | "deleted";
  /** "Product", "Order"… */
  model: string;
  model_id: number | null;
  label: string | null;
  actor: { id: number | null; name: string; email: string | null; is_system: boolean };
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
}

export interface ActivityLogEntry {
  id: number;
  event: string;
  event_label: string;
  description: string;
  user: { id: number | null; name: string | null; email: string | null };
  subject: { type: string; id: number | null } | null;
  properties: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
}

export type LogLevel = "debug" | "info" | "notice" | "warning" | "error" | "critical" | "alert" | "emergency";

export interface AppLogEntry {
  time: string | null;
  environment: string;
  level: LogLevel;
  message: string;
  /** Rest of the entry (JSON context, stack trace) when there is more than the message. */
  details: string | null;
}

export interface AppLogFile {
  name: string;
  size: number;
  modified_at: string;
}

export interface SystemOverview {
  stats: {
    audit_changes_24h: number;
    sign_ins_24h: number;
    failed_sign_ins_24h: number;
    orders_24h: number;
    errors_24h: number;
  };
  users_by_role: { role: string; label: string; count: number }[];
  failed_sign_in_ips: { ip_address: string; attempts: number }[];
  recent_audit: AuditLogEntry[];
  recent_activity: ActivityLogEntry[];
}
