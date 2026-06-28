import { test, expect } from '@playwright/test';

test.describe('Document Collaboration & Offline Sync Tests', () => {
  test('should login, create a document, type, and verify local-first sync behavior', async ({ page, context }) => {
    // 1. Navigate to the login screen
    await page.goto('/login');

    // Populate login details with standard evaluation presets
    await page.fill('input[placeholder="Your name"]', 'Senior Evaluator');
    await page.fill('input[placeholder="email@example.com"]', 'owner@example.com');
    
    // Select the "owner" role sandbox button
    await page.click('button:has-text("owner")');

    // Submit credentials
    await page.click('button[type="submit"]');

    // Assert redirection to the dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h2:has-text("Welcome to your DocSync Hub")')).toBeVisible();

    // Wait for client-side hydration to complete
    await page.waitForTimeout(1000);

    // 2. Create a new document in the workspace
    await page.fill('input[placeholder="e.g. Project Plan"]', 'Sandbox Assessment Log');
    // Submit the form by pressing Enter
    await page.press('input[placeholder="e.g. Project Plan"]', 'Enter');

    // Assert that the workspace loaded the new document details
    await expect(page.locator('h2:has-text("Sandbox Assessment Log")')).toBeVisible();
    await expect(page.locator('span:has-text("Online")')).toBeVisible({ timeout: 15000 });

    // 3. Disconnect browser network to trigger local-first behavior
    await context.setOffline(true);

    // Assert connection indicator switches to Offline
    await expect(page.locator('span:has-text("Offline")')).toBeVisible({ timeout: 15000 });

    // Focus editor and input text while disconnected
    const editor = page.locator('.ProseMirror');
    await editor.focus();
    await page.keyboard.type('Drafting distributed-sync notes offline.');

    // Wait briefly to check local storage buffering
    await page.waitForTimeout(500);

    // 4. Reconnect network to check background sync
    await context.setOffline(false);

    // Assert connection indicator recovers to Online
    await expect(page.locator('span:has-text("Online")')).toBeVisible({ timeout: 15000 });

    // Confirm input text is maintained
    await expect(editor).toContainText('Drafting distributed-sync notes offline.');
  });
});
