import { expect, test } from "@playwright/test";

test("a date and a time can be saved separately, combined, and cleared", async ({ page }) => {
  await page.goto("/");
  const taskInput = page.getByRole("textbox", { name: "Новая задача" });
  await taskInput.fill("Позвонить");
  await taskInput.press("Enter");

  const scheduleButton = page.getByRole("button", { name: "Дата, время и таймер: Позвонить" });
  await expect(scheduleButton).toBeVisible({ timeout: 3000 });
  await expect(page.getByText("Задачи сохраняются в этом браузере", { exact: false })).toHaveCount(0);

  await scheduleButton.click();
  await page.getByLabel("Дата", { exact: true }).fill("2026-11-19");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  const date = page.locator('time[datetime="2026-11-19"]');
  const time = page.locator('time[datetime="14:30"]');
  await expect(date).toBeVisible();
  await expect(time).toHaveCount(0);

  await scheduleButton.click();
  await page.getByLabel("Время", { exact: true }).fill("14:30");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await page.reload();
  await expect(date).toBeVisible();
  await expect(time).toHaveText("14:30");

  await scheduleButton.click();
  await page.getByLabel("Дата", { exact: true }).fill("");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(date).toHaveCount(0);
  await expect(time).toBeVisible();

  await scheduleButton.click();
  await page.getByLabel("Время", { exact: true }).fill("");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Позвонить" })).toBeVisible();
  await expect(time).toHaveCount(0);
});

test("countdown survives refresh, can pause and resume, expires, and resets", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  const taskInput = page.getByRole("textbox", { name: "Новая задача" });
  await taskInput.fill("Подготовиться");
  await taskInput.press("Enter");
  const scheduleButton = page.getByRole("button", { name: "Дата, время и таймер: Подготовиться" });
  await scheduleButton.click();
  await page.getByLabel("Секунды", { exact: true }).fill("30");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();

  const timer = page.getByRole("timer");
  await expect(timer).toHaveText("00:30");
  await page.getByRole("button", { name: "Запустить таймер", exact: true }).click();
  await page.reload();
  await page.clock.fastForward(3000);
  await expect(timer).not.toHaveText("00:30");

  await scheduleButton.click();
  await page.getByLabel("Дата", { exact: true }).fill("2026-11-19");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(timer).not.toHaveText("00:30");
  await page.getByRole("button", { name: "Приостановить таймер", exact: true }).click();
  const remaining = await timer.innerText();
  await page.clock.fastForward(35000);
  await page.reload();
  await expect(timer).toHaveText(remaining);

  await page.getByRole("button", { name: "Продолжить таймер", exact: true }).click();
  await page.clock.fastForward(35000);
  await expect(timer).toHaveText("00:00");
  await expect(page.getByText("Время вышло")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Подготовиться" })).not.toBeChecked();
  await page.reload();
  await expect(timer).toHaveText("00:00");

  await page.getByRole("button", { name: "Сбросить таймер", exact: true }).click();
  await expect(timer).toHaveText("00:30");
  await scheduleButton.click();
  await page.getByLabel("Секунды", { exact: true }).fill("");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(timer).toHaveCount(0);
  await expect(page.locator('time[datetime="2026-11-19"]')).toBeVisible();
});
