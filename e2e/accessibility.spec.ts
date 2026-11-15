import { expect, test } from "@playwright/test";

import { addFromProductPage, DEMO, expectNoViolations, signIn, text } from "./helpers";

test.describe("storefront pages", () => {
  for (const [name, path] of [
    ["home", "/"],
    ["shop", "/products"],
    ["search results", "/products?search=Waterleaf"],
    ["a product", "/products/waterleaf"],
    ["a weight-sold product", "/products/parboiled-rice"],
    ["a category", "/categories/vegetables"],
    ["hygiene promise", "/hygiene"],
    ["sign in", "/login"],
    ["sign up", "/signup"],
    ["page not found", "/no-such-page"],
  ] as const) {
    test(`${name} has no detectable accessibility problems`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expectNoViolations(page);
    });
  }
});

test.describe("shopping and checkout", () => {
  test("the cart, with items in it", async ({ page }) => {
    await addFromProductPage(page, "waterleaf", "Waterleaf", 1);
    await addFromProductPage(page, "parboiled-rice", "Parboiled Rice");
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible();
    await expectNoViolations(page);
  });

  test("the empty cart", async ({ page }) => {
    await page.goto("/cart");
    await expect(text(page, "Your cart is empty")).toBeVisible();
    await expectNoViolations(page);
  });

  test("checkout and the order page", async ({ page }) => {
    await signIn(page, DEMO.customer);
    await addFromProductPage(page, "waterleaf", "Waterleaf");
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await expectNoViolations(page);

    await page.goto("/orders");
    await expectNoViolations(page);
    await page.goto("/account");
    await expectNoViolations(page);
  });
});

test.describe("admin", () => {
  test("dashboard, orders and products", async ({ page }) => {
    await signIn(page, DEMO.admin);
    for (const path of ["/admin", "/admin/orders", "/admin/products", "/admin/inventory"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expectNoViolations(page);
    }
  });
});
