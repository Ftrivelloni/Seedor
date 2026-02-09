'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface RegistrationSuccess {
    companyName: string;
    selectedModules: string[];
}

const MODULE_NAMES: Record<string, string> = {
    MACHINERY: 'Maquinaria',
    PACKAGING: 'Empaque',
    SALES: 'Ventas',
};

function SuccessContent() {
    const searchParams = useSearchParams();
    const stripeSessionId = searchParams.get('session_id');

    const [isLoaded, setIsLoaded] = useState(false);
    const [successData, setSuccessData] = useState<RegistrationSuccess | null>(null);
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
        stripeSessionId ? 'loading' : 'success'
    );
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);

        if (stripeSessionId) {
            // Paid registration — verify payment and create account
            completeRegistrationWithPayment(stripeSessionId);
        } else {
            // Free registration — account already created on select-plan
            const storedData = sessionStorage.getItem('registrationSuccess');
            if (storedData) {
                setSuccessData(JSON.parse(storedData) as RegistrationSuccess);
                sessionStorage.removeItem('registrationSuccess');
            }
        }

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function completeRegistrationWithPayment(sessionId: string) {
        try {
            const rawRegistration = sessionStorage.getItem('registrationData');
            const rawModules = sessionStorage.getItem('pendingModules');

            if (!rawRegistration) {
                setStatus('error');
                setErrorMsg(
                    'No se encontraron los datos de registro. Por favor, iniciá el proceso nuevamente desde la página de registro.'
                );
                return;
            }

            const registrationData = JSON.parse(rawRegistration);
            const selectedModules: string[] = rawModules ? JSON.parse(rawModules) : [];

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...registrationData,
                    selectedModules,
                    stripeSessionId: sessionId,
                }),
            });

            const data = (await response.json()) as { error?: string; ok?: boolean };

            if (!response.ok) {
                setStatus('error');
                setErrorMsg(data.error || 'No se pudo completar el registro.');
                return;
            }

            // Clean up sessionStorage
            sessionStorage.removeItem('registrationData');
            sessionStorage.removeItem('pendingModules');

            setSuccessData({
                companyName: registrationData.companyName,
                selectedModules,
            });
            setStatus('success');
        } catch {
            setStatus('error');
            setErrorMsg('Error inesperado al completar el registro. Por favor, contactá a soporte.');
        }
    }

    // Loading state while verifying payment
    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4E8] flex flex-col">
                <header className="w-full px-6 py-6">
                    <div className="max-w-4xl mx-auto">
                        <Link href="/" className="inline-block">
                            <Image
                                src="/images/logos/seedor-logo-no-bg.png"
                                alt="Seedor"
                                width={120}
                                height={32}
                                className="h-8 w-auto"
                                priority
                            />
                        </Link>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center px-6 py-12">
                    <div className="max-w-lg text-center">
                        <div className="mb-8">
                            <div className="w-24 h-24 mx-auto bg-[#73AC01]/10 rounded-full flex items-center justify-center">
                                <svg className="animate-spin h-12 w-12 text-[#73AC01]" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-[#0A0908] mb-4">
                            Verificando tu pago...
                        </h1>
                        <p className="text-[#0A0908]/60">
                            Estamos confirmando tu pago y creando tu cuenta. Esto solo tomará un momento.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    // Error state
    if (status === 'error') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4E8] flex flex-col">
                <header className="w-full px-6 py-6">
                    <div className="max-w-4xl mx-auto">
                        <Link href="/" className="inline-block">
                            <Image
                                src="/images/logos/seedor-logo-no-bg.png"
                                alt="Seedor"
                                width={120}
                                height={32}
                                className="h-8 w-auto"
                                priority
                            />
                        </Link>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center px-6 py-12">
                    <div className="max-w-lg text-center">
                        <div className="mb-8">
                            <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-[#0A0908] mb-4">
                            Hubo un problema
                        </h1>
                        <p className="text-[#0A0908]/60 mb-6">
                            {errorMsg || 'No se pudo completar el registro.'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center gap-2 bg-[#73AC01] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#5C8A01] transition-all duration-300"
                            >
                                Intentar de nuevo
                            </Link>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 border border-black/10 text-[#0A0908] font-semibold px-6 py-3 rounded-xl hover:bg-black/5 transition-all duration-300"
                            >
                                Volver al inicio
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Success state
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4E8] flex flex-col">
            {/* Header */}
            <header className="w-full px-6 py-6">
                <div className="max-w-4xl mx-auto">
                    <Link
                        href="/"
                        className={`inline-block transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
                    >
                        <Image
                            src="/images/logos/seedor-logo-fondoblanco.png"
                            alt="Seedor"
                            width={120}
                            height={32}
                            className="h-8 w-auto"
                            priority
                        />
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="max-w-lg text-center">
                    {/* Success Icon */}
                    <div
                        className={`mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                        style={{ transitionDelay: '100ms' }}
                    >
                        <div className="w-24 h-24 mx-auto bg-[#73AC01] rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(115,172,1,0.3)]">
                            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h1
                        className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A0908] mb-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '200ms' }}
                    >
                        ¡Bienvenido a Seedor!
                    </h1>

                    {/* Subtitle */}
                    <p
                        className={`text-lg text-[#0A0908]/60 mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '300ms' }}
                    >
                        {successData?.companyName ? (
                            <>
                                Tu cuenta para <span className="font-semibold text-[#73AC01]">{successData.companyName}</span> ha sido creada exitosamente.
                            </>
                        ) : (
                            'Tu cuenta ha sido creada exitosamente.'
                        )}
                    </p>

                    {/* Payment Confirmation Badge (shown for paid registrations) */}
                    {stripeSessionId && (
                        <div
                            className={`mb-6 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: '320ms' }}
                        >
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-sm font-medium text-emerald-700">Pago confirmado</span>
                        </div>
                    )}

                    {/* Selected Modules Summary */}
                    {successData?.selectedModules && successData.selectedModules.length > 0 && (
                        <div
                            className={`mb-8 p-4 bg-white rounded-xl border border-[#73AC01]/20 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: '350ms' }}
                        >
                            <p className="text-sm text-[#0A0908]/60 mb-2">Módulos opcionales activados:</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {successData.selectedModules.map((moduleKey) => (
                                    <span
                                        key={moduleKey}
                                        className="inline-flex items-center gap-1 text-sm text-[#73AC01] bg-[#73AC01]/10 px-3 py-1 rounded-full"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {MODULE_NAMES[moduleKey] || moduleKey}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dashboard Button */}
                    <div
                        className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '400ms' }}
                    >
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 bg-[#73AC01] text-white font-semibold px-8 py-4 rounded-xl shadow-[0_4px_14px_0_rgba(115,172,1,0.39)] hover:bg-[#5C8A01] hover:shadow-[0_6px_20px_rgba(115,172,1,0.5)] hover:scale-[1.02] transition-all duration-300"
                        >
                            Ir al Dashboard
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                    {/* Back to Home */}
                    <p
                        className={`mt-6 text-sm text-[#0A0908]/50 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '500ms' }}
                    >
                        O volver a la{' '}
                        <Link href="/" className="text-[#73AC01] hover:underline">
                            página principal
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}

export default function RegistrationSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4E8] flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-4 border-[#73AC01] border-t-transparent rounded-full" />
                </div>
            }
        >
            <SuccessContent />
        </Suspense>
    );
}
