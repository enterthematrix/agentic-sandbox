import { test, expect } from '@playwright/test';

test.describe('Kanban Board E2E', () => {
  test('should load the board with dummy data', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page.locator('h1')).toContainText('Project Tasks');
    
    // Columns
    await expect(page.locator('h2', { hasText: 'Backlog' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'To Do' })).toBeVisible();
    
    // Cards
    await expect(page.locator('h3', { hasText: 'Research competitors' })).toBeVisible();
  });

  test('should add a new card', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    const addButtons = page.locator('button', { hasText: '+ Add a card' });
    await addButtons.first().click();
    
    await page.getByPlaceholder('Card Title').fill('E2E Test Card');
    await page.getByPlaceholder('Details (optional)').fill('E2E Details');
    await page.locator('button', { hasText: /^Add$/ }).click(); 
    
    await expect(page.locator('h3', { hasText: 'E2E Test Card' })).toBeVisible();
  });

  test('should delete a card', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    const cardTitleLocator = page.locator('h3', { hasText: 'Research competitors' });
    await expect(cardTitleLocator).toBeVisible();
    
    const deleteBtn = page.locator('button[aria-label="Delete Card"]').first();
    await deleteBtn.click();
    
    await expect(cardTitleLocator).not.toBeVisible();
  });

  test('should rename a column', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    const colTitle = page.locator('h2', { hasText: 'Backlog' });
    await colTitle.click();
    
    const input = page.locator('input').first();
    await input.fill('New Backlog Title');
    await input.press('Enter');
    
    await expect(page.locator('h2', { hasText: 'New Backlog Title' })).toBeVisible();
  });
});
