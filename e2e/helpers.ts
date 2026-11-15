import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const API_ORIGIN = `http://127.0.0.1:${process.env.E2E_API_PORT ?? "8010"}`;
const API = `${API_ORIGIN}/api/v1`;

/** Seeded by DemoAccountSeeder; every demo account uses the password "password". */
export const DEMO = {
  customer: { email: "customer@naijafresh.test", password: "password" },
  admin: { email: "admin@naijafresh.test", password: "password" },
};

let counter = 0;

export function uniqueEmail(label: string): string {
  counter += 1;
  return `${label}-${Date.now()}-${counter}@e2e.test`;
}

export async function signIn(page: Page, account: { email: string; password: string }, next = "/") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel(/^Email/).fill(account.email);
  await page.getByLabel(/^Password/).fill(account.password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

export async function signUp(page: Page, details: { name: string; email: string; password: string }, next = "/") {
  await page.goto(`/signup?next=${encodeURIComponent(next)}`);
  await page.getByLabel(/^Full name/).fill(details.name);
  await page.getByLabel(/^Email/).fill(details.email);
  await page.getByLabel(/^Phone number/).fill("08031234567");
  await page.getByLabel(/^Password/).fill(details.password);
  await page.getByLabel(/^Confirm password/).fill(details.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/signup"));
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
  await page.getByLabel(/^Phone number/).fill("08031234567");
  await page.getByLabel(/^Street address/).fill("12 Admiralty Way");
  await page.getByLabel(/^Area/).fill("Lekki Phase 1");
  await page.getByLabel(/^City/).fill("Lagos");
  await page.getByLabel(/^State/).fill("Lagos");
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
