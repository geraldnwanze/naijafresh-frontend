import AxeBuilder from "@axe-core/playwright";
import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";

/**
 * Text and label lookups that ignore hidden copies. A production page streams
 * in with hidden placeholders for a moment, and `getByText` also matches
 * hidden elements, which trips Playwright's one-match rule.
 */
export const text = (page: Page, value: string | RegExp, options?: { exact?: boolean }): Locator =>
  page.getByText(value, options).filter({ visible: true });

export const label = (page: Page, value: string | RegExp): Locator =>
  page.getByLabel(value).filter({ visible: true });

export const API_ORIGIN = `http://127.0.0.1:${process.env.E2E_API_PORT ?? "8010"}`;
const API = `${API_ORIGIN}/api/v1`;

/** Seeded by DemoAccountSeeder; every demo account uses the password "password". */
export const DEMO = {
  customer: { email: "customer@naijafresh.test", password: "password" },
  admin: { email: "admin@naijafresh.test", password: "password" },
  superAdmin: { email: "superadmin@naijafresh.test", password: "password" },
};

let counter = 0;

export function uniqueEmail(label: string): string {
  counter += 1;
  return `${label}-${Date.now()}-${counter}@e2e.test`;
}

export async function signIn(page: Page, account: { email: string; password: string }, next = "/") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await label(page, /^Email/).fill(account.email);
  await label(page, /^Password/).fill(account.password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  // Let the app's own redirect finish, or the next page.goto() collides with it (seen on WebKit).
  await page.waitForLoadState("networkidle");
}

export async function signUp(page: Page, details: { name: string; email: string; password: string }, next = "/") {
  await page.goto(`/signup?next=${encodeURIComponent(next)}`);
  await label(page, /^Full name/).fill(details.name);
  await label(page, /^Email/).fill(details.email);
  await label(page, /^Phone number/).fill("08031234567");
  await label(page, /^Password/).fill(details.password);
  await label(page, /^Confirm password/).fill(details.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/signup"));
  await page.waitForLoadState("networkidle");
}

/** Adds `product` from its page, bumping the quantity `extra` times first. */
export async function addFromProductPage(page: Page, slug: string, name: string, extra = 0) {
  await page.goto(`/products/${slug}`);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();

  for (let i = 0; i < extra; i++) {
    await page.getByRole("button", { name: /^Increase/ }).click();
  }

  await page.getByRole("button", { name: /^Add to cart/ }).click();
  await expect(page.getByRole("status").filter({ hasText: name })).toBeVisible();
}

export async function fillDeliveryDetails(page: Page) {
  await label(page, /^Phone number/).fill("08031234567");
  await label(page, /^Street address/).fill("12 Admiralty Way");
  await label(page, /^Area/).fill("Lekki Phase 1");
  await label(page, /^City/).fill("Lagos");
  await label(page, /^State/).fill("Lagos");
}

/** Places an order straight through the API (setup for tests that start after checkout). */
export async function placeOrderViaApi(
  request: APIRequestContext,
  account: { email: string; password: string },
  slug: string,
  quantity: number,
): Promise<{ id: number; reference: string }> {
  const login = await request.post(`${API}/auth/login`, { data: account });
  expect(login.ok()).toBeTruthy();
  const token = (await login.json()).token as string;
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

  const product = (await (await request.get(`${API}/products/${slug}`)).json()).data;
  const windows = (await (await request.get(`${API}/delivery-windows`)).json()).data;

  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const res = await request.post(`${API}/orders`, {
    headers,
    data: {
      items: [{ product_id: product.id, variant_id: null, quantity }],
      contact: { first_name: "Ada", last_name: "Customer", phone: "08031234567", email: account.email },
      delivery: { street: "12 Admiralty Way", area: "Lekki Phase 1", city: "Lagos", state: "Lagos", country: "Nigeria", notes: null },
      delivery_window_id: windows[0].id,
      delivery_date: tomorrow,
      payment_method: "cash_on_delivery",
    },
  });
  expect(res.ok(), await res.text()).toBeTruthy();

  const order = (await res.json()).data;
  return { id: order.id, reference: order.reference };
}

/**
 * Automated WCAG 2.1 A/AA checks with axe-core. These catch what a machine can
 * (missing names, labels, contrast, landmarks, duplicate ids); they do not
 * replace trying the site with a keyboard and a screen reader.
 */
export async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const summary = violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    count: violation.nodes.length,
    examples: violation.nodes.slice(0, 3).map((node) => node.target.join(" ")),
  }));

  expect(summary, `Accessibility problems on ${page.url()}`).toEqual([]);
}


/** Signs in through the API and returns the bearer token (for setting data up quickly). */
export async function apiToken(request: APIRequestContext, account: { email: string; password: string }): Promise<string> {
  const res = await request.post(`${API}/auth/login`, { data: account });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()).token as string;
}

/** Creates a simple per-item product as an admin, straight through the API. */
export async function createProductViaApi(
  request: APIRequestContext,
  adminToken: string,
  details: { name: string; priceKobo?: number; stock?: number },
): Promise<{ id: number; slug: string }> {
  const headers = { Authorization: `Bearer ${adminToken}`, Accept: "application/json" };
  const categories = (await (await request.get(`${API}/admin/categories`, { headers })).json()).data;

  const res = await request.post(`${API}/admin/products`, {
    headers: { ...headers, "Content-Type": "application/json" },
    data: JSON.stringify({
      category_id: categories[0].id,
      type: "ingredient",
      name: details.name,
      description: "Created by the end-to-end tests.",
      price_kobo: details.priceKobo ?? 100_000,
      sold_by: "unit",
      storage_type: "ambient",
      unit: "pack",
      stock_quantity: details.stock ?? 10,
      is_available: true,
    }),
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const product = (await res.json()).data;

  return { id: product.id, slug: product.slug };
}

export async function setStockViaApi(request: APIRequestContext, adminToken: string, productId: number, stock: number) {
  // The inventory endpoint is the lightweight one the stock screen uses.
  const res = await request.put(`${API}/admin/inventory/${productId}`, {
    headers: { Authorization: `Bearer ${adminToken}`, Accept: "application/json", "Content-Type": "application/json" },
    data: JSON.stringify({ stock_quantity: stock, is_available: true }),
  });
  expect(res.ok(), await res.text()).toBeTruthy();
}
