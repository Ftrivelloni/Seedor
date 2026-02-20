# AGENTS.md — Seedor Project Context

> **Seedor** is a multi-tenant agricultural management SaaS built for Argentine agri-businesses.
> The entire UI is in **Spanish (Argentina)**.
> Language in code: English for identifiers, Spanish for user-facing strings and error messages.

---

## 1. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Turbopack enabled; React 19 |
| **Language** | TypeScript 5 (strict) | Path alias `@/*` → `./src/*` |
| **Database** | PostgreSQL via Prisma 6 | `@prisma/client` + `@prisma/adapter-pg` |
| **Auth** | Custom (no NextAuth) | HMAC-SHA256 session tokens, `scryptSync` passwords |
| **Payments** | Stripe (subscriptions) | Webhooks, dynamic price IDs from product metadata |
| **Email** | Resend | Invitation emails only |
| **UI Components** | shadcn/ui (44 components) | In `src/components/dashboard/ui/` |
| **Styling** | Tailwind CSS v4 | Via `@tailwindcss/postcss`; `oklch` color tokens in `globals.css` |
| **Icons** | Lucide React | Used everywhere |
| **Charts** | Recharts | Dashboard widgets |
| **Tables** | TanStack React Table | Data tables |
| **Drag & Drop** | dnd-kit | Dashboard widget ordering |
| **Forms** | React Hook Form | Some forms; many use native `FormData` |
| **Dates** | date-fns | Date formatting/manipulation |
| **Toasts** | Sonner | Notifications |
| **Testing** | Vitest | Unit tests for server actions |
| **Linting** | ESLint 9 (flat config) | `eslint-config-next` |

---

## 2. Project Structure

```
src/
├── app/                          # Next.js App Router pages & API routes
│   ├── layout.tsx                # Root layout (Geist font, lang="es")
│   ├── page.tsx                  # Landing page (public)
│   ├── login/page.tsx            # Login form (client component)
│   ├── register/                 # Multi-step: form → select-plan → success
│   ├── accept-invitation/page.tsx # Token-based invitation acceptance
│   ├── forgot-password/page.tsx  # UI only (not implemented)
│   ├── api/                      # API route handlers
│   │   ├── auth/                 # login, register, logout, me, validate-invitation, accept-invitation
│   │   ├── campo/tasks/          # PATCH task status
│   │   └── stripe/               # create-checkout, subscription (CRUD), webhook
│   └── dashboard/                # Protected dashboard area
│       ├── layout.tsx            # Wraps in AppLayout, calls requireAuthSession()
│       ├── page.tsx              # Dashboard overview with widgets
│       ├── campo/                # Field → Lot → Task management
│       ├── trabajadores/         # Worker management & payment tracking
│       ├── usuarios/             # User management & invitations (ADMIN only)
│       ├── inventario/           # Warehouses, items, stock movements
│       ├── empaque/              # 6-stage packing pipeline
│       ├── configuracion/        # Settings (placeholder)
│       ├── maquinaria/           # Machinery (placeholder, mock data)
│       ├── ventas/               # Sales (placeholder, mock data)
│       ├── integraciones/        # Integrations (placeholder)
│       └── widgets/              # Widget render components
├── components/
│   ├── dashboard/                # AppLayout, StateCard, TaskKanbanBoard, EmptyState, etc.
│   │   └── ui/                   # 44 shadcn/ui primitives (button, dialog, table, select, etc.)
│   └── landing/                  # 13 landing page sections (Hero, Features, CTA, Footer, etc.)
├── lib/
│   ├── prisma.ts                 # Singleton PrismaClient (globalThis caching in dev)
│   ├── resend.ts                 # Resend email client
│   ├── stripe.ts                 # Stripe client
│   ├── utils.ts                  # cn() helper (clsx + twMerge)
│   ├── auth/                     # Auth utilities (see §4)
│   ├── domain/inventory.ts       # Inventory movement domain logic
│   ├── email/invitation-email.ts # HTML/text email builder for invitations
│   ├── stripe/                   # config.ts (dynamic prices), helpers.ts, index.ts
│   └── utils/format-relative-time.ts # Spanish relative time formatting
├── hooks/                        # useScrollAnimation, useStaggeredAnimation, useParallax
├── data/seedorData.ts            # Mock data for placeholder pages (523 lines)
├── contexts/                     # Empty — no React Context used
├── types/                        # Empty — types are colocated with modules
├── styles/                       # (empty)
└── __tests__/                    # Vitest tests for server actions
```

