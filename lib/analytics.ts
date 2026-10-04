// Simple analytics abstraction. Logs to the console in development; swap the
// body of `track` for a real sink (GA4, Plausible, Segment) later.

export type AnalyticsEvent =
  | "product_viewed"
  | "product_added_to_cart"
  | "checkout_started"
  | "order_placed"
  | "payment_completed";

export function track(event: AnalyticsEvent, properties: Record<string, unknown> = {}): void {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[analytics] ${event}`, properties);
  }
  // TODO: forward to a real analytics provider.
}
