// @ts-check
import { test, expect } from '@playwright/test';

test('should add a new travel item', async ({ page }) => {
  // 1. Go to your app
  await page.goto('http://40.76.118.177:9090');

  // 2. Type a new item in the input
  await page.fill('input[placeholder="Items..."]', 'Passport');

  // 3. Click the ADD button
  await page.click('text=ADD');

  // 4. Verify that the new item appears on the page
  await expect(page.locator('text=Passport')).toBeVisible();
});
