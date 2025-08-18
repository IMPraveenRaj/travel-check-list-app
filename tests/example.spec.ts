import { test, expect } from '@playwright/test';

test('homepaget title', async ({ page }) => {
  await page.goto("http://40.76.118.177:9090/");
  await page.getByText("🌴Far Away💼").isVisible();
  await page.waitForTimeout(5000);
});

test('input field', async({page}) => {
    await page.goto("http://40.76.118.177:9090/");
  await page.getByText("🌴Far Away💼").isVisible();
  await page.getByPlaceholder("Items...").fill("Backpack");
})

test.only('add items', async({page}) => {
   await page.goto("http://40.76.118.177:9090/");
  await page.getByText("🌴Far Away💼").isVisible();
  await page.getByPlaceholder("Items...").fill("Backpack");
  await page.getByRole('button', { name: 'Add' }).click();
  await page.locator('input[type="checkbox"][value="false"]').click();
await page.waitForTimeout(5000);
})

test('Add items&check', async ({page}) => {
  await page.goto("http://40.76.118.177:9090/");
  await page.getByText("🌴Far Away💼").isVisible();
  await page.getByPlaceholder("Items...").fill("Backpack");
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByPlaceholder("Items...").fill("Dresses");
  await page.getByRole('button', { name: 'Add' }).click();
await page.waitForTimeout(6000);
})