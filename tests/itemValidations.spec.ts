import {test,expect} from '@playwright/test'

test('validate items', async ({page}) =>{
  await page.goto("http://40.76.118.177:9090/");
  await page.getByText("🌴Far Away💼").isVisible();
  await page.getByPlaceholder("Items...").fill("Backpack");
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByPlaceholder("Items...").fill("Dresses");
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByPlaceholder("Items...").fill("Charger");
 await page.getByRole('button', { name: 'Add' }).click();

 // validate items
 await page.locator("span",{hasText:"Dresses"}).isVisible();
 await page.waitForTimeout(5000);

})