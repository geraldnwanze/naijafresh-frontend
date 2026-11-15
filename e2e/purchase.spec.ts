import { expect, test } from "@playwright/test";

import { addFromProductPage, DEMO, fillDeliveryDetails, signIn, signUp, uniqueEmail } from "./helpers";

test.describe("buying as a new customer", () => {
  test("browse, build a cart, sign up at checkout and pay on delivery", async ({ page }, testInfo) => {
    // Browse: the shop lists real products, and search finds one.
    await page.goto("/products");
    await expect(page.getByRole("heading", { level: 1, name: "Shop" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to cart" }).first()).toBeVisible();

    await page.goto("/products?search=Waterleaf");
    await expect(page.getByRole("heading", { name: /Results for/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Waterleaf/ }).first()).toBeVisible();

    // Two of an item, plus a weight-sold product (1 kg minimum).
    await addFromProductPage(page, "waterleaf", "Waterleaf", 1);
    await addFromProductPage(page, "parboiled-rice", "Parboiled Rice");
    await expect(page.getByRole("link", { name: "Cart", exact: true })).toContainText("3");

    // Cart: lines and the server-priced subtotal (2 × ₦600 + 1 kg × ₦1,900).
    await page.getByRole("link", { name: "Cart", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Waterleaf" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Parboiled Rice" })).toBeVisible();
    await expect(page.getByRole("definition").filter({ hasText: /^₦3,100$/ }).first()).toBeVisible();

    // A guest is asked to sign in, and the cart survives the detour.
    await page.getByRole("link", { name: "Continue to checkout" }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fcheckout/);

    await signUp(page, { name: "Tola Buyer", email: uniqueEmail(testInfo.project.name), password: "secret-pass-1" }, "/checkout");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

    // The name and email are pre-filled from the account.
    await expect(page.getByLabel(/^First name/)).toHaveValue("Tola");
    await expect(page.getByLabel(/^Last name/)).toHaveValue("Buyer");
    await expect(page.getByText(/2 × Waterleaf/)).toBeVisible();
    await expect(page.getByText(/1 kg × Parboiled Rice/)).toBeVisible();

    await fillDeliveryDetails(page);
    await page.getByLabel("Cash on delivery").check();
    await page.getByRole("button", { name: "Place order" }).click();

    // Order page: confirmation, items, payment method.
    await expect(page).toHaveURL(/\/orders\/\d+\?placed=1/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/\S+/);
    await expect(page.getByText("Waterleaf")).toBeVisible();
    await expect(page.getByText("Parboiled Rice")).toBeVisible();
    await expect(page.getByText("Cash on delivery")).toBeVisible();
    await expect(page.getByText("12 Admiralty Way", { exact: false })).toBeVisible();

    // The cart was emptied.
    await page.goto("/cart");
    await expect(page.getByText("Your cart is empty")).toBeVisible();

    // The order shows up in the customer's order list.
    await page.goto("/orders");
    await expect(page.getByRole("link").filter({ hasText: /\S+/ }).filter({ hasText: /₦/ }).first()).toBeVisible();
  });

  test("the customer gets a bell notification for the order", async ({ page }) => {
    await signIn(page, DEMO.customer);
    await addFromProductPage(page, "waterleaf", "Waterleaf");
    await page.goto("/checkout");
    await fillDeliveryDetails(page);
    await page.getByLabel("Cash on delivery").check();
    await page.getByRole("button", { name: "Place order" }).click();
    await expect(page).toHaveURL(/\/orders\/\d+\?placed=1/);

    await page.getByRole("button", { name: /^Notifications/ }).first().click();
    await expect(page.getByRole("menu")).toContainText(/order/i);
  });
});

test.describe("paying by card (test-mode gateway)", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO.customer);
    await addFromProductPage(page, "parboiled-rice", "Parboiled Rice");
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await fillDeliveryDetails(page);
    await page.getByLabel("Pay with card (Paystack)").check();
    await expect(page.getByText(/test mode/i).first()).toBeVisible();
    await page.getByRole("button", { name: "Place order" }).click();
    await expect(page).toHaveURL(/\/checkout\/mock-pay\?reference=/);
  });

  test("an approved payment marks the order paid", async ({ page }) => {
    await expect(page.getByText("Amount due")).toBeVisible();
    await page.getByRole("button", { name: "Approve payment" }).click();

    await expect(page.getByText(/Payment successful/)).toBeVisible();
    await expect(page).toHaveURL(/\/orders\/\d+\?paid=1/);
    await expect(page.getByText("Paid", { exact: true })).toBeVisible();
  });

  test("a declined card leaves the order unpaid and can be retried", async ({ page }) => {
    await page.getByRole("button", { name: "Simulate a declined card" }).click();
    await expect(page.getByText(/Payment declined/)).toBeVisible();

    // Trying again from the same screen works.
    await page.getByRole("button", { name: "Approve payment" }).click();
    await expect(page).toHaveURL(/\/orders\/\d+\?paid=1/);
  });
});

test.describe("the cart", () => {
  test("quantities, weights and removal update the totals", async ({ page }) => {
    await addFromProductPage(page, "waterleaf", "Waterleaf");
    await addFromProductPage(page, "parboiled-rice", "Parboiled Rice");
    await page.goto("/cart");

    await expect(page.getByRole("definition").filter({ hasText: /^₦2,500$/ }).first()).toBeVisible();

    await page.getByRole("button", { name: "Increase quantity" }).click();
    await expect(page.getByRole("definition").filter({ hasText: /^₦3,100$/ }).first()).toBeVisible();

    await page.getByRole("button", { name: /^Increase by/ }).click(); // rice: 1 kg -> 1.5 kg
    await expect(page.getByText("1.5 kg")).toBeVisible();
    await expect(page.getByRole("definition").filter({ hasText: /^₦4,050$/ }).first()).toBeVisible();

    await page.getByRole("button", { name: "Remove" }).first().click();
    await page.getByRole("button", { name: "Remove" }).first().click();
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  });

  test("keeps the cart after a reload", async ({ page }) => {
    await addFromProductPage(page, "waterleaf", "Waterleaf", 2);
    await page.goto("/cart");
    await page.reload();

    await expect(page.getByRole("link", { name: "Waterleaf" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Cart", exact: true })).toContainText("3");
  });

  test("checkout without an account sends you to sign in", async ({ page }) => {
    await addFromProductPage(page, "waterleaf", "Waterleaf");
    await page.goto("/checkout");

    await expect(page).toHaveURL(/\/login\?next=%2Fcheckout/);
  });
});