---

## 3. Multi-Tenancy Model

Every data query is scoped by `tenantId`. The tenant is resolved from the authenticated user's `TenantUserMembership`.

```
Tenant (org) ←── TenantUserMembership ──→ User
  ├── Fields ──→ Lots ──→ Tasks, Harvests
  ├── Workers ──→ TaskAssignments, WorkLogs
  ├── Warehouses ──→ WarehouseStocks ──→ InventoryItems
  ├── Invitations
  ├── DashboardPreferences
  ├── TenantModuleSettings
  └── Empaque pipeline (TruckEntries, Bins, Sessions, Chambers, Boxes, Pallets, Dispatches)
```

**IDs**: All primary keys use `cuid()`.

**Enums** (key ones):
- `UserRole`: `ADMIN`, `SUPERVISOR`
- `UserStatus`: `INVITED`, `ACTIVE`, `INACTIVE`
- `TaskStatus`: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `LATE`
- `SubscriptionStatus`: `INACTIVE`, `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELED`, `UNPAID`
- `ModuleKey`: `DASHBOARD`, `USERS`, `WORKERS`, `FIELD`, `INVENTORY`, `MACHINERY`, `PACKAGING`, `SALES`, `SETTINGS`
- `InventoryMovementType`: `INCOME`, `TRANSFER`, `CONSUMPTION`, `ADJUSTMENT`

---

## 4. Authentication System

### Architecture (Custom — No NextAuth)

| Component | File | Purpose |
|---|---|---|
| Password hashing | `src/lib/auth/password.ts` | `scryptSync` with random 16-byte salt, stored as `salt:hash` |
| Session tokens | `src/lib/auth/session-token.ts` | HMAC-SHA256 signed JSON (Base64URL), payload: `{userId, tenantId, role, exp}`, uses `timingSafeEqual` |
| Cookie config | `src/lib/auth/constants.ts` | Cookie name: `seedor_session`, httpOnly, secure in prod, SameSite=lax, 12h TTL |
| Server-side auth | `src/lib/auth/auth.ts` | For Server Components & Server Actions — uses `cookies()` from `next/headers` |
| API route auth | `src/lib/auth/api-auth.ts` | For Route Handlers — uses `request.cookies.get()` from `NextRequest` |

### Auth Functions

```typescript
// Server Components / Server Actions (src/lib/auth/auth.ts)
getAuthSession(): Promise<AuthSession | null>      // Returns session or null
requireAuthSession(): Promise<AuthSession>          // Redirects to /login if not authenticated
requireRole(allowedRoles: UserRole[]): Promise<AuthSession>  // Redirects to /dashboard if role not allowed

// API Route Handlers (src/lib/auth/api-auth.ts)
getApiAuthSession(request: NextRequest): Promise<AuthSession | null>
hasRequiredRole(session: AuthSession, roles: UserRole[]): boolean
```

### AuthSession Shape

```typescript
interface AuthSession {
  userId: string;
  tenantId: string;
  role: UserRole;       // 'ADMIN' | 'SUPERVISOR'
  firstName: string;
  lastName: string;
  email: string;
}
```

### Auth Flows

```
Registration:  Form → /register/select-plan → Stripe Checkout → /register/success → POST /api/auth/register → auto-login → /dashboard
Login:         Form → POST /api/auth/login → session cookie → /dashboard
Invitation:    Email link → GET /api/auth/validate-invitation?token=xxx → form → POST /api/auth/accept-invitation → auto-login → /dashboard
Logout:        POST /api/auth/logout → clear cookie → /login
```

---

## 5. Architecture Patterns

### 5.1 Server Component Page → Client Component Pattern

Every implemented module follows this pattern:

```
page.tsx (Server Component)
  → requireAuthSession() or requireRole(...)
  → Promise.all([...Prisma queries...])
  → Serialize Dates to ISO strings
  → <ModulePageClient {...serializedProps} />

ModulePageClient.tsx ('use client')
  → Receives serialized data as props
  → Manages local UI state (search, filters, modals)
  → Calls server actions from actions.ts
```

**Example — Campo Page (`src/app/dashboard/campo/page.tsx`):**

