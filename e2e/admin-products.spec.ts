import { expect, test, type Page } from "@playwright/test";

import { DEMO, expectNoViolations, label, signIn, text } from "./helpers";

// One shared database, so every product gets a name no other run or test can clash with.
const stamp = Date.now().toString(36);
const named = (what: string) => `E2E ${what} ${stamp}`;

async function openNewProductForm(page: Page) {
  await page.goto("/admin/products");
  await page.getByRole("button", { name: "+ New product" }).click();
  await expect(page.getByRole("heading", { name: "New product" })).toBeVisible();
}

async function fillBasics(page: Page, details: { name: string; description?: string; price: string; cost?: string; stock?: string }) {
  await label(page, /^Name/).fill(details.name);
  await label(page, /^Description/).fill(details.description ?? "Created by the end-to-end tests.");
  await label(page, /^Selling price/).fill(details.price);
  if (details.cost !== undefined) await label(page, /^Cost price/).fill(details.cost);
  await label(page, /^Stock/).fill(details.stock ?? "40");
}

async function save(page: Page, toastText: string) {
  await page.getByRole("button", { name: /^(Create product|Save changes)$/ }).click();
  await expect(text(page, toastText)).toBeVisible();
}

/** The admin list row for a product, found through the list's own search. */
async function adminRow(page: Page, name: string) {
  await page.goto("/admin/products");
  await page.getByPlaceholder("Search products…").fill(name);
  return page.getByRole("row", { name: new RegExp(name) });
}

/** Search results are never cached, so they always show the latest catalogue. */
async function shopSearch(page: Page, name: string) {
  await page.goto(`/products?search=${encodeURIComponent(name)}`);
  await expect(page.getByRole("heading", { level: 1, name: /Results for/ })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await signIn(page, DEMO.admin);
});

test.describe("creating products", () => {
  test("a per-item ingredient: previews the profit, then shows up for staff and shoppers", async ({ page }) => {
    const name = named("Okra");
    await openNewProductForm(page);
    await fillBasics(page, { name, price: "1500", cost: "1000", stock: "25" });
    await label(page, /^Unit/).fill("bowl");

    // Live profit preview while typing.
    await expect(text(page, "₦500 · 33.3% margin")).toBeVisible();
    await expect(text(page, "Selling below cost")).toHaveCount(0);

    await save(page, "Product created");

    // Staff see cost and margin in the list.
    const row = await adminRow(page, name);
    await expect(row).toContainText("₦1,500");
    await expect(row).toContainText("₦1,000");
    await expect(row).toContainText("33.3%");
    await expect(row).toContainText("Available");

    // Shoppers can find and buy it, and never see what it costs.
    await shopSearch(page, name);
    await page.getByRole("link", { name }).first().click();
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(text(page, "per bowl")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to cart · ₦1,500" })).toBeVisible();
    expect(await page.content()).not.toContain("cost_price_kobo");
  });

  test("warns when the price is below cost", async ({ page }) => {
    await openNewProductForm(page);
    await label(page, /^Selling price/).fill("1000");
    await label(page, /^Cost price/).fill("1500");

    await expect(text(page, "Selling below cost")).toBeVisible();
    await expect(text(page, "−₦500 · −50% margin")).toBeVisible();
  });

  test("a weight-sold product: price per kg, stock in kg, step and limits", async ({ page }) => {
    const name = named("Ginger");
    await openNewProductForm(page);
    await label(page, /^How is it sold/).selectOption("weight");

    await expect(label(page, /^Selling price per kg/)).toBeVisible();
    await expect(label(page, /^Unit/)).toHaveCount(0);

    await fillBasics(page, { name, price: "2400", cost: "1800", stock: "20" });
    await label(page, /^Sold in steps of/).selectOption("500");
    await label(page, /^Minimum order/).fill("1");
    await label(page, /^Maximum order/).fill("5");
    await save(page, "Product created");

    const row = await adminRow(page, name);
    await expect(row).toContainText("₦2,400");
    await expect(row).toContainText("/ kg");

    await shopSearch(page, name);
    await expect(text(page, "sold by weight · from 1 kg")).toBeVisible();
    await page.getByRole("link", { name }).first().click();
    await expect(page.getByRole("button", { name: "Add to cart · ₦2,400" })).toBeVisible();
    await expect(text(page, /Minimum 1 kg, in steps of 500 g, up to 5 kg/)).toBeVisible();
    await page.getByRole("button", { name: "Increase by 500 g" }).click();
    await expect(page.getByRole("button", { name: "Add to cart · ₦3,600" })).toBeVisible();
  });

  test("a food pack: locked to per-pack and room temperature, and needs at least two items", async ({ page }) => {
    const name = named("Pack");
    await openNewProductForm(page);
    await label(page, /^Type/).selectOption("food_pack");

    await expect(label(page, /^How is it sold/)).toBeDisabled();
    await expect(label(page, /^Storage/)).toBeDisabled();
    await expect(label(page, /^Storage/)).toHaveValue("ambient");

    await fillBasics(page, { name, price: "20000", cost: "15000" });
    await label(page, /^What's inside/).fill("Parboiled rice (5 kg)");
    await page.getByRole("button", { name: "Create product" }).click();

    // The API's rule shows up under the field and nothing is created.
    await expect(text(page, "List at least two items that come in the pack.").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "New product" })).toBeVisible();

    await label(page, /^What's inside/).fill("Parboiled rice (5 kg)\nSpaghetti (4 packs)\n\nGroundnut oil (1 L)");
    await save(page, "Product created");

    await shopSearch(page, name);
    await expect(text(page, "Food pack").first()).toBeVisible();
    await expect(text(page, "3 items inside")).toBeVisible();
    await page.getByRole("link", { name }).first().click();
    await expect(page.getByRole("heading", { name: "What's inside" })).toBeVisible();
    await expect(text(page, "✓ Spaghetti (4 packs)")).toBeVisible();
    await expect(text(page, "✓ Groundnut oil (1 L)")).toBeVisible();
  });

  test("a meal kit: details, included items and protein options that change the price", async ({ page }) => {
    const name = named("Kit");
    await openNewProductForm(page);
    await label(page, /^Type/).selectOption("meal_kit");

    await fillBasics(page, { name, price: "8000", cost: "5500" });
    await label(page, /^Unit/).fill("kit");
    await label(page, /^Serves/).fill("4–5 people");
    await label(page, /^Prep & cook time/).fill("45");
    await label(page, /^Included items/).fill("Egusi\nPalm oil\nCrayfish");
    await label(page, /^Not included/).fill("Meat or fish");
    await label(page, /^Cooking instructions/).fill("Boil, then simmer.");

    await page.getByRole("button", { name: "+ Add option" }).click();
    await page.getByRole("button", { name: "+ Add option" }).click();
    await page.getByPlaceholder("e.g. Beef").nth(0).fill("Beef");
    await page.getByPlaceholder("e.g. Beef").nth(1).fill("Chicken");
    await page.getByLabel("Extra selling price").nth(1).fill("2500");
    await page.getByRole("radio", { name: "default" }).nth(0).check();
    await save(page, "Product created");

    await shopSearch(page, name);
    await expect(text(page, "Meal kit").first()).toBeVisible();
    await page.getByRole("link", { name }).first().click();

    await expect(text(page, "4–5 people")).toBeVisible();
    await expect(text(page, "about 45 mins")).toBeVisible();
    await expect(text(page, "✓ Crayfish")).toBeVisible();
    await expect(text(page, "✗ Meat or fish")).toBeVisible();

    // Beef is the default (no extra charge); Chicken adds ₦2,500.
    await expect(page.getByRole("button", { name: "Add to cart · ₦8,000" })).toBeVisible();
    await page.getByRole("button", { name: /^Chicken/ }).click();
    await expect(page.getByRole("button", { name: "Add to cart · ₦10,500" })).toBeVisible();
  });

  test("cancelling leaves nothing behind", async ({ page }) => {
    const name = named("Cancelled");
    await openNewProductForm(page);
    await fillBasics(page, { name, price: "900" });
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("button", { name: "+ New product" })).toBeVisible();
    await page.getByPlaceholder("Search products…").fill(name);
    await expect(page.getByRole("row", { name: new RegExp(name) })).toHaveCount(0);
  });
});

