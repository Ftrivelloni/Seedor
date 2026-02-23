import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/constants';
import { createSessionToken } from '@/lib/auth/session-token';

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

// Optional modules that cost $20 each
const OPTIONAL_MODULES: ModuleKey[] = ['MACHINERY', 'PACKAGING', 'SALES'];

interface RegisterRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    companyName?: string;
    selectedModules?: ModuleKey[];
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

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as RegisterRequest;

        const firstName = body.firstName?.trim();
        const lastName = body.lastName?.trim();
        const email = body.email?.trim().toLowerCase();
        const phone = body.phone?.trim() || '';
        const password = body.password?.trim();
        const companyName = body.companyName?.trim();
        const selectedModules = body.selectedModules || [];

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !companyName) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios.' },
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

        // Generate unique slug for tenant
        let baseSlug = generateSlug(companyName);
        let slug = baseSlug;
        let slugCounter = 1;

        while (await prisma.tenant.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${slugCounter}`;
            slugCounter++;
        }

        // Create tenant, user, membership, and module settings in a transaction
        const result = await prisma.$transaction(async (tx: any) => {
            // Create tenant
            const tenant = await tx.tenant.create({
                data: {
                    name: companyName,
                    slug,
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

        // Create session token for auto-login
        const token = createSessionToken({
            userId: result.user.id,
            tenantId: result.tenant.id,
            role: result.user.role,
            exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
        });

        const response = NextResponse.json({
            ok: true,
            tenantSlug: result.tenant.slug,
        });

        // Set session cookie
        response.cookies.set({
            name: SESSION_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: SESSION_MAX_AGE_SECONDS,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'No se pudo completar el registro.' },
            { status: 500 }
        );
    }
}