```tsx
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';
import { CampoPageClient } from './CampoPageClient';
import type { SerializedField, ... } from './types';

export default async function CampoPage() {
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  const [fields, recentHarvests, taskTypes, ...] = await Promise.all([
    prisma.field.findMany({
      where: { tenantId: session.tenantId },
      include: { lots: { include: { taskLinks: { include: { task: true } } } } },
      orderBy: { name: 'asc' },
    }),
    // ... more queries
  ]);

  // Serialize Dates → ISO strings
  const serializedFields: SerializedField[] = fields.map((f) => ({
    id: f.id,
    name: f.name,
    lots: f.lots.map((l) => ({
      ...l,
      lastTaskAt: l.lastTaskAt?.toISOString() ?? null,
    })),
  }));

  return <CampoPageClient fields={serializedFields} ... />;
}
```

### 5.2 Server Actions Pattern

All mutations go through Server Actions in colocated `actions.ts` files.

**Example — Create Field Action (`src/app/dashboard/campo/actions.ts`):**

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/auth';

export async function createFieldAction(formData: FormData) {
  // 1. Auth check
  const session = await requireRole(['ADMIN', 'SUPERVISOR']);

  // 2. Extract & validate input
  const name = String(formData.get('name') || '').trim();
  if (!name) throw new Error('El nombre del campo es obligatorio.');
  if (name.length > 100) throw new Error('El nombre del campo no puede superar los 100 caracteres.');

  // 3. Prisma mutation with tenant isolation
  try {
    await prisma.field.create({
      data: {
        tenantId: session.tenantId,
        name,
        location: location || null,
        description: description || null,
      },
    });
  } catch (err) {
    // 4. Handle unique constraint (P2002)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new Error('Ya existe un campo con ese nombre.');
    }
    throw err;
  }

  // 5. Revalidate cache
  revalidatePath('/dashboard/campo');
}
```

**Action conventions:**
- Always start with `'use server'` directive
- First line: `requireRole(...)` or `requireAuthSession()`
- Input: `FormData` (Next.js convention) or direct params for simple actions
- Validation: manual, with Spanish error messages (thrown `Error`)
- Prisma P2002 errors: caught and re-thrown with user-friendly messages
- After mutation: `revalidatePath('/dashboard/...')` to invalidate Next.js cache
- Some modules (Usuarios) return `{ success: true } | { success: false; error: string }` instead of throwing

### 5.3 Client Modal Pattern

Modals call server actions via `useTransition` for pending states.

**Example — CreateFieldModal (`src/app/dashboard/campo/CreateFieldModal.tsx`):**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createFieldAction } from './actions';

export function CreateFieldModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createFieldAction(formData);
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear el campo.');
      }
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)}>Nuevo campo</button>
      {open && (
        <div className="fixed inset-0 z-50 ...">
          <form onSubmit={handleSubmit}>
            {error && <p className="text-red-600 ...">{error}</p>}
            <input name="name" required />
            <button type="submit" disabled={isPending}>
              {isPending ? 'Creando...' : 'Crear campo'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
```

### 5.4 Types Pattern (Serialization Layer)

Each module defines `types.ts` with serialized interfaces that replace `Date` with `string` (ISO format) for client component props.

**Example — Campo types (`src/app/dashboard/campo/types.ts`):**

```typescript
export interface SerializedLot {
  id: string;
  fieldId: string;
  name: string;
  areaHectares: number;
  productionType: string;
  plantedFruitsDescription: string | null;
  crops: string[];                           // Flattened from LotCrop → CropType.name
  lastTaskAt: string | null;                 // ISO string (was Date)
  taskCost: number;                          // Computed aggregate
  totalHarvestKilos: number;                 // Computed aggregate
  taskCount: number;                         // Computed count
  taskRecency: Record<string, string>;       // taskType name → ISO date
}

export interface SerializedField {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  lots: SerializedLot[];
}
```

### 5.5 Error Boundary Pattern

Modules can define `error.tsx` for Next.js error boundaries.

**Example — Campo error boundary (`src/app/dashboard/campo/error.tsx`):**

```tsx
'use client';

export default function CampoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Algo salió mal</h2>
      <p>{error.message || 'Error desconocido'}</p>
      <button onClick={reset}>Reintentar</button>
    </div>
  );
}
```

