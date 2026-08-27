import { expect, test } from "@playwright/test";

test("user can create and complete a study task", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Study OS" })).toBeVisible();
  await page.getByRole("button", { name: "Add task" }).click();
  await page.getByLabel("Title").fill("E2E TypeScript task");
  await page.getByRole("button", { name: "Save task" }).click();
  const task = page.getByText("E2E TypeScript task");
  await expect(task).toBeVisible();
  const row = task.locator("xpath=ancestor::div[contains(@class, 'task-row')]");
  await row.getByRole("button", { name: "Toggle complete" }).click();
  await expect(row).toHaveClass(/done/);
});
