import { expect, test } from "@playwright/test";

import { apiToken, createProductViaApi, DEMO, expectNoViolations, label, signIn, signUp, text, uniqueEmail } from "./helpers";

const stamp = Date.now().toString(36);

test.describe("who can open the system area", () => {
  test("ordinary admins are sent back to the admin home", async ({ page }) => {
    await signIn(page, DEMO.admin);
    await page.goto("/admin/system");

    await expect(page).toHaveURL(/\/admin$/);
  });

  test("customers cannot open it either", async ({ page }) => {
    await signIn(page, DEMO.customer);
    await page.goto("/admin/system/audit");

    await expect(page).not.toHaveURL(/\/admin/);
  });

  test("signed-out visitors are asked to sign in", async ({ page }) => {
    await page.goto("/admin/system");

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("as the super admin", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO.superAdmin);
    await page.goto("/admin/system");
  });

  test("the overview shows the last 24 hours and links to each log", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Last 24 hours" })).toBeVisible();
    for (const card of ["Changes by staff", "Sign-ins", "Failed sign-ins", "Orders placed", "App errors"]) {
      await expect(text(page, card, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Who has access" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Latest changes by staff" })).toBeVisible();

    await page.getByRole("navigation", { name: "System" }).getByRole("link", { name: /audit/i }).click();
    await expect(page).toHaveURL(/\/admin\/system\/audit/);
  });

  test("the audit trail shows who changed a product, and the details of the change", async ({ page, request }) => {
    const name = `E2E Audit ${stamp}`;
    await createProductViaApi(request, await apiToken(request, DEMO.admin), { name, priceKobo: 123_400 });

    await page.goto("/admin/system/audit");
    await page.getByPlaceholder("Record, person, email…").fill(name);

    const row = page.getByRole("row", { name: new RegExp(name) });
    await expect(row).toContainText("NaijaFresh Admin");
    await expect(row).toContainText("created");
    await expect(row).toContainText("Product");

    await row.getByRole("button", { name: "Details" }).click();
    await expect(row.getByRole("button", { name: "Hide" })).toHaveAttribute("aria-expanded", "true");
    await expect(text(page, /From .* IP|From \d/).first()).toBeVisible();
  });

  test("a failed sign-in is recorded in the activity log", async ({ page, browser }) => {
    const email = uniqueEmail("wrongpass");

    // Someone signs up, then fails to sign in with a wrong password.
    const visitor = await browser.newContext();
    const visitorPage = await visitor.newPage();
    await signUp(visitorPage, { name: "Wrong Pass", email, password: "secret-pass-1" });
    await visitorPage.context().clearCookies();
    await visitorPage.goto("/login");
    await label(visitorPage, /^Email/).fill(email);
    await label(visitorPage, /^Password/).fill("not-the-password");
    await visitorPage.getByRole("button", { name: /^sign in$/i }).click();
    await expect(visitorPage.getByText(/credentials|incorrect|invalid/i).first()).toBeVisible();
    await visitor.close();

    await page.goto("/admin/system/activity");
    await page.getByPlaceholder("Name, email, IP, order…").fill(email);

    await expect(page.getByRole("row").filter({ hasText: "Failed sign-in" }).first()).toContainText(email);
    await expect(page.getByRole("row").filter({ hasText: "Registered" }).first()).toBeVisible();
  });

  test("promoting and demoting an account changes what it can open, and the audit trail never shows passwords", async ({ page, browser }) => {
    const email = uniqueEmail("promote");
    const name = `Promote ${stamp}`;

    const member = await browser.newContext();
    const memberPage = await member.newPage();
    await signUp(memberPage, { name, email, password: "secret-pass-1" });
    await memberPage.goto("/admin");
    await expect(memberPage).not.toHaveURL(/\/admin/); // a customer is turned away

    // Promote to admin.
    await page.goto("/admin/system/users");
    await page.getByPlaceholder("Name or email…").fill(email);
    page.once("dialog", (dialog) => dialog.accept()); // "Make … an admin?"
    await page.getByLabel(`Role for ${name}`).selectOption({ label: "Admin" });
    await expect(text(page, new RegExp(`${name} is now an? admin`, "i"))).toBeVisible();

    await memberPage.goto("/admin");
    await expect(memberPage).toHaveURL(/\/admin/);
    await memberPage.goto("/admin/system");
    await expect(memberPage).toHaveURL(/\/admin$/); // admins still cannot enter the system area

    // Demote again.
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByLabel(`Role for ${name}`).selectOption({ label: "Customer" });
    await expect(text(page, new RegExp(`${name} is now an? customer`, "i"))).toBeVisible();
    await memberPage.goto("/admin");
    await expect(memberPage).not.toHaveURL(/\/admin/);
    await member.close();

    // The role changes are in the audit trail, with no password or hash anywhere.
    await page.goto("/admin/system/audit");
    await page.getByPlaceholder("Record, person, email…").fill(name);
    const rows = page.getByRole("row").filter({ hasText: name });
    await expect(rows.first()).toBeVisible();
    // Only one row can be open at a time, so look at each in turn.
    let body = "";
    for (let i = 0; i < (await rows.count()); i++) {
      await rows.nth(i).getByRole("button", { name: "Details" }).click();
      await expect(rows.nth(i).getByRole("button", { name: "Hide" })).toBeVisible();
      body += (await page.locator("main").innerText()).toLowerCase();
    }
    expect(body).toContain("role"); // the field that changed is shown
    expect(body).not.toContain("password");
    expect(body).not.toContain("$2y$");
  });

  test("you cannot change your own role", async ({ page }) => {
    await page.goto("/admin/system/users");
    await page.getByPlaceholder("Name or email…").fill(DEMO.superAdmin.email);

    await expect(page.getByLabel("Role for NaijaFresh Owner")).toBeDisabled();
  });

  test("the application log page loads", async ({ page }) => {
    await page.goto("/admin/system/logs");

    await expect(text(page, /Errors, warnings and notices from the Laravel log/)).toBeVisible();
    await expect(page.getByLabel("File")).toBeVisible();
    await expect(page.getByRole("group", { name: "Filter by level" })).toBeVisible();
    await expect(text(page, /something went wrong|could not/i)).toHaveCount(0);
  });
});

test.describe("system pages are accessible", () => {
  for (const [name, path] of [
    ["overview", "/admin/system"],
    ["audit trail", "/admin/system/audit"],
    ["activity log", "/admin/system/activity"],
    ["application log", "/admin/system/logs"],
    ["users", "/admin/system/users"],
  ] as const) {
    test(`${name} has no detectable accessibility problems`, async ({ page }) => {
      await signIn(page, DEMO.superAdmin);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expectNoViolations(page);
    });
  }
});