---

## 6. API Routes

### Auth Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Email/password login → session cookie |
| POST | `/api/auth/register` | Public | Register user + tenant + Stripe + modules (transaction) |
| POST | `/api/auth/logout` | None | Clear session cookie |
| GET | `/api/auth/me` | Session | Return current user info |
| GET | `/api/auth/validate-invitation` | Public | Validate invitation token |
| POST | `/api/auth/accept-invitation` | Public | Accept invitation, create user, auto-login |

### Stripe Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/stripe/create-checkout` | Public | Create Stripe Checkout session (pre-registration) |
| GET | `/api/stripe/subscription` | Session | Get tenant subscription details |
| POST | `/api/stripe/subscription/add-module` | ADMIN | Add optional module to subscription |
| POST | `/api/stripe/subscription/remove-module` | ADMIN | Remove optional module from subscription |
| POST | `/api/stripe/webhook` | Stripe signature | Process Stripe events (idempotent via StripeEvent table) |

### Other

| Method | Route | Auth | Purpose |
|---|---|---|---|
| PATCH | `/api/campo/tasks/[taskId]/status` | ADMIN/SUPERVISOR | Update task status |

### API Route Pattern Example

```typescript
// src/app/api/campo/tasks/[taskId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthSession, hasRequiredRole } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: { taskId: string } }) {
  const session = await getApiAuthSession(request);
  if (!session || !hasRequiredRole(session, ['ADMIN', 'SUPERVISOR'])) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { status } = await request.json();
  // ... validate and update
  return NextResponse.json({ success: true });
}
```

---

## 7. Stripe Integration

### Architecture

- **No hardcoded Price IDs** — reads from Stripe Product metadata (`module=BASE|MACHINERY|PACKAGING|SALES`)
- **5-minute in-memory cache** for price lookups (`src/lib/stripe/config.ts`)
- **Mandatory modules**: DASHBOARD, USERS, WORKERS, FIELD, INVENTORY, SETTINGS (included in base price)
- **Optional modules**: MACHINERY, PACKAGING, SALES (individual subscription items)

### Subscription Flow

```
1. User fills registration form → selects optional modules
2. POST /api/stripe/create-checkout → Stripe Checkout Session (subscription mode)
3. Stripe checkout → redirect to /register/success
4. POST /api/auth/register → creates Tenant + User + Membership + ModuleSettings in transaction
5. Stripe webhook (invoice.payment_succeeded) → activates subscription, syncs modules
```

### Webhook Idempotency

Uses `StripeEvent` model in DB. Each webhook checks if event ID was already processed before acting.

---

## 8. Module Details

### Implemented Modules

| Module | Route | Auth | Key Models |
|---|---|---|---|
| **Dashboard** | `/dashboard` | Any user | DashboardPreference (template + widgets) |
| **Campo** | `/dashboard/campo` | ADMIN, SUPERVISOR | Field → Lot → Task, HarvestRecord, CropType, TaskType |
| **Trabajadores** | `/dashboard/trabajadores` | ADMIN, SUPERVISOR | Worker, TaskAssignment, TaskWorkLog |
| **Usuarios** | `/dashboard/usuarios` | ADMIN only | User, Invitation, TenantUserMembership |
| **Inventario** | `/dashboard/inventario` | ADMIN, SUPERVISOR | Warehouse, InventoryItem, WarehouseStock, InventoryMovement |
| **Empaque** | `/dashboard/empaque` | ADMIN, SUPERVISOR | 6 sub-routes (see below) |

### Empaque Sub-Routes (Packing Pipeline)

| Sub-Route | Path | Purpose |
|---|---|---|
| **Balanza** | `/dashboard/empaque/balanza` | Truck arrivals → bins |
| **Preselección** | `/dashboard/empaque/preseleccion` | Fruit sorting sessions |
| **Cámaras** | `/dashboard/empaque/camaras` | Cold/ethylene chambers |
| **Proceso** | `/dashboard/empaque/proceso` | Processing sessions → boxes |
| **Pallets** | `/dashboard/empaque/pallets` | Box grouping into pallets |
| **Despacho** | `/dashboard/empaque/despacho` | Dispatch management |

### Placeholder Modules (Not Yet Implemented)

