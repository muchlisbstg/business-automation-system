import { expect, test } from "@playwright/test";

test("desktop workspace renders core dashboard and demo boundary", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Executive overview" })).toBeVisible();
  await expect(page.getByText("All figures and records shown are illustrative.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "View request register" })).toBeVisible();
});

test("mobile drawer is hidden when closed and exposes a named dialog when open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const sidebar = page.locator("aside.sidebar");
  await expect(sidebar).toBeHidden();
  await expect(sidebar.getByRole("button", { name: "Executive overview" })).toBeHidden();

  await page.getByRole("button", { name: "Open navigation" }).click();
  const dialog = page.getByRole("dialog", { name: "Mobile navigation" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close navigation" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
});

test("mobile drawer traps keyboard focus while open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const dialog = page.getByRole("dialog", { name: "Mobile navigation" });
  const close = dialog.getByRole("button", { name: "Close navigation" });
  const lastNavigationItem = dialog.getByRole("button", { name: "Sharia governance" });

  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(lastNavigationItem).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
});
