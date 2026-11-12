import { expect, test } from "@playwright/test";

test("theme follows the system until toggled and saves the chosen mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  const root = page.locator("html");
  const toggle = page.getByRole("button", { name: "Тёмная тема" });
  await expect(toggle).toBeEnabled({ timeout: 3000 });
  await expect(root).toHaveClass(/\blight\b/);
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(root).toHaveClass(/\bdark\b/);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(root).toHaveClass(/\blight\b/);
  await page.reload();
  await expect(root).toHaveClass(/\blight\b/);
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await toggle.click();
  await page.reload();
  await expect(root).toHaveClass(/\bdark\b/);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
});
