import { Page } from '@playwright/test';

/**
 * Realiza el inicio de sesión en la aplicación
 */
export async function login(
  page: Page, 
  email: string = 'sratto@itba.edu.ar', 
  password: string = '123456'
) {
  await page.goto('/login');
  
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Rellenar los campos de login
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  
  // Hacer clic en el botón de login
  await page.locator('button[type="submit"]').click();
  
  try {
    await page.waitForURL(/.*dashboard.*|.*home.*/, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
  } catch (error) {
    console.log('No se pudo detectar la redirección a dashboard, continuando de todos modos');
    await page.screenshot({ path: 'test-results/login-error.png' });
  }
}

/**
 * Realiza el cierre de sesión
 */
export async function logout(page: Page) {
  const logoutButton = page.getByRole('button', { name: /logout|salir|cerrar sesión/i });
  if (await logoutButton.count() > 0) {
    await logoutButton.click();
    await page.waitForTimeout(1500);
  }
}
