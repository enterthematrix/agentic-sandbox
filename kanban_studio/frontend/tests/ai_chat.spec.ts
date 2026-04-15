import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  
  // Log in
  await page.getByPlaceholder("Enter username...").fill("user");
  await page.getByPlaceholder("Enter password...").fill("password");
  await page.getByRole("button", { name: "Sign In" }).click();
  
  // Wait for board
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible({ timeout: 20000 });
});

test("opens the chat sidebar and sends a message to update the board", async ({ page }) => {
  // Click the chat button
  const chatButton = page.getByTestId("ai-chat-toggle");
  await expect(chatButton).toBeVisible({ timeout: 10000 });
  await chatButton.click();
  
  // Verify sidebar is visible
  await expect(page.getByRole("heading", { name: "AI Assistant" })).toBeVisible();
  
  // Type a message to add a card
  const input = page.getByPlaceholder("Type a message...");
  const uniqueTask = `Task ${Math.floor(Math.random() * 1000000)}`;
  await input.fill(`Add a card to the Backlog for '${uniqueTask}'`);
  await page.keyboard.press("Enter");
  
  // Wait for AI reply in the sidebar
  await expect(page.locator('aside').getByText(uniqueTask)).toBeVisible({ timeout: 60000 });
  
  // Verify card is on the board in the correct column
  const backlogColumn = page.getByTestId("column-col-backlog");
  await expect(backlogColumn.getByRole("heading", { name: uniqueTask })).toBeVisible({ timeout: 60000 });
});
