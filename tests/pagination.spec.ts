import { expect, test } from "@playwright/test";

test("pages show five tasks and stay in range after adding or deleting", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Новая задача" });
  for (let taskNumber = 1; taskNumber <= 6; taskNumber++) {
    await input.fill(`Задача ${taskNumber}`);
    await input.press("Enter");
  }

  const pagination = page.getByRole("navigation", { name: "Страницы задач" });
  const next = pagination.getByRole("button", { name: "Следующая страница" });
  const previous = pagination.getByRole("button", { name: "Предыдущая страница" });
  await expect(next).toBeVisible({ timeout: 3000 });
  await expect(page.getByRole("listitem")).toHaveCount(5);
  await expect(previous).toBeDisabled();
  await next.click();
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("checkbox", { name: "Задача 1", exact: true })).toBeVisible();
  await expect(next).toBeDisabled();

  await input.fill("Задача 7");
  await input.press("Enter");
  await expect(pagination.getByRole("button", { name: "Страница 1", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("checkbox", { name: "Задача 7", exact: true })).toBeVisible();
  await pagination.getByRole("button", { name: "Страница 2", exact: true }).click();
  await page.getByRole("button", { name: "Удалить задачу: Задача 1", exact: true }).click();
  await page.getByRole("button", { name: "Удалить задачу: Задача 2", exact: true }).click();
  await expect(pagination).toHaveCount(0);
  await expect(page.getByRole("listitem")).toHaveCount(5);
});

test("pagination applies after filtering and adjusts when a task leaves the filter", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Новая задача" });
  for (let taskNumber = 1; taskNumber <= 7; taskNumber++) {
    await input.fill(`Пункт ${taskNumber}`);
    await input.press("Enter");
  }

  for (let taskNumber = 3; taskNumber <= 7; taskNumber++) {
    await page.getByRole("checkbox", { name: `Пункт ${taskNumber}`, exact: true }).check();
  }

  const pagination = page.getByRole("navigation", { name: "Страницы задач" });
  const next = pagination.getByRole("button", { name: "Следующая страница" });
  await next.click();
  await page.getByRole("checkbox", { name: "Пункт 2", exact: true }).check();
  await page.getByRole("radio", { name: /Готово/ }).click();
  await expect(pagination.getByRole("button", { name: "Страница 1", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("listitem")).toHaveCount(5);

  await next.click();
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await page.getByRole("checkbox", { name: "Пункт 2", exact: true }).click();
  await expect(pagination).toHaveCount(0);
  await expect(page.getByRole("listitem")).toHaveCount(5);
});
