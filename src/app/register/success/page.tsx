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
    const [isLoaded, setIsLoaded] = useState(false);
    const [successData, setSuccessData] = useState<RegistrationSuccess | null>(null);

    // Mercado Pago redirect params
    const mpStatus = searchParams.get('status') || searchParams.get('collection_status');
    const preapprovalId = searchParams.get('preapproval_id');

    const paymentApproved = mpStatus === 'authorized' || mpStatus === 'approved';
    const paymentPending = mpStatus === 'pending';
    const hasPaymentInfo = !!mpStatus;

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);

        // Load registration data from sessionStorage
        const storedData = sessionStorage.getItem('registrationSuccess');
        if (storedData) {
            setSuccessData(JSON.parse(storedData) as RegistrationSuccess);
            sessionStorage.removeItem('registrationSuccess');
        }

        return () => clearTimeout(timer);
    }, []);
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
                    {/* Icon */}
                    <div
                        className={`mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                        style={{ transitionDelay: '100ms' }}
                    >
                        <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(115,172,1,0.3)] bg-[#73AC01]">
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

                    {/* Payment Status Banner */}
                    {hasPaymentInfo && (
                        <div
                            className={`mb-6 rounded-xl border p-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${
                                paymentApproved
                                    ? 'border-green-200 bg-green-50'
                                    : paymentPending
                                        ? 'border-amber-200 bg-amber-50'
                                        : 'border-red-200 bg-red-50'
                            }`}
                            style={{ transitionDelay: '320ms' }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                {paymentApproved && (
                                    <>
                                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm font-medium text-green-700">Suscripción activada correctamente</span>
                                    </>
                                )}
                                {paymentPending && (
                                    <>
                                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm font-medium text-amber-700">Tu pago está pendiente de confirmación</span>
                                    </>
                                )}
                            </div>
                            {preapprovalId && paymentApproved && (
                                <p className="mt-2 text-xs text-center text-[#0A0908]/40">ID de suscripción: {preapprovalId}</p>
                            )}
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
