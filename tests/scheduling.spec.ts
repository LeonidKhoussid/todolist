import { expect, test } from "@playwright/test";

test.use({ timezoneId: "Europe/Moscow" });

test("a date and a time can be saved separately, combined, and cleared", async ({ page }) => {
  await page.goto("/");
  const taskInput = page.getByRole("textbox", { name: "Новая задача" });
  await taskInput.fill("Позвонить");
  await taskInput.press("Enter");

  const scheduleButton = page.getByRole("button", { name: "Дата, время и таймер: Позвонить" });
  const dateInput = page.getByRole("tabpanel", { name: "Дата", exact: true }).getByLabel("Дата", { exact: true });
  const timeInput = page.getByRole("tabpanel", { name: "Время", exact: true }).getByLabel("Время", { exact: true });
  await expect(scheduleButton).toBeVisible({ timeout: 3000 });
  await expect(page.getByText("Задачи сохраняются в этом браузере", { exact: false })).toHaveCount(0);

  await scheduleButton.click();
  await dateInput.fill("2026-11-19");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  const date = page.locator('time[datetime="2026-11-19"]');
  const time = page.locator('time[datetime="14:30"]');
  await expect(date).toBeVisible();
  await expect(time).toHaveCount(0);

  await scheduleButton.click();
  await page.getByRole("tab", { name: "Время", exact: true }).click();
  await timeInput.fill("14:30");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await page.reload();
  await expect(date).toBeVisible();
  await expect(time).toHaveText("14:30");

  await scheduleButton.click();
  await dateInput.fill("");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(date).toHaveCount(0);
  await expect(time).toBeVisible();

  await scheduleButton.click();
  await page.getByRole("tab", { name: "Время", exact: true }).click();
  await timeInput.fill("");
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
  await page.getByRole("tab", { name: "Таймер", exact: true }).click();
  await page.getByLabel("Секунды", { exact: true }).fill("30");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();

  const timer = page.getByRole("timer");
  await expect(timer).toHaveText("00:30");
  await page.getByRole("button", { name: "Запустить таймер", exact: true }).click();
  await page.reload();
  await page.clock.fastForward(3000);
  await expect(timer).not.toHaveText("00:30");

  await scheduleButton.click();
  await page.getByRole("tab", { name: "Дата", exact: true }).click();
  await page.getByRole("tabpanel", { name: "Дата", exact: true }).getByLabel("Дата", { exact: true }).fill("2026-11-19");
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
  await page.getByRole("tab", { name: "Таймер", exact: true }).click();
  await page.getByLabel("Секунды", { exact: true }).fill("");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(timer).toHaveCount(0);
  await expect(page.locator('time[datetime="2026-11-19"]')).toBeVisible();
});

test("schedule shortcuts preserve drafts across tabs and cancel discards changes", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-12T12:00:00+03:00"));
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Новая задача" });
  await input.fill("Согласовать план");
  await input.press("Enter");

  await page.getByRole("button", { name: "Дата, время и таймер: Согласовать план" }).click();
  const editor = page.getByRole("form", { name: "Дата, время и таймер" });
  const dateTab = editor.getByRole("tab", { name: "Дата", exact: true });
  await expect(dateTab).toHaveAttribute("aria-selected", "true", { timeout: 3000 });
  await editor.getByRole("button", { name: "Завтра", exact: true }).click();
  await dateTab.press("ArrowRight");
  await expect(editor.getByRole("tab", { name: "Время", exact: true })).toHaveAttribute("aria-selected", "true");
  await editor.getByRole("button", { name: "12:00", exact: true }).click();
  await editor.getByRole("tab", { name: "Таймер", exact: true }).click();
  await editor.getByRole("button", { name: "25 мин", exact: true }).click();
  await editor.getByRole("button", { name: "Сохранить", exact: true }).click();

  const date = page.locator('time[datetime="2026-11-13"]');
  const time = page.locator('time[datetime="12:00"]');
  await expect(date).toBeVisible();
  await expect(time).toBeVisible();
  await expect(page.getByRole("timer")).toHaveText("25:00");

  await page.getByRole("button", { name: /Изменить время/ }).click();
  await expect(editor.getByRole("tab", { name: "Время", exact: true })).toHaveAttribute("aria-selected", "true");
  await editor.getByRole("button", { name: "18:00", exact: true }).click();
  await editor.getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(time).toBeVisible();

  await page.getByRole("button", { name: /Изменить дату/ }).click();
  const timerTab = editor.getByRole("tab", { name: "Таймер", exact: true });
  await timerTab.click();
  await editor.getByLabel("Минуты", { exact: true }).fill("1440");
  await editor.getByLabel("Секунды", { exact: true }).fill("1");
  await dateTab.click();
  await editor.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(timerTab).toHaveAttribute("aria-selected", "true");
  await expect(editor.getByRole("alert")).toContainText("до 24 часов");
  await expect(page.getByRole("timer")).toHaveText("25:00");

  await editor.getByRole("button", { name: "Убрать таймер", exact: true }).click();
  await editor.getByRole("button", { name: "Сохранить", exact: true }).click();
  await page.reload();
  await expect(date).toBeVisible();
  await expect(time).toBeVisible();
  await expect(page.getByRole("timer")).toHaveCount(0);
});
