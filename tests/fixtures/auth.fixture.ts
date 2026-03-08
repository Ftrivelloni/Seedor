import { test as base, expect, type Page } from '@playwright/test';

export const ADMIN_USER = {
  email: 'sratto@itba.edu.ar',
  password: '123456',
};

/**
 * Performs login flow
 */
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  
  // Wait for the page to be fully loaded
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  
  // Fill login form
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  
  // Submit
  await page.locator('button[type="submit"]').click();
  
  // Wait for navigation to dashboard with extended timeout for Firefox
  try {
    await page.waitForURL(/.*dashboard.*/, { timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  } catch (error) {
    console.log('No se pudo detectar la redirección a dashboard, verificando URL actual...');
    const currentURL = page.url();
    console.log(`URL actual: ${currentURL}`);
    
    // Si ya estamos en dashboard, está OK
    if (currentURL.includes('dashboard')) {
      console.log('✅ Ya estamos en dashboard');
      await page.waitForTimeout(500);
    } else {
      console.log('⚠️  No se redirigió al dashboard');
      // Solo intentar screenshot si la página todavía está disponible
      try {
        await page.screenshot({ path: 'test-results/login-error.png' });
      } catch {
        // Ignorar errores de screenshot si la página se cerró
      }
      throw new Error(`Login failed - current URL: ${currentURL}`);
    }
  }
}

/**
 * Extended test fixture with authenticated page
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Login before each test
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await use(page);
  },
});

export { expect };

