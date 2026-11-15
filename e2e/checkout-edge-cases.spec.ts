import { expect, test } from "@playwright/test";

import { addFromProductPage, apiToken, createProductViaApi, DEMO, fillDeliveryDetails, setStockViaApi, signIn, text } from "./helpers";

const stamp = Date.now().toString(36);

test("stock that runs out while you shop is explained at checkout, and your cart is kept", async ({ page, request }) => {
  const name = `E2E Scarce ${stamp}`;
  const adminToken = await apiToken(request, DEMO.admin);
  const product = await createProductViaApi(request, adminToken, { name, stock: 3 });

  await signIn(page, DEMO.customer);
  await addFromProductPage(page, product.slug, name, 2); // three in the cart

  // Meanwhile the shop sells down to one.
  await setStockViaApi(request, adminToken, product.id, 1);

  await page.goto("/checkout");
  await fillDeliveryDetails(page);
  await page.getByLabel("Cash on delivery").check();
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(text(page, new RegExp(`Only 1 of .*${name}.* left in stock`)).first()).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);

  // Nothing was lost: the cart still has the items, and a smaller order goes through.
  await page.goto("/cart");
  await expect(page.getByRole("link", { name })).toBeVisible();
  await page.getByRole("button", { name: "Decrease quantity" }).click();
  await page.getByRole("button", { name: "Decrease quantity" }).click();
  await page.goto("/checkout");
  await fillDeliveryDetails(page);
  await page.getByLabel("Cash on delivery").check();
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page).toHaveURL(/\/orders\/\d+\?placed=1/);
});

test("a product that becomes unavailable cannot be ordered", async ({ page, request }) => {
  const name = `E2E Gone ${stamp}`;
  const adminToken = await apiToken(request, DEMO.admin);
  const product = await createProductViaApi(request, adminToken, { name, stock: 5 });

  await signIn(page, DEMO.customer);
  await addFromProductPage(page, product.slug, name);
  await setStockViaApi(request, adminToken, product.id, 0);

  await page.goto("/checkout");
  await fillDeliveryDetails(page);
  await page.getByLabel("Cash on delivery").check();
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(text(page, new RegExp(`${name}.*(out of stock|unavailable)`, "i")).first()).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
});

test("missing delivery details are refused before an order is made", async ({ page }) => {
  await signIn(page, DEMO.customer);
  await addFromProductPage(page, "waterleaf", "Waterleaf");
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

  await page.getByLabel("Cash on delivery").check();
  await page.getByRole("button", { name: "Place order" }).click();

  // The browser stops the form: the street field is required and nothing is sent.
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByLabel(/^Street address/)).toBeFocused();
});
