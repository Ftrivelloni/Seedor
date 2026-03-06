import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { mpPreApproval } from '@/lib/mercadopago';
import { convertUsdToArs } from '@/lib/domain/subscription';
import { getUsdToArsRate } from '@/lib/utils/exchange-rate';

// Define ModuleKey type based on your schema
type ModuleKey = 'DASHBOARD' | 'USERS' | 'WORKERS' | 'FIELD' | 'INVENTORY' | 'MACHINERY' | 'PACKAGING' | 'SALES';

// Mandatory modules that are always enabled
const MANDATORY_MODULES: ModuleKey[] = [
    'DASHBOARD',
    'USERS',
    'WORKERS',
    'FIELD',
    'INVENTORY',
];

// Optional modules that cost extra
const OPTIONAL_MODULES: ModuleKey[] = ['MACHINERY', 'PACKAGING', 'SALES'];

// Valid plan intervals
type PlanIntervalValue = 'MONTHLY' | 'ANNUAL';

// Pricing constants (same as in the original system)
const BASE_PRICE_USD = 1; // Symbolic price for testing
const MODULE_PRICE_MONTHLY_USD = 0;
const MODULE_PRICE_YEARLY_USD = 0;

interface RegisterWithSubscriptionRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    companyName?: string;
    selectedModules?: ModuleKey[];
    planInterval?: PlanIntervalValue;
    payerEmail?: string;
}

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 50); // Limit length
}

/**
 * POST /api/auth/register-with-subscription
 *
 * Atomic registration flow: No account without payment.
 *
 * Flow:
 *   1. Validate that payerEmail matches registration email
 *   2. Create Mercado Pago subscription FIRST
 *   3. ONLY if MP confirms success, create Tenant and User in DB
 *   4. Return init_point for user to complete payment
 *
 * If MP fails, nothing is saved to DB and error is returned.
 */
