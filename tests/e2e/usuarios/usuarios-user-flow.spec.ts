import { test, expect } from '../../fixtures/auth.fixture';
import { goTo } from '../../helpers/navigation.helper';

test.describe('Usuarios - Flujo de Usuario', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await goTo(page, '/dashboard/usuarios');
  });

  test('usuario puede acceder al módulo de usuarios', async ({ authenticatedPage: page }) => {
    // Usuario ve la página de usuarios
    await expect(page).toHaveURL(/usuarios/);
  });
});
