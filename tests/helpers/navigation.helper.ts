import type { Page } from '@playwright/test';

/**
 * Navigate to a module by clicking on the sidebar link
 */
export async function navigateToModule(page: Page, moduleName: string) {
  const link = page.getByRole('link', { name: new RegExp(moduleName, 'i') });
  await link.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(300);
}

/**
 * Wait for page to finish loading
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(300);
}

/**
 * Go directly to a URL
 */
export async function goTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(300);
}