| Module | Route | Status |
|---|---|---|
| Configuración | `/dashboard/configuracion` | Client-only, static tabs |
| Maquinaria | `/dashboard/maquinaria` | Client-only, mock data from `seedorData.ts` |
| Ventas | `/dashboard/ventas` | Client-only, mock data |
| Integraciones | `/dashboard/integraciones` | Static UI (n8n, WhatsApp, Supabase) |

---

## 9. Testing Patterns

**Framework**: Vitest (config in `vitest.config.ts`)

### Test Structure

```typescript
// src/__tests__/campo-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Mock dependencies BEFORE importing actions
vi.mock('@/lib/auth/auth', () => ({
  requireRole: vi.fn().mockResolvedValue({ tenantId: 'tenant-1', userId: 'user-1' }),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/domain/inventory', () => ({ createInventoryMovement: vi.fn() }));

const mockFieldCreate = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    field: { create: (...args: unknown[]) => mockFieldCreate(...args) },
  },
}));

import { Prisma } from '@prisma/client';
import { createFieldAction } from '@/app/dashboard/campo/actions';

// 2. Helper to build FormData
function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}

// 3. Tests: validation → P2002 handling → happy path
describe('createFieldAction', () => {
  beforeEach(() => { vi.clearAllMocks(); mockFieldCreate.mockResolvedValue({ id: 'f-1' }); });

  it('throws when name is empty', async () => {
    await expect(createFieldAction(makeFormData({ name: '' }))).rejects.toThrow('obligatorio');
  });

  it('handles P2002 duplicate constraint', async () => {
    mockFieldCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('', { code: 'P2002', clientVersion: '' })
    );
    await expect(createFieldAction(makeFormData({ name: 'Test' }))).rejects.toThrow('Ya existe');
  });

  it('creates field with valid data', async () => {
    await createFieldAction(makeFormData({ name: 'Campo Norte', location: 'Córdoba' }));
    expect(mockFieldCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Campo Norte', tenantId: 'tenant-1' }),
    });
  });
});
```

### What Gets Tested

- Input validation edge cases (empty, whitespace, max length, NaN, negative numbers)
- Prisma unique constraint errors (P2002) → user-friendly messages
- Happy path: correct Prisma calls with expected data

---

## 10. Styling & Component Conventions

### CSS Architecture

- **Tailwind CSS v4** with `@import "tailwindcss"` syntax
- **Color system**: `oklch` values defined as CSS custom properties in `globals.css`
- **Brand color**: Green (`#16a34a` / `green-600`) — used for primary buttons, sidebar active state, and accents
- **Radius**: `0.625rem` base

### Component Conventions

- **shadcn/ui primitives** live in `src/components/dashboard/ui/`
- **Module-specific components** are colocated with their page (e.g., `CreateFieldModal.tsx` next to `campo/page.tsx`)
- **Shared dashboard components** live in `src/components/dashboard/` (AppLayout, StateCard, EmptyState, etc.)
- **Landing components** in `src/components/landing/` with barrel export via `index.ts`
- All buttons use green-600 primary color: `bg-green-600 hover:bg-green-700`

### Common UI Patterns

```tsx
// Primary button
<button className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-colors">
  <Icon className="h-4 w-4" />
  Label
</button>

// Error display
{error && (
  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
    {error}
  </p>
)}

// Form input
<input
  name="name"
  required
  maxLength={100}
  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
/>
```

---

## 11. Domain Logic

### Inventory Movement System (`src/lib/domain/inventory.ts`)

Centralized domain service handling all 4 inventory movement types within Prisma transactions:

| Type | Requires | Logic |
|---|---|---|
| `INCOME` | destinationWarehouseId | Increments stock in destination |
| `CONSUMPTION` | sourceWarehouseId | Decrements stock (validates sufficient qty) |
| `TRANSFER` | source + destination | Moves stock between warehouses (validates qty) |
| `ADJUSTMENT` | destinationWarehouseId | Positive or negative adjustment |

Stock alert levels: `SIN_STOCK` → `CRITICO` → `BAJO` → `OK` (resolved by `resolveStockAlertLevel()`).

### Sequential Code Generation (Empaque)

