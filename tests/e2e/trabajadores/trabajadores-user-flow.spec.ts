import { test, expect } from '../../fixtures/auth.fixture';
import { goTo } from '../../helpers/navigation.helper';

test.describe('Trabajadores - Flujo de Usuario', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await goTo(page, '/dashboard/trabajadores');
  });

  test('usuario puede acceder al módulo de trabajadores', async ({ authenticatedPage: page }) => {
    // Usuario ve la página de trabajadores
    await expect(page).toHaveURL(/trabajadores/);
  });
});
