import { test, expect } from '../../fixtures/auth.fixture';
import { goTo } from '../../helpers/navigation.helper';

test.describe('Configuración - Flujo de Usuario', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await goTo(page, '/dashboard/configuracion');
  });

  test('usuario puede acceder al módulo de configuración', async ({ authenticatedPage: page }) => {
    // Usuario ve la página de configuración
    await expect(page).toHaveURL(/configuracion/);
  });
});