test.describe("changing and removing products", () => {
  let name: string;

  test.beforeEach(async ({ page }) => {
    name = named(`Edit${Math.random().toString(36).slice(2, 6)}`);
    await openNewProductForm(page);
    await fillBasics(page, { name, price: "1000", cost: "600" });
    await save(page, "Product created");
  });

  test("editing changes what staff and shoppers see", async ({ page }) => {
    const row = await adminRow(page, name);
    await row.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { name: `Edit ${name}` })).toBeVisible();

    // The form opens with what was saved.
    await expect(label(page, /^Selling price/)).toHaveValue("1000");
    await expect(label(page, /^Cost price/)).toHaveValue("600");

    await label(page, /^Selling price/).fill("1800");
    await save(page, "Product updated");

    await expect(await adminRow(page, name)).toContainText("₦1,800");
    await shopSearch(page, name);
    await expect(text(page, "₦1,800")).toBeVisible();
  });

  test("marking a product unavailable keeps it for staff and stops shoppers buying it", async ({ page }) => {
    const row = await adminRow(page, name);
    await row.getByRole("button", { name: "Edit" }).click();
    await label(page, /^Available for sale/).uncheck();
    await save(page, "Product updated");

    await expect(await adminRow(page, name)).toContainText("Hidden");

    // Today an unavailable product stays listed in the shop, shown as out of stock.
    await shopSearch(page, name);
    await expect(page.getByRole("link", { name }).first()).toBeVisible();
    await expect(text(page, "Out of stock")).toBeVisible();
    await expect(page.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });

  test("deleting asks first, then removes the product everywhere", async ({ page }) => {
    const row = await adminRow(page, name);

    // Saying no keeps it.
    page.once("dialog", (dialog) => dialog.dismiss());
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(row).toBeVisible();

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain(name);
      return dialog.accept();
    });
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(text(page, "Product deleted")).toBeVisible();
    await expect(row).toHaveCount(0);

    await shopSearch(page, name);
    await expect(page.getByRole("link", { name })).toHaveCount(0);
  });
});

test.describe("the form is accessible", () => {
  for (const [kind, type] of [["ingredient", "ingredient"], ["weight-sold", "weight"], ["meal kit", "meal_kit"], ["food pack", "food_pack"]] as const) {
    test(`${kind} form has no detectable accessibility problems`, async ({ page }) => {
      await openNewProductForm(page);
      if (type === "weight") await label(page, /^How is it sold/).selectOption("weight");
      else await label(page, /^Type/).selectOption(type);
      if (type === "meal_kit") await page.getByRole("button", { name: "+ Add option" }).click();

      await expectNoViolations(page);
    });
  }
});
