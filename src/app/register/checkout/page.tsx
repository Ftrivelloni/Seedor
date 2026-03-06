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

// ⚠️ PRUEBA DE PRODUCCIÓN: Precios simbólicos ($1 USD base + $0 módulos)
const BASE_PRICE_USD = 1;
const MODULE_PRICE_MONTHLY_USD = 0;
const MODULE_PRICE_YEARLY_USD = 0;

type PlanInterval = 'MONTHLY' | 'ANNUAL';

export default function CheckoutPage() {
    const router = useRouter();
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'idle' | 'subscribing' | 'redirecting'>('idle');
    const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [payerEmail, setPayerEmail] = useState('');
    const [planInterval, setPlanInterval] = useState<PlanInterval>('MONTHLY');

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
    const isYearly = planInterval === 'ANNUAL';
    const modulePricePerMonth = isYearly ? MODULE_PRICE_YEARLY_USD : MODULE_PRICE_MONTHLY_USD;
    const totalPerMonth = BASE_PRICE_USD + modulePricePerMonth * optionalModuleCount;
    const multiplier = isYearly ? 12 : 1;
    const totalUsd = totalPerMonth * multiplier;
    // Savings calculation
    const monthlyEquivalent = BASE_PRICE_USD + MODULE_PRICE_MONTHLY_USD * optionalModuleCount;
    const yearlySavings = isYearly ? (monthlyEquivalent * 12) - totalUsd : 0;

    const handleSubmit = async () => {
        if (!registrationData) return;

        // Validar que el email de pago coincida con el de registro
        if (payerEmail !== registrationData.email) {
            setError('Por seguridad, el email de facturación debe coincidir con el email de registro.');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            // ── Atomic registration: Create subscription in MP FIRST, then account ──
            setStep('subscribing');
            const response = await fetch('/api/auth/register-with-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...registrationData,
                    selectedModules,
                    planInterval,
                    payerEmail,
                }),
            });

            const data = (await response.json()) as {
                success?: boolean;
                initPoint?: string;
                error?: string;
                tenantSlug?: string;
            };

            if (!response.ok || !data.initPoint) {
                setError(data.error || 'No se pudo completar el registro. Por favor, intentá nuevamente.');
                setStep('idle');
                setIsSubmitting(false);
                return;
            }

            // ── Redirect to Mercado Pago to complete payment ──
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

            window.location.href = data.initPoint;
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
        step === 'subscribing'
            ? 'Creando tu cuenta y suscripción...'
            : step === 'redirecting'
                ? 'Redirigiendo a Mercado Pago...'
                : 'Suscribirse con Mercado Pago';

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4E8]">
            {/* Header */}
            <header className="w-full px-6 py-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                        className={`inline-flex items-center gap-2 text-sm text-[#0A0908]/70 hover:text-[#73AC01] disabled:opacity-40 transition-all duration-300 font-medium ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver al paso anterior
                    </button>
                    <Link
                        href="/"
                        className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
                        style={{ transitionDelay: '50ms' }}
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
                <div className="max-w-3xl mx-auto">
                    {/* Title */}
                    <div className="text-center mb-12">
                        <h1
                            className={`text-3xl md:text-4xl font-bold text-[#0A0908] mb-3 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: '150ms' }}
                        >
                            Resumen y pago
                        </h1>
                        <p
                            className={`text-base text-[#0A0908]/60 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: '200ms' }}
                        >
                            Revisá tu plan antes de continuar
                        </p>
                    </div>

                    {/* Company Card */}
                    <div
                        className={`bg-white rounded-2xl border border-black/10 shadow-sm hover:shadow-md transition-all duration-300 p-6 mb-5 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '250ms' }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#73AC01] to-[#5C8A01] flex items-center justify-center flex-shrink-0 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-[#0A0908] text-lg">{registrationData.companyName}</p>
                                <p className="text-sm text-[#0A0908]/60">{registrationData.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Plan Interval Selector */}
                    <div
                        className={`bg-white rounded-2xl border border-black/10 shadow-sm hover:shadow-md transition-all duration-300 p-6 mb-5 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '280ms' }}
                    >
                        <h2 className="text-base font-bold text-[#0A0908] mb-4">Frecuencia de pago</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPlanInterval('MONTHLY')}
                                className={`relative py-4 px-5 rounded-xl font-semibold transition-all duration-200 ${
                                    planInterval === 'MONTHLY'
                                        ? 'bg-gradient-to-br from-[#73AC01] to-[#5C8A01] text-white shadow-lg shadow-[#73AC01]/30 scale-105'
                                        : 'bg-gray-50 text-[#0A0908]/70 border-2 border-transparent hover:border-[#73AC01]/20 hover:bg-gray-100'
                                }`}
                            >
                                <span className="block text-sm">Mensual</span>
                                {planInterval === 'MONTHLY' && (
                                    <svg className="w-5 h-5 absolute top-2 right-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPlanInterval('ANNUAL')}
                                className={`relative py-4 px-5 rounded-xl font-semibold transition-all duration-200 ${
                                    planInterval === 'ANNUAL'
                                        ? 'bg-gradient-to-br from-[#73AC01] to-[#5C8A01] text-white shadow-lg shadow-[#73AC01]/30 scale-105'
                                        : 'bg-gray-50 text-[#0A0908]/70 border-2 border-transparent hover:border-[#73AC01]/20 hover:bg-gray-100'
                                }`}
                            >
                                <span className="block text-sm">Anual</span>
                                <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    planInterval === 'ANNUAL' ? 'bg-white/25 text-white' : 'bg-[#73AC01] text-white'
                                }`}>
                                    Ahorrá
                                </span>
                                {planInterval === 'ANNUAL' && (
                                    <svg className="w-5 h-5 absolute bottom-2 right-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {isYearly && yearlySavings > 0 && (
                            <div className="mt-4 rounded-xl bg-gradient-to-r from-[#73AC01]/10 to-[#73AC01]/5 border border-[#73AC01]/20 px-4 py-3">
                                <div className="flex items-start gap-2">
                                    <span className="text-xl flex-shrink-0">🎉</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-[#73AC01] mb-0.5">Ahorrás USD ${yearlySavings} al año</p>
                                        <p className="text-xs text-[#0A0908]/60">USD ${MODULE_PRICE_MONTHLY_USD - MODULE_PRICE_YEARLY_USD} menos por módulo opcional al mes</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing Breakdown */}
                    <div
                        className={`bg-white rounded-2xl border border-black/10 shadow-sm hover:shadow-md transition-all duration-300 p-6 mb-5 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '300ms' }}
                    >
                        <h2 className="text-base font-bold text-[#0A0908] mb-5">Detalle del plan</h2>

                        <div className="space-y-4">
                            {/* Base plan */}
                            <div className="flex items-start justify-between gap-4 pb-4">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-[#0A0908] mb-1">Plan base</p>
                                    <p className="text-xs text-[#0A0908]/60 leading-relaxed">
                                        {mandatoryModuleCount} módulos incluidos (Dashboard, Usuarios, Campo, Inventario, Trabajadores)
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-base font-bold text-[#0A0908]">
                                        USD ${BASE_PRICE_USD}
                                    </p>
                                    <p className="text-xs text-[#0A0908]/50">/mes</p>
                                </div>
                            </div>

                            {/* Optional modules */}
                            {selectedModules.length > 0 && (
                                <div className="border-t border-gray-100 pt-4 space-y-3">
                                    {selectedModules.map((moduleKey) => (
                                        <div key={moduleKey} className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-8 h-8 rounded-lg bg-[#73AC01]/10 flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-4 h-4 text-[#73AC01]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-medium text-[#0A0908]">
                                                    {MODULE_LABELS[moduleKey] || moduleKey}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-semibold text-[#73AC01]">
                                                    USD ${modulePricePerMonth}
                                                </p>
                                                <p className="text-xs text-[#0A0908]/50">/mes</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedModules.length === 0 && (
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-sm text-[#0A0908]/40 italic text-center py-2">
                                        Sin módulos opcionales seleccionados
                                    </p>
                                </div>
                            )}

                            {/* Total */}
                            <div className="border-t-2 border-gray-200 pt-4 mt-4">
                                <div className="flex items-center justify-between gap-4 mb-2">
                                    <p className="text-base font-bold text-[#0A0908]">
                                        {isYearly ? 'Total anual' : 'Total mensual'}
                                    </p>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-[#73AC01]">
                                            ${totalUsd}
                                        </p>
                                        <p className="text-xs text-[#0A0908]/60 font-medium">
                                            USD {isYearly ? '/año' : '/mes'}
                                        </p>
                                    </div>
                                </div>
                                {isYearly && (
                                    <p className="text-xs text-[#0A0908]/50 text-right mt-1">
                                        Equivale a USD ${totalPerMonth}/mes
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
                            <p className="text-xs text-[#0A0908]/50 leading-relaxed">
                                💵 El cobro se realizará en pesos argentinos (ARS) al tipo de cambio oficial vigente al momento del pago.
                            </p>

                            {/* Payment frequency notice for annual plans */}
                            {isYearly && (
                                <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 px-4 py-3">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-xs text-green-900/90 leading-relaxed">
                                            <strong className="font-semibold">Plan Anual:</strong> El cobro se realizará mensualmente durante 12 meses al precio con descuento (USD ${totalPerMonth}/mes). No es un cargo único anual.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Legal notice */}
                            <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 px-4 py-3">
                                <div className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs text-amber-900/90 leading-relaxed">
                                        <strong className="font-semibold">Nota:</strong> Los cambios de plan o desactivación de módulos se aplicarán al finalizar el periodo actual. No se realizan reembolsos prorrateados por módulos desactivados antes del cierre del ciclo de facturación.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payer Email */}
                    <div
                        className={`bg-white rounded-2xl border border-black/10 shadow-sm hover:shadow-md transition-all duration-300 p-6 mb-6 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '350ms' }}
                    >
                        <label htmlFor="payerEmail" className="block text-sm font-bold text-[#0A0908] mb-2">
                            Email para la facturación
                        </label>
                        
                        {/* Email matching warning */}
                        <div className="mb-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 px-4 py-3">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-amber-900/90 leading-relaxed">
                                    <strong className="font-semibold">Atención:</strong> Por seguridad y sincronización de facturación, el email de registro debe coincidir con el email de tu cuenta de Mercado Pago.
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-[#0A0908]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                id="payerEmail"
                                type="email"
                                required
                                value={payerEmail}
                                onChange={(e) => setPayerEmail(e.target.value)}
                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 text-sm text-[#0A0908] placeholder-[#0A0908]/40 outline-none focus:border-[#73AC01] focus:ring-4 focus:ring-[#73AC01]/10 transition-all ${
                                    payerEmail && payerEmail !== registrationData?.email
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-200'
                                }`}
                                placeholder={registrationData?.email || 'tu@email.com'}
                            />
                        </div>
                        
                        {payerEmail && payerEmail !== registrationData?.email && (
                            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                El email debe coincidir con tu email de registro: {registrationData?.email}
                            </p>
                        )}
                    </div>
                    {/* Error */}
                    {error && (
                        <div className="mb-6 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 px-5 py-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-800 mb-0.5">Error al procesar la solicitud</p>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div
                        className={`space-y-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '400ms' }}
                    >
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !payerEmail}
                            className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#009ee3] to-[#0088cc] text-white font-bold px-8 py-5 rounded-xl shadow-lg shadow-[#009ee3]/40 hover:shadow-xl hover:shadow-[#009ee3]/50 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-md transition-all duration-300 text-base"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>{stepLabel}</span>
                                </>
                            ) : (
                                <span>{stepLabel}</span>
                            )}
                        </button>

                        {/* Security note */}
                        <div className="flex items-center justify-center gap-2 text-xs text-[#0A0908]/50">
                            <svg className="w-4 h-4 text-[#73AC01]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Pago procesado de forma segura por Mercado Pago</span>
                        </div>
                    </div>

                    {/* Modules note */}
                    <p
                        className={`mt-5 text-xs text-center text-[#0A0908]/60 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '450ms' }}
                    >
                        Podés agregar o quitar módulos en cualquier momento desde tu configuración
                    </p>
                </div>
            </main>
        </div>
    );
}
