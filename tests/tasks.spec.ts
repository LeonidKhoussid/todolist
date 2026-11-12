import { expect, test } from "@playwright/test";

test("adding, completing, and deleting tasks persist after reload", async ({ page }) => {
  await page.goto("/");
  const taskInput = page.getByRole("textbox", { name: "Новая задача" });
  const task = page.getByRole("checkbox", { name: "Проверить список", exact: true });

  await expect(page.getByText("Список пока пуст")).toBeVisible({ timeout: 3000 });
  await taskInput.fill("  Проверить список  ");
  await taskInput.press("Enter");
  await expect(task).toBeVisible();
  await expect(task).not.toBeChecked();
  await page.reload();
  await expect(task).toBeVisible();
  await expect(task).not.toBeChecked();

  await task.check();
  await page.reload();
  await expect(task).toBeChecked();
  await task.uncheck();
  await page.reload();
  await expect(task).not.toBeChecked();

  await page.getByRole("button", { name: "Удалить задачу: Проверить список" }).click();
  await page.reload();
  await expect(page.getByText("Список пока пуст")).toBeVisible();
  await expect(task).toHaveCount(0);
});

test("blank titles are rejected and duplicate titles remain independent", async ({ page }) => {
  await page.goto("/");
  const taskInput = page.getByRole("textbox", { name: "Новая задача" });
  const addButton = page.getByRole("button", { name: "Добавить" });
  const tasks = page.getByRole("checkbox", { name: "Читать", exact: true });

  await taskInput.fill("   ");
  await expect(addButton).toBeDisabled();
  await taskInput.press("Enter");
  await expect(page.getByRole("checkbox")).toHaveCount(0);

  for (const title of ["Читать", "Читать"]) {
    await taskInput.fill(title);
    await addButton.click();
  }

  await expect(tasks).toHaveCount(2);
  await tasks.first().check();
  await expect(tasks.last()).not.toBeChecked();
});
