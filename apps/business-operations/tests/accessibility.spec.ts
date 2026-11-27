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

test("light and dark theme core text and status colors meet WCAG AA contrast", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const measure = async () => page.evaluate(() => {
    const root = document.querySelector(".app-shell");
    if (!root) throw new Error("App shell not found");
    const parse = (value: string) => {
      if (value.startsWith("#")) {
        const hex = value.slice(1);
        const normalized = hex.length === 3 ? hex.split("").map(part => part + part).join("") : hex;
        if (!/^[0-9a-fA-F]{6}$/.test(normalized)) throw new Error("Unsupported color: " + value);
        return [0, 2, 4].map(index => Number.parseInt(normalized.slice(index, index + 2), 16));
      }
      const match = value.match(/[\\d.]+/g);
      if (!match || match.length < 3) throw new Error("Unsupported color: " + value);
      return match.slice(0, 3).map(Number);
    };
    const luminance = (color: string) => {
      const channels = parse(color).map(channel => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const ratio = (foreground: string, background: string) => {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    const style = getComputedStyle(root);
    const background = style.getPropertyValue("--bg").trim();
    const muted = style.getPropertyValue("--muted").trim();
    const accent = style.getPropertyValue("--accent").trim();
    const accentSoft = style.getPropertyValue("--accent-soft").trim();
    const checks = [
      { name: "muted text on app background", value: ratio(muted, background) },
      { name: "accent text on accent-soft surface", value: ratio(accent, accentSoft) },
    ];
    const button = document.querySelector(".button-primary");
    if (button) {
      const buttonStyle = getComputedStyle(button);
      checks.push({ name: "primary button text", value: ratio(buttonStyle.color, buttonStyle.backgroundColor) });
    }
    document.querySelectorAll(".status-pill").forEach((element, index) => {
      const statusStyle = getComputedStyle(element);
      checks.push({ name: "status pill " + index, value: ratio(statusStyle.color, statusStyle.backgroundColor) });
    });
    return checks;
  });
  for (const theme of ["light", "dark"] as const) {
    if (theme === "dark") await page.getByRole("button", { name: "◐ Dark" }).click();
    const checks = await measure();
    for (const check of checks) {
      expect(check.value, theme + " theme: " + check.name + " contrast " + check.value.toFixed(2)).toBeGreaterThanOrEqual(4.5);
    }
    if (theme === "dark") await page.getByRole("button", { name: "☼ Light" }).click();
  }
});
