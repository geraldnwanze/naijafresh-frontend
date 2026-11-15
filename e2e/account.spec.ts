import { expect, test, type Page } from "@playwright/test";

import { DEMO, expectNoViolations, label, signIn, signUp, text, uniqueEmail } from "./helpers";

const PASSWORD = "secret-pass-1";

async function newCustomer(page: Page, name = "Tola Buyer") {
  const email = uniqueEmail("account");
  await signUp(page, { name, email, password: PASSWORD });
  await page.goto("/account");
  await expect(page.getByRole("heading", { level: 1, name: "My account" })).toBeVisible();

  return email;
}

test.describe("signing up and in", () => {
  test("a wrong password is refused with a message and stays on the sign-in page", async ({ page }) => {
    await page.goto("/login");
    await label(page, /^Email/).fill(DEMO.customer.email);
    await label(page, /^Password/).fill("definitely-wrong");
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await expect(page.getByText(/credentials|incorrect|invalid/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("signing up with an address that already has an account explains why", async ({ page }) => {
    await page.goto("/signup");
    await label(page, /^Full name/).fill("Someone Else");
    await label(page, /^Email/).fill(DEMO.customer.email);
    await label(page, /^Password/).fill(PASSWORD);
    await label(page, /^Confirm password/).fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(text(page, /already been taken|already in use|already exists/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("mismatched passwords are caught", async ({ page }) => {
    await page.goto("/signup");
    await label(page, /^Full name/).fill("Someone Else");
    await label(page, /^Email/).fill(uniqueEmail("mismatch"));
    await label(page, /^Password/).fill(PASSWORD);
    await label(page, /^Confirm password/).fill("something-different");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(text(page, /confirmation|does not match|do not match/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("signing out returns to a guest and protects the account page", async ({ page }) => {
    await newCustomer(page);
    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page).toHaveURL("/");
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?next=%2Faccount/);
  });
});

test.describe("the profile", () => {
  test("changing the name and phone sticks after a reload", async ({ page }) => {
    await newCustomer(page);

    await label(page, /^Full name/).fill("Tola Updated");
    await label(page, /^Phone/).first().fill("08099998888");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(text(page, "Profile updated")).toBeVisible();

    await page.reload();
    await expect(label(page, /^Full name/)).toHaveValue("Tola Updated");
    await expect(label(page, /^Phone/).first()).toHaveValue("08099998888");
  });

  test("an email that belongs to someone else is rejected", async ({ page }) => {
    await newCustomer(page);

    await label(page, /^Email/).fill(DEMO.customer.email);
    await page.getByRole("button", { name: "Save profile" }).click();

    await expect(text(page, /already been taken|already in use/i).first()).toBeVisible();
  });

  test("changing the password needs the current one, then the new one works and the old one does not", async ({ page }) => {
    const email = await newCustomer(page);
    const newPassword = "brand-new-pass-9";

    await page.getByText("Change password").click();

    // Wrong current password.
    await label(page, /^Current password/).fill("not-my-password");
    await label(page, /^New password/).fill(newPassword);
    await label(page, /^Confirm new password/).fill(newPassword);
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(text(page, /current password is incorrect|password is incorrect|incorrect/i).first()).toBeVisible();

    // Right current password.
    await label(page, /^Current password/).fill(PASSWORD);
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(text(page, "Profile updated")).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page).toHaveURL("/");
    await page.context().clearCookies();

    await page.goto("/login");
    await label(page, /^Email/).fill(email);
    await label(page, /^Password/).fill(PASSWORD);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/login/); // the old password no longer works

    await label(page, /^Password/).fill(newPassword);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe("saved addresses", () => {
  async function addAddress(page: Page, street: string, labelText = "Home") {
    await label(page, /^Label/).fill(labelText);
    await label(page, /^Phone/).last().fill("08031112222");
    await label(page, /^First name/).fill("Tola");
    await label(page, /^Last name/).fill("Buyer");
    await label(page, /^Street/).fill(street);
    await label(page, /^Area/).fill("Yaba");
    await label(page, /^City/).fill("Lagos");
    await page.getByRole("button", { name: "Add address" }).click();
    await expect(text(page, "Address saved")).toBeVisible();
  }

  test("add, edit and delete", async ({ page }) => {
    await newCustomer(page);
    await expect(text(page, "No saved addresses yet.")).toBeVisible();

    await addAddress(page, "5 Herbert Macaulay Way");
    const item = page.getByRole("listitem").filter({ hasText: "Home" });
    await expect(item).toContainText("5 Herbert Macaulay Way, Yaba, Lagos");

    await item.getByRole("button", { name: "Edit" }).click();
    await expect(text(page, "Edit address")).toBeVisible();
    await label(page, /^Street/).fill("9 Adeola Odeku Street");
    await page.getByRole("button", { name: "Update address" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "9 Adeola Odeku Street" })).toBeVisible();

    await page.getByRole("listitem").filter({ hasText: "Home" }).getByRole("button", { name: "Delete" }).click();
    await expect(text(page, "Address removed")).toBeVisible();
    await expect(text(page, "No saved addresses yet.")).toBeVisible();
  });

  test("addresses are private to the account", async ({ page, browser }) => {
    await newCustomer(page);
    await addAddress(page, "1 Private Close", "Secret");

    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await signIn(otherPage, DEMO.customer);
    await otherPage.goto("/account");
    await expect(text(otherPage, "1 Private Close")).toHaveCount(0);
    await other.close();
  });
});

test("the account page has no detectable accessibility problems", async ({ page }) => {
  await newCustomer(page);
  await page.getByText("Change password").click();
  await expectNoViolations(page);
});
