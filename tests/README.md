# Tests E2E de Seedor - Flujos de Usuario

Este directorio contiene los tests end-to-end (E2E) de Playwright que simulan el comportamiento de usuarios reales interactuando con la aplicación Seedor.

## 📋 Filosofía de los Tests

Estos tests están diseñados para **simular usuarios reales**, no para verificar autorizaciones o permisos. Los tests:
- ✅ Reproducen flujos de usuarios navegando la aplicación
- ✅ Validan que las funcionalidades principales funcionan correctamente
- ✅ Verifican que los usuarios pueden completar tareas comunes
- ❌ NO verifican permisos ni autorizaciones
- ❌ NO son tests unitarios ni de integración

## 🗂️ Estructura de Tests

```
tests/
├── fixtures/
│   └── auth.fixture.ts          # Fixture para autenticación automática
├── helpers/
│   ├── navigation.helper.ts     # Funciones de navegación
│   └── actions.helper.ts        # Funciones de acciones comunes
└── e2e/
    ├── auth/
    │   └── auth-user-flow.spec.ts      # Login, logout, registro
    ├── campo/
    │   └── campo-user-flow.spec.ts     # Crear campos, lotes, cosechas
    ├── inventario/
    │   └── inventario-user-flow.spec.ts # Almacenes, items, movimientos
    ├── trabajadores/
    │   └── trabajadores-user-flow.spec.ts # Gestión de trabajadores
    ├── usuarios/
    │   └── usuarios-user-flow.spec.ts   # Invitaciones, roles
    └── configuracion/
        └── configuracion-user-flow.spec.ts # Perfil, empresa, planes
```

## 🚀 Ejecutar los Tests

### Ejecutar todos los tests
```bash
npm run test:e2e
```

### Ejecutar un módulo específico
```bash
# Campo
npx playwright test tests/e2e/campo

# Inventario
npx playwright test tests/e2e/inventario

# Trabajadores
npx playwright test tests/e2e/trabajadores

# Usuarios
npx playwright test tests/e2e/usuarios

# Configuración
npx playwright test tests/e2e/configuracion

# Autenticación
npx playwright test tests/e2e/auth
```

### Ejecutar un test específico
```bash
npx playwright test tests/e2e/campo/campo-user-flow.spec.ts
```

### Ejecutar en modo UI (recomendado para desarrollo)
```bash
npx playwright test --ui
```

### Ejecutar en modo debug
```bash
npx playwright test --debug
```

### Ejecutar solo en un navegador
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 🔧 Configuración Previa

### 1. Instalar dependencias
```bash
npm install
npx playwright install
```

### 2. Iniciar la aplicación
Antes de ejecutar los tests, asegúrate de que la aplicación esté corriendo en `http://localhost:3000`:

```bash
npm run dev
```

### 3. Credenciales de prueba
Los tests usan las siguientes credenciales por defecto:
- **Email**: `sratto@itba.edu.ar`
- **Password**: `123456`

## 📝 Módulos Testeados

### 🌾 Campo
- Crear campos con ubicación y descripción
- Agregar lotes a campos
- Gestionar tipos de cultivo
- Registrar cosechas
- Navegar entre pestañas
- Buscar campos por nombre

### 📦 Inventario
- Crear almacenes
- Agregar items al inventario
- Registrar movimientos (entradas/salidas)
- Ver alertas de stock bajo
- Configurar umbrales de stock
- Buscar items

### 👷 Trabajadores
- Agregar nuevos trabajadores
- Registrar pagos
- Editar información de trabajadores
- Ver historial de pagos
- Filtrar por tipo de pago
- Buscar trabajadores
- Desactivar trabajadores

### 👥 Usuarios
- Ver lista de usuarios
- Enviar invitaciones
- Ver invitaciones pendientes
- Cancelar invitaciones
- Reenviar invitaciones
- Ver roles de usuarios

### ⚙️ Configuración
- Ver y editar perfil
- Cambiar contraseña
- Gestionar datos de empresa
- Ver plan de suscripción
- Ver módulos activos
- Configurar módulos
- Subir foto de perfil

### 🔐 Autenticación
- Login exitoso
- Manejo de errores (credenciales incorrectas)
- Navegación a registro
- Navegación a recuperar contraseña
- Logout
- Navegación entre módulos del dashboard

## 🛠️ Helpers Disponibles

### Navigation Helper
```typescript
import { goTo, navigateToModule, waitForPageLoad } from '../helpers/navigation.helper';

// Ir a una URL
await goTo(page, '/dashboard/campo');

// Navegar a un módulo por el sidebar
await navigateToModule(page, 'Inventario');

// Esperar que la página cargue
await waitForPageLoad(page);
```

### Actions Helper
```typescript
import { 
  clickButton, 
  fillInputById, 
  selectOption,
  clickTableRow,
  searchFor,
  openModal,
  closeModal 
} from '../helpers/actions.helper';

// Click en un botón
await clickButton(page, 'Crear Campo');

// Llenar un input por ID
await fillInputById(page, 'field-name', 'Mi Campo');

// Seleccionar opción
await selectOption(page, 'tipo-cultivo', 'Limón');

// Buscar
await searchFor(page, 'Campo Test');

// Abrir modal
await openModal(page, 'Nuevo Trabajador');
```

## 📊 Ver Resultados

Después de ejecutar los tests:

### Ver reporte HTML
```bash
npx playwright show-report
```

### Ver screenshots de fallos
Los screenshots se guardan automáticamente en `test-results/` cuando un test falla.

## ⚠️ Notas Importantes

1. **Datos de Prueba**: Cada test usa datos únicos generados con `Date.now()` para evitar conflictos.

2. **Timeouts**: Los tests tienen timeouts generosos para acomodar animaciones y carga de datos.

3. **Selectores Flexibles**: Los tests usan selectores flexibles para adaptarse a cambios en el UI:
   - Roles de ARIA cuando es posible
   - Texto visible al usuario
   - IDs específicos cuando es necesario

4. **Estado Limpio**: Cada test es independiente y comienza con autenticación limpia.

5. **Navegadores**: Los tests se ejecutan en Chrome, Firefox y Safari por defecto.

## 🐛 Debugging

### Si un test falla:

1. **Ver el screenshot**: Busca en `test-results/`
2. **Ejecutar en modo UI**: `npx playwright test --ui`
3. **Ejecutar en modo debug**: `npx playwright test --debug`
4. **Ver la traza**: 
   ```bash
   npx playwright test --trace on
   npx playwright show-report
   ```

### Problemas Comunes:

**Timeout en login**:
```bash
# Aumenta el timeout en playwright.config.ts
timeout: 60000
```

**Selectores no encontrados**:
```bash
# Ejecuta en modo codegen para ver selectores
npx playwright codegen http://localhost:3000
```

**Aplicación no corriendo**:
```bash
# Asegúrate de que esté en puerto 3000
npm run dev
```

## 🔄 CI/CD

Los tests están configurados para ejecutarse en CI con:
- 2 reintentos en caso de fallo
- Screenshots automáticos en fallos
- Reporte HTML generado automáticamente

## 📚 Recursos

- [Documentación de Playwright](https://playwright.dev)
- [Best Practices de Testing E2E](https://playwright.dev/docs/best-practices)
- [Selectores de Playwright](https://playwright.dev/docs/selectors)
