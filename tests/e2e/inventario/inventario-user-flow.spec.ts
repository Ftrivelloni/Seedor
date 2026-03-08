import { test, expect  } from '../../fixtures/auth.fixture';
import { goTo } from '../../helpers/navigation.helper';

test.describe('Inventario - Flujo de Usuario', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await goTo(page, '/dashboard/inventario');
  });

  test('usuario puede acceder al módulo de inventario', async ({ authenticatedPage: page }) => {
    // Usuario ve la página de inventario
    await expect(page).toHaveURL(/inventario/);
  });
});
