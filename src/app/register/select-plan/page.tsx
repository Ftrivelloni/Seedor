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

interface Module {
    key: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    mandatory: boolean;
}

const MODULES: Module[] = [
    {
        key: 'DASHBOARD',
        name: 'Dashboard',
        description: 'Panel de control con métricas y resumen general',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
        ),
        mandatory: true,
    },
    {
        key: 'USERS',
        name: 'Usuarios',
        description: 'Gestión de usuarios y permisos',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        mandatory: true,
    },
    {
        key: 'FIELD',
        name: 'Campo',
        description: 'Gestión de campos, lotes y tareas agrícolas',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        mandatory: true,
    },
    {
        key: 'INVENTORY',
        name: 'Inventario',
        description: 'Control de stock y materiales',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
        mandatory: true,
    },
    {
        key: 'WORKERS',
        name: 'Trabajadores',
        description: 'Gestión de personal y asistencia',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        mandatory: true,
    },
    {
        key: 'MACHINERY',
        name: 'Maquinaria',
        description: 'Seguimiento de equipos y mantenimiento',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        mandatory: false,
    },
    {
        key: 'PACKAGING',
        name: 'Empaque',
        description: 'Control de líneas de empaque y producción',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
        ),
        mandatory: false,
    },
    {
        key: 'SALES',
        name: 'Ventas',
        description: 'Gestión de clientes y pedidos',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        mandatory: false,
    },
];

const PRICE_PER_MODULE = 20;

