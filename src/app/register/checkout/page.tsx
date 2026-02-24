'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RegistrationData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    companyName: string;
}

const MODULE_LABELS: Record<string, string> = {
    DASHBOARD: 'Dashboard',
    USERS: 'Usuarios',
    FIELD: 'Campo',
    INVENTORY: 'Inventario',
    WORKERS: 'Trabajadores',
    MACHINERY: 'Maquinaria',
    PACKAGING: 'Empaque',
    SALES: 'Ventas',
};

const BASE_PRICE_USD = 200;
const MODULE_PRICE_USD = 20;

export default function CheckoutPage() {
    const router = useRouter();
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'idle' | 'registering' | 'subscribing' | 'redirecting'>('idle');
    const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [payerEmail, setPayerEmail] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);

        const storedReg = sessionStorage.getItem('registrationData');
        const storedModules = sessionStorage.getItem('selectedModules');

        if (storedReg) {
            const data = JSON.parse(storedReg) as RegistrationData;
            setRegistrationData(data);
            setPayerEmail(data.email);
        } else {
            router.push('/register');
            return;
        }

        if (storedModules) {
            setSelectedModules(JSON.parse(storedModules) as string[]);
        }

        return () => clearTimeout(timer);
    }, [router]);

    const mandatoryModuleCount = 5; // DASHBOARD, USERS, FIELD, INVENTORY, WORKERS
    const optionalModuleCount = selectedModules.length;
    const optionalTotal = optionalModuleCount * MODULE_PRICE_USD;
    const totalUsd = BASE_PRICE_USD + optionalTotal;

    const handleSubmit = async () => {
        if (!registrationData) return;

        setError(null);
        setIsSubmitting(true);

        try {
            // ── Step 1: Register the account ──
            setStep('registering');
            const regResponse = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...registrationData,
                    selectedModules,
                }),
            });

            const regData = (await regResponse.json()) as { error?: string; tenantSlug?: string };

            if (!regResponse.ok) {
                setError(regData.error || 'No se pudo completar el registro.');
                setStep('idle');
                setIsSubmitting(false);
                return;
            }

            // ── Step 2: Create subscription in Mercado Pago ──
            setStep('subscribing');
            const subResponse = await fetch('/api/subscriptions/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payerEmail,
                    backUrl: '/register/success',
                }),
            });

            const subData = (await subResponse.json()) as {
                success?: boolean;
                initPoint?: string;
                error?: string;
            };

            if (!subResponse.ok || !subData.initPoint) {
                // Account was created but subscription failed — redirect to success
                // The user can subscribe later from settings
                console.error('[Checkout] Subscription creation failed:', subData.error);
                sessionStorage.removeItem('registrationData');
                sessionStorage.removeItem('selectedModules');
                sessionStorage.setItem(
                    'registrationSuccess',
                    JSON.stringify({
                        companyName: registrationData.companyName,
                        selectedModules,
                        subscriptionError: subData.error || 'No se pudo crear la suscripción.',
                    })
                );
                router.push('/register/success');
                return;
            }

            // ── Step 3: Redirect to Mercado Pago ──
            setStep('redirecting');
            sessionStorage.removeItem('registrationData');
            sessionStorage.removeItem('selectedModules');
            sessionStorage.setItem(
                'registrationSuccess',
                JSON.stringify({
                    companyName: registrationData.companyName,
                    selectedModules,
                })
            );

            window.location.href = subData.initPoint;
        } catch {
            setError('Ocurrió un error inesperado. Intentá de nuevo.');
            setStep('idle');
            setIsSubmitting(false);
        }
    };

    if (!registrationData) {
        return null;
    }

    const stepLabel =
        step === 'registering'
            ? 'Creando tu cuenta...'
            : step === 'subscribing'
                ? 'Configurando suscripción...'
                : step === 'redirecting'
                    ? 'Redirigiendo a Mercado Pago...'
                    : 'Suscribirme con Mercado Pago';

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4E8]">
            {/* Header */}
            <header className="w-full px-6 py-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        href="/"
                        className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
                    >
                        <Image
                            src="/images/logos/seedor-logo-no-bg.png"
                            alt="Seedor"
                            width={120}
                            height={32}
                            className="h-8 w-auto"
                            priority
                        />
                    </Link>
                    <div
                        className={`text-sm text-[#0A0908]/60 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
                        style={{ transitionDelay: '100ms' }}
                    >
                        Paso 3 de 3
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="px-6 py-8 md:py-12">
                <div className="max-w-2xl mx-auto">
                    {/* Title */}
                    <div className="text-center mb-10">
                        <h1
                            className={`text-3xl md:text-4xl font-bold text-[#0A0908] mb-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: '150ms' }}
                        >
                            Resumen y pago
                        </h1>
                        <p
                            className={`text-lg text-[#0A0908]/60 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: '200ms' }}
                        >
                            Revisá tu plan antes de continuar
                        </p>
                    </div>

                    {/* Company Card */}
                    <div
                        className={`bg-white rounded-2xl border border-black/10 p-6 mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '250ms' }}
                    >
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-full bg-[#73AC01]/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-[#73AC01]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-[#0A0908]">{registrationData.companyName}</p>
                                <p className="text-sm text-[#0A0908]/50">{registrationData.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div
                        className={`bg-white rounded-2xl border border-black/10 p-6 mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '300ms' }}
                    >
                        <h2 className="font-semibold text-[#0A0908] mb-4">Detalle del plan</h2>

                        <div className="space-y-3">
                            {/* Base plan */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-[#0A0908]">Plan base</p>
                                    <p className="text-xs text-[#0A0908]/50">
                                        {mandatoryModuleCount} módulos incluidos (Dashboard, Usuarios, Campo, Inventario, Trabajadores)
                                    </p>
                                </div>
                                <span className="text-sm font-semibold text-[#0A0908] whitespace-nowrap">USD ${BASE_PRICE_USD}</span>
                            </div>

                            {/* Optional modules */}
                            {selectedModules.map((moduleKey) => (
                                <div key={moduleKey} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#73AC01]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <p className="text-sm font-medium text-[#0A0908]">
                                            {MODULE_LABELS[moduleKey] || moduleKey}
                                        </p>
                                    </div>
                                    <span className="text-sm text-[#0A0908]/70 whitespace-nowrap">+ USD ${MODULE_PRICE_USD}</span>
                                </div>
                            ))}

                            {selectedModules.length === 0 && (
                                <p className="text-sm text-[#0A0908]/40 italic">
                                    Sin módulos opcionales seleccionados
                                </p>
                            )}

                            {/* Divider */}
                            <div className="border-t border-black/10 pt-3 mt-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-base font-bold text-[#0A0908]">Total mensual</p>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-[#73AC01]">USD ${totalUsd}</span>
                                        <span className="text-sm text-[#0A0908]/50 ml-1">/mes</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="mt-4 text-xs text-[#0A0908]/40">
                            El cobro se realizará en pesos argentinos (ARS) al tipo de cambio oficial vigente al momento del pago.
                        </p>
                    </div>

                    {/* Payer Email */}
                    <div
                        className={`bg-white rounded-2xl border border-black/10 p-6 mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '350ms' }}
                    >
                        <label htmlFor="payerEmail" className="block text-sm font-semibold text-[#0A0908] mb-2">
                            Email para la facturación
                        </label>
                        <p className="text-xs text-[#0A0908]/50 mb-3">
                            Este email se usará para los cargos recurrentes en Mercado Pago
                        </p>
                        <input
                            id="payerEmail"
                            type="email"
                            required
                            value={payerEmail}
                            onChange={(e) => setPayerEmail(e.target.value)}
                            className="w-full rounded-xl border border-black/15 px-4 py-3 text-sm text-[#0A0908] placeholder-[#0A0908]/30 outline-none focus:border-[#73AC01] focus:ring-2 focus:ring-[#73AC01]/20 transition-all"
                            placeholder="tu@email.com"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm"
                        >
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div
                        className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '400ms' }}
                    >
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !payerEmail}
                            className="w-full inline-flex items-center justify-center gap-3 bg-[#009ee3] text-white font-semibold px-8 py-4 rounded-xl shadow-[0_4px_14px_0_rgba(0,158,227,0.35)] hover:bg-[#007eb5] hover:shadow-[0_6px_20px_rgba(0,158,227,0.45)] hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    {stepLabel}
                                </>
                            ) : (
                                <>
                                    {/* Mercado Pago icon */}
                                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.8 14.4c-.3.3-.7.4-1.1.3-.4-.1-.7-.4-.8-.8l-1.4-4.2c-.1-.2-.3-.4-.5-.4s-.4.2-.5.4l-1.4 4.2c-.1.4-.4.7-.8.8-.4.1-.8 0-1.1-.3L6.8 13c-.3-.3-.3-.8 0-1.1.3-.3.8-.3 1.1 0l1.8 1.8 1.1-3.3c.2-.7.9-1.1 1.6-1.1s1.4.4 1.6 1.1l1.1 3.3 1.8-1.8c.3-.3.8-.3 1.1 0 .3.3.3.8 0 1.1l-2.2 2.4z" />
                                    </svg>
                                    {stepLabel}
                                </>
                            )}
                        </button>

                        {/* Security note */}
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#0A0908]/40">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Pago procesado de forma segura por Mercado Pago. Podés cancelar en cualquier momento.
                        </div>
                    </div>

                    {/* Modules note */}
                    <p
                        className={`mt-4 text-xs text-center text-[#0A0908]/50 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '450ms' }}
                    >
                        Podés agregar o quitar módulos en cualquier momento desde tu configuración
                    </p>

                    {/* Back Link */}
                    <div
                        className={`mt-6 text-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '500ms' }}
                    >
                        <button
                            onClick={() => router.back()}
                            disabled={isSubmitting}
                            className="text-sm text-[#0A0908]/60 hover:text-[#73AC01] disabled:opacity-40 transition-colors"
                        >
                            ← Volver al paso anterior
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
