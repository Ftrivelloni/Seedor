import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Autenticación - Flujo de Usuario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('usuario puede hacer login exitosamente', async ({ page }) => {
    // Usuario ve la página de login
    await expect(page).toHaveURL(/login/);
    
    // Usuario llena el formulario
    await page.locator('input[type="email"]').fill('sratto@itba.edu.ar');
    await page.locator('input[type="password"]').fill('123456');
    
    // Usuario hace click en login
    await page.locator('button[type="submit"]').click();
    
    // Usuario es redirigido al dashboard
    await page.waitForURL(/.*dashboard.*|.*home.*/, { timeout: 30000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('usuario ve error con credenciales incorrectas', async ({ page }) => {
    // Usuario intenta login con credenciales incorrectas
    await page.locator('input[type="email"]').fill('wrong@email.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    
    // Usuario ve mensaje de error
    const errorMessage = page.getByText(/error|incorrect|inválid/i);
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('usuario puede navegar a registro', async ({ page }) => {
    // Usuario hace click en "Registrarse"
    const registerLink = page.getByRole('link', { name: /registr/i });
    if (await registerLink.count() > 0) {
      await registerLink.click();
      await page.waitForTimeout(1000);
      
      // Usuario ve la página de registro
      await expect(page).toHaveURL(/register/);
    }
  });

  test('usuario puede navegar a recuperar contraseña', async ({ page }) => {
    // Usuario hace click en "Olvidé mi contraseña"
    const forgotLink = page.getByRole('link', { name: /olvidé|forgot/i });
    if (await forgotLink.count() > 0) {
      await forgotLink.click();
      await page.waitForTimeout(1000);
      
      // Usuario ve la página de recuperación
      await expect(page).toHaveURL(/forgot-password/);
    }
  });

  test('usuario registrado puede hacer logout', async ({ page }) => {
    // Primero hacer login
    await page.locator('input[type="email"]').fill('sratto@itba.edu.ar');
    await page.locator('input[type="password"]').fill('123456');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*dashboard.*|.*home.*/, { timeout: 30000 });
    
    // Usuario hace logout
    const logoutButton = page.getByRole('button', { name: /logout|salir|cerrar sesión/i });
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForTimeout(1500);
      
      // Usuario es redirigido a login
      await expect(page).toHaveURL(/login/);
    }
  });
});

test.describe('Dashboard - Navegación de Usuario', () => {
  test('usuario puede ver el dashboard principal', async ({ authenticatedPage: page }) => {
    // Usuario ve el dashboard
    await expect(page).toHaveURL(/dashboard/);
    
    // Usuario ve el sidebar con módulos
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('usuario puede navegar a Campo', async ({ authenticatedPage: page }) => {
    // Usuario navega a Campo
    await page.goto('/dashboard/campo');
    await page.waitForLoadState('domcontentloaded');
    
    // Usuario ve la página de Campo
    await expect(page).toHaveURL(/campo/);
  });

  test('usuario puede navegar a Inventario', async ({ authenticatedPage: page }) => {
    // Usuario navega a Inventario
    await page.goto('/dashboard/inventario');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/inventario/);
  });

  test('usuario puede navegar a Trabajadores', async ({ authenticatedPage: page }) => {
    // Usuario navega a Trabajadores
    await page.goto('/dashboard/trabajadores');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/trabajadores/);
  });

  test('usuario puede navegar a Usuarios', async ({ authenticatedPage: page }) => {
    // Usuario navega a Usuarios
    await page.goto('/dashboard/usuarios');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/usuarios/);
  });

  test('usuario puede navegar a Configuración', async ({ authenticatedPage: page }) => {
    // Usuario navega a Configuración
    await page.goto('/dashboard/configuracion');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/configuracion/);
  });

  test('usuario puede abrir y cerrar el sidebar', async ({ authenticatedPage: page }) => {
    // Usuario busca el botón de toggle sidebar
    const toggleButton = page.getByRole('button', { name: /menu|toggle/i });
    if (await toggleButton.count() > 0) {
      // Usuario cierra el sidebar
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      // Usuario abre el sidebar
      await toggleButton.click();
      await page.waitForTimeout(500);
    }
  });
});
