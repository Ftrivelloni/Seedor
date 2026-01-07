'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Plan {
    id: string;
    name: string;
    subtitle: string;
    price: number;
    originalPrice: number;
    users: number;
    campos: number;
    modules: string[];
    features: string[];
    popular?: boolean;
}

const plans: Plan[] = [
    {
        id: 'basico',
        name: 'Plan Básico',
        subtitle: 'Perfecto para campos pequeños',
        price: 49,
        originalPrice: 59,
        users: 10,
        campos: 5,
        modules: ['Campo', 'Empaque'],
        features: [
            'Hasta 10 usuarios',
            'Hasta 5 campos/fincas',
            'Gestión de campo',
            'Gestión de empaque',
            'Soporte por email',
            'Reportes básicos',
        ],
    },
    {
        id: 'profesional',
        name: 'Plan Profesional',
        subtitle: 'Para operaciones más grandes',
        price: 99,
        originalPrice: 129,
        users: 30,
        campos: 20,
        modules: ['Campo', 'Empaque', 'Finanzas'],
        features: [
            'Hasta 30 usuarios',
            'Hasta 20 campos/fincas',
            'Gestión de campo',
            'Gestión de empaque',
            'Módulo de finanzas',
            'Reportes avanzados',
            'Soporte prioritario',
            'Analytics detallados',
        ],
        popular: true,
    },
];

export default function SelectPlanPage() {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<string>('profesional');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleContinue = () => {
        // Here you would save the selected plan and continue to success page
        router.push('/register/success');
    };

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
                        Paso 2 de 2
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="px-6 py-8 md:py-12">
                <div className="max-w-5xl mx-auto">
                    {/* Title */}
                    <div className="text-center mb-10 md:mb-14">
                        <h1
                            className={`text-3xl md:text-4xl lg:text-5xl font-bold text-[#0A0908] mb-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: '150ms' }}
                        >
                            Elegí tu plan
                        </h1>
                        <p
                            className={`text-lg text-[#0A0908]/60 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: '200ms' }}
                        >
                            Podés cambiar de plan en cualquier momento
                        </p>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
                        {plans.map((plan, index) => (
                            <div
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative cursor-pointer transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                                style={{ transitionDelay: `${250 + index * 100}ms` }}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                        <span className="inline-flex items-center gap-1 bg-[#73AC01] text-white text-sm font-medium px-4 py-1 rounded-full shadow-lg">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Popular
                                        </span>
                                    </div>
                                )}

                                {/* Card */}
                                <div
                                    className={`relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 ${selectedPlan === plan.id
                                        ? 'border-[#73AC01] bg-white shadow-[0_8px_30px_rgba(115,172,1,0.15)]'
                                        : 'border-black/10 bg-white hover:border-[#73AC01]/50 hover:shadow-lg'
                                        } ${plan.popular ? 'md:scale-105' : ''}`}
                                >
                                    {/* Selection Indicator */}
                                    <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${selectedPlan === plan.id
                                        ? 'border-[#73AC01] bg-[#73AC01]'
                                        : 'border-black/20'
                                        }`}>
                                        {selectedPlan === plan.id && (
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Plan Name */}
                                    <h2 className={`text-2xl font-bold mb-1 ${plan.popular ? 'text-[#73AC01]' : 'text-[#0A0908]'}`}>
                                        {plan.name}
                                    </h2>
                                    <p className="text-sm text-[#0A0908]/60 mb-6">{plan.subtitle}</p>

                                    {/* Price */}
                                    <div className="mb-2">
                                        <span className={`text-4xl md:text-5xl font-bold ${plan.popular ? 'text-[#73AC01]' : 'text-[#0A0908]'}`}>
                                            ${plan.price}
                                        </span>
                                        <span className="text-lg text-[#0A0908]/60">/mes</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm text-[#0A0908]/40 line-through">${plan.originalPrice}</span>
                                        <span className="text-xs font-medium text-[#73AC01] bg-[#73AC01]/10 px-2 py-0.5 rounded">Oferta</span>
                                    </div>
                                    <p className="text-xs text-[#0A0908]/50 mb-6">Facturación mensual</p>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="bg-[#F8F9FA] rounded-xl p-4 text-center">
                                            <svg className="w-6 h-6 mx-auto mb-1 text-[#0A0908]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            <div className="text-xl font-bold text-[#0A0908]">{plan.users}</div>
                                            <div className="text-xs text-[#0A0908]/50">usuarios</div>
                                        </div>
                                        <div className="bg-[#F8F9FA] rounded-xl p-4 text-center">
                                            <svg className="w-6 h-6 mx-auto mb-1 text-[#0A0908]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <div className="text-xl font-bold text-[#0A0908]">{plan.campos}</div>
                                            <div className="text-xs text-[#0A0908]/50">campos</div>
                                        </div>
                                    </div>

                                    {/* Modules */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-[#0A0908] mb-3">Módulos incluidos:</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {plan.modules.map((module) => (
                                                <span
                                                    key={module}
                                                    className="inline-flex items-center gap-1 text-sm text-[#73AC01] bg-[#73AC01]/10 px-3 py-1 rounded-full border border-[#73AC01]/20"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    </svg>
                                                    {module}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-[#0A0908] mb-3">Características:</h3>
                                        <ul className="space-y-2">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-[#0A0908]/70">
                                                    <svg className="w-4 h-4 text-[#73AC01] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Continue Button */}
                    <div
                        className={`mt-10 md:mt-14 text-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '500ms' }}
                    >
                        <button
                            onClick={handleContinue}
                            className="inline-flex items-center gap-2 bg-[#73AC01] text-white font-semibold px-10 py-4 rounded-xl shadow-[0_4px_14px_0_rgba(115,172,1,0.39)] hover:bg-[#5C8A01] hover:shadow-[0_6px_20px_rgba(115,172,1,0.5)] hover:scale-[1.02] transition-all duration-300"
                        >
                            Continuar con {plans.find(p => p.id === selectedPlan)?.name}
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                        <p className="mt-4 text-sm text-[#0A0908]/50">
                            Prueba gratis por 14 días • Sin tarjeta de crédito
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
