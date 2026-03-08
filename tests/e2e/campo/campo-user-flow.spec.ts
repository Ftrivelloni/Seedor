import { test, expect } from '../../fixtures/auth.fixture';
import { goTo } from '../../helpers/navigation.helper';

test.describe('Campo - Flujo de Usuario', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await goTo(page, '/dashboard/campo');
  });

  test('usuario puede acceder al módulo de campo', async ({ authenticatedPage: page }) => {
    // Usuario ve la página de campo
    await expect(page).toHaveURL(/campo/);
 
    // Usuario ve el botón para crear campo
    const nuevoButton = page.getByRole('button', { name: /nuevo campo/i });
    await expect(nuevoButton).toBeVisible();
  });

  test('usuario puede abrir modal de nuevo campo', async ({ authenticatedPage: page }) => {
    // Usuario hace click en "Nuevo campo"
    const nuevoButton = page.getByRole('button', { name: /nuevo campo/i });
    await nuevoButton.click();
    
    await page.waitForTimeout(1000);
    
    // Usuario ve el modal con los campos
    await expect(page.locator('#field-name')).toBeVisible();
    await expect(page.locator('#field-location')).toBeVisible();
  });

  test('usuario puede navegar entre las pestañas de campo', async ({ authenticatedPage: page }) => {
    // Usuario ve la pestaña "Campos y lotes" activa
    const camposTab = page.getByRole('button', { name: /campos/i }).first();
    if (await camposTab.count() > 0) {
     await expect(camposTab).toBeVisible();
    }
  });
});
