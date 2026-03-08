import type { Page, Locator } from '@playwright/test';

/**
 * Click a button and wait for the action to complete
 */
export async function clickButton(page: Page, buttonText: string | RegExp) {
  const button = page.getByRole('button', { name: buttonText });
  await button.click();
  await page.waitForTimeout(1000);
}

/**
 * Fill a form with data
 */
export async function fillForm(page: Page, data: Record<string, string>) {
  for (const [name, value] of Object.entries(data)) {
    const input = page.locator(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`).first();
    if (await input.count() > 0) {
      await input.fill(value);
    }
  }
}

/**
 * Fill an input by its ID
 */
export async function fillInputById(page: Page, id: string, value: string) {
  const input = page.locator(`#${id}`);
  await input.waitFor({ state: 'visible' });
  await input.fill(value);
}

/**
 * Select an option from a dropdown
 */
export async function selectOption(page: Page, selectId: string, optionText: string | RegExp) {
  const select = page.locator(`#${selectId}, select[name="${selectId}"]`);
  await select.selectOption({ label: optionText.toString() });
  await page.waitForTimeout(300);
}

/**
 * Click on a table row by text
 */
export async function clickTableRow(page: Page, text: string) {
  const row = page.getByText(text);
  await row.click();
  await page.waitForTimeout(1000);
}

/**
 * Search in a search input
 */
export async function searchFor(page: Page, searchText: string) {
  const searchInput = page.getByPlaceholder(/buscar|search/i);
  await searchInput.fill(searchText);
  await page.waitForTimeout(500);
}

/**
 * Open a modal by clicking a button
 */
export async function openModal(page: Page, buttonText: string | RegExp) {
  await clickButton(page, buttonText);
  await page.waitForTimeout(1000);
}

/**
 * Close a modal
 */
export async function closeModal(page: Page) {
  const closeButton = page.getByRole('button', { name: /cerrar|cancelar/i });
  if (await closeButton.count() > 0) {
    await closeButton.click();
    await page.waitForTimeout(500);
  }
}
