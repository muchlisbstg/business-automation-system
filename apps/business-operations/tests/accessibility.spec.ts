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


test("responsive layouts stay within viewport at tablet and mobile widths", async ({ page }) => {
  for (const width of [1024, 768, 430, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(dimensions.document, "document overflow at " + width + "px").toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.body, "body overflow at " + width + "px").toBeLessThanOrEqual(dimensions.viewport);
  }
});

test("theme toggle and empty search state remain available", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "View request register" }).click();
  await page.getByRole("textbox", { name: "Search records" }).fill("no-such-record-xyz");
  await expect(page.getByText("No matching records")).toBeVisible();
  await page.getByRole("button", { name: "◐ Dark" }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "☼ Light" }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-theme", "light");
});

test("reduced motion preference disables sidebar transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const duration = await page.locator("aside.sidebar").evaluate(element => getComputedStyle(element).transitionDuration);
  expect(duration.split(",").every(value => Number.parseFloat(value) === 0)).toBeTruthy();
});