```typescript
// Pattern: PREFIX-YEAR-SEQUENCE
// Examples: B-2026-0001 (bin), C-2026-00001 (box), P-2026-0001 (pallet), D-2026-0001 (dispatch)
const year = new Date().getFullYear();
const lastEntity = await prisma.entity.findFirst({
  where: { tenantId, code: { startsWith: `PREFIX-${year}-` } },
  orderBy: { code: 'desc' },
});
const nextNumber = lastEntity ? parseInt(lastEntity.code.split('-')[2]) + 1 : 1;
const code = `PREFIX-${year}-${String(nextNumber).padStart(4, '0')}`;
```

---

## 12. Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection (pooled, for Prisma) |
| `DIRECT_URL` | PostgreSQL direct connection (for migrations) |
| `SESSION_SECRET` | HMAC key for session token signing |
| `RESEND_API_KEY` | Resend email API key |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Application base URL (for invitation email links) |

---

## 13. Key Commands

```bash
npm run dev              # Start development server (Next.js + Turbopack)
npm run build            # prisma generate && next build
npm run lint             # ESLint
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run Prisma migrations
npm run prisma:push      # Push schema to DB (no migration)
npm run prisma:seed      # Seed database (node prisma/seed.mjs)
npx vitest               # Run tests
```

---

## 14. File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Server page | `page.tsx` | `campo/page.tsx` |
| Client page component | `*PageClient.tsx` | `CampoPageClient.tsx` |
| Server actions | `actions.ts` | `campo/actions.ts` |
| Serialized types | `types.ts` | `campo/types.ts` |
| Modal components | `Create*Modal.tsx`, `Edit*Modal.tsx`, `*Sheet.tsx` | `CreateFieldModal.tsx` |
| Error boundary | `error.tsx` | `campo/error.tsx` |
| Layout | `layout.tsx` | `dashboard/layout.tsx` |
| Domain services | `src/lib/domain/*.ts` | `inventory.ts` |
| Auth utilities | `src/lib/auth/*.ts` | `auth.ts`, `api-auth.ts` |

---

## 15. Role-Based Access Summary

| Feature | ADMIN | SUPERVISOR |
|---|---|---|
| Dashboard | ✅ | ✅ |
| Campo | ✅ | ✅ |
| Trabajadores | ✅ | ✅ |
| Inventario | ✅ | ✅ |
| Empaque | ✅ | ✅ |
| Usuarios (user management) | ✅ | ❌ |
| Ventas | ✅ | ❌ |
| Configuración | ✅ | ❌ |
| Subscription management | ✅ | ❌ |

---

## 16. Database Migrations

Migrations are in `prisma/migrations/`:
- `0_init/migration.sql` — Initial schema
- `1_add_invitations/migration.sql` — Invitation system

Seed file: `prisma/seed.mjs` (run via `node`, not TypeScript).

---

## 17. Landing Page

The public landing page (`src/app/page.tsx`) renders 7 sections in order:

```tsx
<Navbar /> → <Hero /> → <Introduction /> → <Features /> → <WhySeedor /> → <HighlightedFeatures /> → <CTA /> → <Footer />
```

All components are in `src/components/landing/` with barrel export from `index.ts`. They use custom scroll animation hooks (`useScrollAnimation`, `useStaggeredAnimation`, `useParallax`) for entrance effects.

---

## 18. Adding a New Module (Checklist)

When implementing a new module (e.g., Maquinaria):

1. **Schema**: Add Prisma models to `prisma/schema.prisma`, add relations to `Tenant`
2. **Migration**: `npm run prisma:migrate`
3. **Types**: Create `src/app/dashboard/[module]/types.ts` with serialized interfaces
4. **Page**: Create `src/app/dashboard/[module]/page.tsx` (server component, `requireRole`, Promise.all queries, serialize, render client)
5. **Client**: Create `src/app/dashboard/[module]/[Module]PageClient.tsx` (`'use client'`, receive props, UI)
6. **Actions**: Create `src/app/dashboard/[module]/actions.ts` (`'use server'`, auth, validate, mutate, revalidatePath)
7. **Modals**: Create `Create*Modal.tsx` / `Edit*Modal.tsx` (useTransition, FormData, call actions)
8. **Error boundary**: Optionally add `error.tsx`
9. **Tests**: Add `src/__tests__/[module]-actions.test.ts` (mock auth/prisma/revalidatePath, test validation + P2002 + happy path)
10. **Sidebar**: Module is already in `AppLayout.tsx` menu items — ensure the route matches
