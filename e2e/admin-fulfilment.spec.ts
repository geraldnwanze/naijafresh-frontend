import { expect, test } from "@playwright/test";

import { DEMO, label, placeOrderViaApi, signIn, text } from "./helpers";

test("an admin finds a new order and moves it through confirmation", async ({ page, request }) => {
  const order = await placeOrderViaApi(request, DEMO.customer, "waterleaf", 2);

  await signIn(page, DEMO.admin);
  await expect(page).toHaveURL(/\/admin/);

  await page.goto("/admin/orders");
  await page.getByPlaceholder(/Search reference/).fill(order.reference);
  await page.getByRole("link", { name: order.reference }).click();

  await expect(page).toHaveURL(new RegExp(`/admin/orders/${order.id}$`));
  await expect(text(page, "Waterleaf")).toBeVisible();

  await label(page, "New status").selectOption("confirmed");
  await page.getByRole("button", { name: "Apply update" }).click();
  await expect(text(page, "Order marked confirmed")).toBeVisible();

  // The customer sees the new status on their side.
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await signIn(page, DEMO.customer, `/orders/${order.id}`);
  await expect(page).toHaveURL(new RegExp(`/orders/${order.id}`));
  await expect(text(page, "Confirmed").first()).toBeVisible();
});

test("a customer cannot open the admin area", async ({ page }) => {
  await signIn(page, DEMO.customer);
  await page.goto("/admin/orders");

  await expect(page).not.toHaveURL(/\/admin/);
});
