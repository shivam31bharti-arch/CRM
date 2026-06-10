// Critical user flow smoke tests for the CRM application.
import { test, expect } from "@playwright/test";

test("auth pages render", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create your workspace" })).toBeVisible();
});

test("protected dashboard redirects to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/login/);
});