export async function POST(request: Request) {
    try {
        const body = (await request.json()) as RegisterWithSubscriptionRequest;

        const firstName = body.firstName?.trim();
        const lastName = body.lastName?.trim();
        const email = body.email?.trim().toLowerCase();
        const phone = body.phone?.trim() || '';
        const password = body.password?.trim();
        const companyName = body.companyName?.trim();
        const selectedModules = body.selectedModules || [];
        const planInterval: PlanIntervalValue =
            body.planInterval === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY';
        const payerEmail = body.payerEmail?.trim().toLowerCase();

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !companyName || !payerEmail) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios.' },
                { status: 400 }
            );
        }

        // ── CRITICAL: Email must match for billing sync ──
        if (email !== payerEmail) {
            return NextResponse.json(
                { 
                    error: 'Por seguridad y sincronización de facturación, el email de registro debe coincidir exactamente con el email de tu cuenta de Mercado Pago.' 
                },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'El email no es válido.' },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 6 caracteres.' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Este email ya está registrado.' },
                { status: 409 }
            );
        }

        // Validate selected modules (only allow optional modules)
        const validOptionalModules = selectedModules.filter((m) =>
            OPTIONAL_MODULES.includes(m)
        );

        // ── Calculate pricing ──
        const isYearly = planInterval === 'ANNUAL';
        const modulePricePerMonth = isYearly ? MODULE_PRICE_YEARLY_USD : MODULE_PRICE_MONTHLY_USD;
        const totalPerMonth = BASE_PRICE_USD + modulePricePerMonth * validOptionalModules.length;
        
        // Get exchange rate
        const exchangeRate = await getUsdToArsRate();
        const totalArs = convertUsdToArs(totalPerMonth, exchangeRate);

        if (totalArs <= 0) {
            return NextResponse.json(
                { error: 'El monto calculado no es válido. Verificá la tasa de cambio.' },
                { status: 400 }
            );
        }

        // Generate unique slug for tenant
        let baseSlug = generateSlug(companyName);
        let slug = baseSlug;
        let slugCounter = 1;

        while (await prisma.tenant.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${slugCounter}`;
            slugCounter++;
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seedor.com.ar';
        const backUrl = `${appUrl}/register/success`;

        // ── Step 1: Create Mercado Pago Subscription FIRST ──
        let preapproval;
        try {
            const mpFrequency = isYearly ? 12 : 1;
            
            preapproval = await mpPreApproval.create({
                body: {
                    payer_email: payerEmail,
                    reason: `Suscripción Seedor ${isYearly ? 'Anual' : 'Mensual'} - ${companyName}`,
                    external_reference: slug, // Use slug as temp reference before tenant exists
                    auto_recurring: {
                        frequency: mpFrequency,
                        frequency_type: 'months',
                        transaction_amount: totalArs,
                        currency_id: 'ARS',
                    },
                    back_url: backUrl,
                },
            });
        } catch (mpErr: unknown) {
            console.error('[Register] Mercado Pago subscription creation failed:', mpErr);
            
            let message = 'Error desconocido al crear la suscripción.';
            if (mpErr instanceof Error) {
                message = mpErr.message;
            } else if (mpErr && typeof mpErr === 'object') {
                const err = mpErr as { message?: string };
                if (err.message) message = err.message;
            }

            return NextResponse.json(
                { error: `No se pudo crear la suscripción en Mercado Pago: ${message}. Por favor, intentá nuevamente.` },
                { status: 500 }
            );
        }

        // ── Step 2: ONLY if MP succeeds, create Tenant and User in DB ──
        if (!preapproval?.id || !preapproval?.init_point) {
            console.error('[Register] MP preapproval missing required fields');
            return NextResponse.json(
                { error: 'La suscripción se creó pero faltan datos. Por favor, contactá a soporte.' },
                { status: 500 }
            );
        }

        try {
            const result = await prisma.$transaction(async (tx) => {
                // Create tenant with ACTIVE status (because we already have a valid subscription)
                const tenant = await tx.tenant.create({
                    data: {
                        name: companyName,
                        slug,
                        planInterval,
                        subscriptionStatus: 'ACTIVE', // Default is ACTIVE now
                        mpPreapprovalId: preapproval.id,
                        mpPayerEmail: payerEmail,
                    },
                });

                // Create user with ADMIN role
                const user = await tx.user.create({
                    data: {
                        firstName,
                        lastName,
                        email,
                        phone,
                        passwordHash: hashPassword(password),
                        role: 'ADMIN',
                        status: 'ACTIVE',
                        lastAccessAt: new Date(),
                    },
                });

                // Create membership linking user to tenant
                await tx.tenantUserMembership.create({
                    data: {
                        tenantId: tenant.id,
                        userId: user.id,
                    },
                });

                // Create module settings - mandatory modules + selected optional
                const allModules = [...MANDATORY_MODULES, ...validOptionalModules];
                await tx.tenantModuleSetting.createMany({
                    data: allModules.map((module) => ({
                        tenantId: tenant.id,
                        module,
                        enabled: true,
                    })),
                });

                // Also create disabled entries for non-selected optional modules
                const disabledModules = OPTIONAL_MODULES.filter(
                    (m) => !validOptionalModules.includes(m)
                );
                if (disabledModules.length > 0) {
                    await tx.tenantModuleSetting.createMany({
                        data: disabledModules.map((module) => ({
                            tenantId: tenant.id,
                            module,
                            enabled: false,
                        })),
                    });
                }

                return { user, tenant };
            });

            // ── Step 3: Return init_point for user to complete payment ──
            return NextResponse.json({
                success: true,
                initPoint: preapproval.init_point,
                tenantSlug: result.tenant.slug,
                subscriptionId: preapproval.id,
            });
        } catch (dbErr) {
            console.error('[Register] Database transaction failed after MP success:', dbErr);
            
            // At this point, MP subscription exists but DB creation failed.
            // This is a critical state - we should try to cancel the MP subscription
            // to avoid orphaned subscriptions.
            if (preapproval?.id) {
                try {
                    await mpPreApproval.update({
                        id: preapproval.id,
                        body: {
                            status: 'cancelled',
                        } as any,
                    });
                } catch (cancelErr) {
                    console.error('[Register] Failed to cancel orphaned MP subscription:', cancelErr);
                }
            }

            return NextResponse.json(
                { error: 'Error al crear la cuenta. Por favor, intentá nuevamente.' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('[Register] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Ocurrió un error inesperado. Por favor, intentá nuevamente.' },
            { status: 500 }
        );
    }
}