export default function SelectModulesPage() {
    const router = useRouter();
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);

        // Load registration data from sessionStorage
        const storedData = sessionStorage.getItem('registrationData');
        if (storedData) {
            setRegistrationData(JSON.parse(storedData) as RegistrationData);
        } else {
            // If no data, redirect back to registration
            router.push('/register');
        }

        return () => clearTimeout(timer);
    }, [router]);

    const mandatoryModules = MODULES.filter((m) => m.mandatory);
    const optionalModules = MODULES.filter((m) => !m.mandatory);
    const totalPrice = selectedModules.length * PRICE_PER_MODULE;

    const toggleModule = (moduleKey: string) => {
        setSelectedModules((prev) =>
            prev.includes(moduleKey)
                ? prev.filter((m) => m !== moduleKey)
                : [...prev, moduleKey]
        );
    };

    const handleSubmit = async () => {
        if (!registrationData) return;

        setError(null);
        setIsSubmitting(true);

        try {
            if (selectedModules.length === 0) {
                // Free registration — no optional modules, no payment needed
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...registrationData,
                        selectedModules,
                    }),
                });

                const data = (await response.json()) as { error?: string; tenantSlug?: string };

                if (!response.ok) {
                    setError(data.error || 'No se pudo completar el registro.');
                    return;
                }

                // Clear session storage
                sessionStorage.removeItem('registrationData');

                // Store selected modules for success page
                sessionStorage.setItem('registrationSuccess', JSON.stringify({
                    companyName: registrationData.companyName,
                    selectedModules,
                }));

                router.push('/register/success');
            } else {
                // Paid registration — redirect to Stripe Checkout
                // Persist selected modules so the success page can read them after redirect
                sessionStorage.setItem('pendingModules', JSON.stringify(selectedModules));

                const response = await fetch('/api/stripe/create-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: registrationData.email,
                        companyName: registrationData.companyName,
                        selectedModules,
                    }),
                });

                const data = (await response.json()) as { error?: string; url?: string };

                if (!response.ok || !data.url) {
                    setError(data.error || 'No se pudo crear la sesión de pago.');
                    return;
                }

                // Redirect to Stripe hosted checkout
                window.location.href = data.url;
            }
        } catch {
            setError('No se pudo completar el registro. Intentá de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!registrationData) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4E8]">
            {/* Header */}
            <header className="w-full px-6 py-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
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
                        Paso 2 de {selectedModules.length > 0 ? '3' : '2'}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="px-6 py-8 md:py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Title */}
                    <div className="text-center mb-10">
                        <h1
                            className={`text-3xl md:text-4xl font-bold text-[#0A0908] mb-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: '150ms' }}
                        >
                            Elegí tus módulos
                        </h1>
                        <p
                            className={`text-lg text-[#0A0908]/60 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: '200ms' }}
                        >
                            Personalizá tu experiencia activando los módulos que necesites
                        </p>
                    </div>

                    {/* Mandatory Modules Section */}
                    <div
                        className={`mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '250ms' }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-lg font-semibold text-[#0A0908]">Módulos incluidos</h2>
                            <span className="text-xs font-medium text-[#73AC01] bg-[#73AC01]/10 px-2 py-1 rounded-full">
                                Sin costo adicional
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {mandatoryModules.map((module) => (
                                <div
                                    key={module.key}
                                    className="bg-white rounded-xl border border-[#73AC01]/30 p-4 flex flex-col items-center text-center"
                                >
                                    <div className="w-12 h-12 rounded-full bg-[#73AC01]/10 flex items-center justify-center text-[#73AC01] mb-2">
                                        {module.icon}
                                    </div>
                                    <span className="text-sm font-medium text-[#0A0908]">{module.name}</span>
                                    <svg className="w-4 h-4 text-[#73AC01] mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Optional Modules Section */}
                    <div
                        className={`mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '300ms' }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-lg font-semibold text-[#0A0908]">Módulos opcionales</h2>
                            <span className="text-xs font-medium text-[#0A0908]/60 bg-black/5 px-2 py-1 rounded-full">
                                USD ${PRICE_PER_MODULE} c/u
                            </span>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            {optionalModules.map((module) => {
                                const isSelected = selectedModules.includes(module.key);
                                return (
                                    <button
                                        key={module.key}
                                        type="button"
                                        onClick={() => toggleModule(module.key)}
                                        className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 ${isSelected
                                                ? 'border-[#73AC01] bg-[#73AC01]/5 shadow-[0_4px_14px_0_rgba(115,172,1,0.15)]'
                                                : 'border-black/10 bg-white hover:border-[#73AC01]/50 hover:shadow-md'
                                            }`}
                                    >
                                        {/* Selection indicator */}
                                        <div
                                            className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${isSelected ? 'border-[#73AC01] bg-[#73AC01]' : 'border-black/20'
                                                }`}
                                        >
                                            {isSelected && (
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>

                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isSelected ? 'bg-[#73AC01]/20 text-[#73AC01]' : 'bg-black/5 text-[#0A0908]/60'
                                            }`}>
                                            {module.icon}
                                        </div>
                                        <h3 className={`font-semibold mb-1 ${isSelected ? 'text-[#73AC01]' : 'text-[#0A0908]'}`}>
                                            {module.name}
                                        </h3>
                                        <p className="text-sm text-[#0A0908]/60">{module.description}</p>
                                        <div className="mt-3 flex items-center gap-1">
                                            <span className={`text-lg font-bold ${isSelected ? 'text-[#73AC01]' : 'text-[#0A0908]'}`}>
                                                +${PRICE_PER_MODULE}
                                            </span>
                                            <span className="text-xs text-[#0A0908]/50">/mes</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Summary and Submit */}
                    <div
                        className={`bg-white rounded-2xl border border-black/10 p-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '350ms' }}
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-[#0A0908]/60 mb-1">Costo mensual total</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-[#0A0908]">
                                        ${totalPrice}
                                    </span>
                                    <span className="text-[#0A0908]/60">/mes</span>
                                    {selectedModules.length > 0 && (
                                        <span className="text-sm text-[#0A0908]/50">
                                            ({selectedModules.length} módulo{selectedModules.length !== 1 ? 's' : ''} opcional{selectedModules.length !== 1 ? 'es' : ''})
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#73AC01] text-white font-semibold px-8 py-4 rounded-xl shadow-[0_4px_14px_0_rgba(115,172,1,0.39)] hover:bg-[#5C8A01] hover:shadow-[0_6px_20px_rgba(115,172,1,0.5)] hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Creando cuenta...
                                    </>
                                ) : (
                                    selectedModules.length > 0 ? (
                                        <>
                                            Continuar al pago
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </>
                                    ) : (
                                        <>
                                            Crear mi cuenta
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </>
                                    )
                                )}
                            </button>
                        </div>
                        <p className="mt-4 text-xs text-center text-[#0A0908]/50">
                            Podés agregar o quitar módulos en cualquier momento desde tu configuración
                        </p>
                    </div>

                    {/* Back Link */}
                    <div
                        className={`mt-6 text-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '400ms' }}
                    >
                        <button
                            onClick={() => router.back()}
                            className="text-sm text-[#0A0908]/60 hover:text-[#73AC01] transition-colors"
                        >
                            ← Volver al paso anterior
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
