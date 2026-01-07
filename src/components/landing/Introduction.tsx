'use client';

import Link from 'next/link';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const stats = [
    { value: '500+', label: 'Campos activos' },
    { value: '50K+', label: 'Hectáreas gestionadas' },
    { value: '99%', label: 'Tiempo de actividad' },
    { value: '24/7', label: 'Soporte técnico' },
];

export default function Introduction() {
    const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
    const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation({ threshold: 0.3 });

    return (
        <section className="py-16 md:py-20 lg:py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div
                    ref={headerRef}
                    className={`text-center mb-12 md:mb-16 scroll-animate-up ${headerVisible ? 'visible' : ''}`}
                >
                    <span className="inline-block px-4 py-1.5 bg-[#73AC01]/10 text-[#73AC01] text-xs md:text-sm font-medium rounded-full mb-4">
                        Solución completa
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A0908] mb-4">
                        Gestioná tu campo de manera inteligente
                    </h2>
                    <p className="text-sm md:text-base text-[#0A0908]/60 max-w-2xl mx-auto mb-8">
                        Centralizá tareas de campo, inventario, empaque y finanzas en una sola plataforma diseñada específicamente para operaciones agropecuarias modernas y eficientes.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 bg-[#73AC01] text-white text-sm md:text-base font-semibold rounded-full hover:bg-[#5C8A01] transition-all duration-300 shadow-[0_4px_14px_0_rgba(115,172,1,0.39)] hover:shadow-[0_6px_20px_rgba(115,172,1,0.5)] hover:scale-[1.02]"
                        >
                            Crear mi campo gratis
                        </Link>
                        <Link
                            href="/login"
                            className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 bg-white text-[#0A0908] text-sm md:text-base font-semibold rounded-full border border-black/10 hover:border-[#73AC01]/50 hover:bg-[#73AC01]/5 transition-all duration-300"
                        >
                            Iniciar sesión
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div
                    ref={statsRef}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
                >
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className={`bg-[#F8F9FA] p-6 md:p-8 rounded-[20px] md:rounded-[28px] border border-black/5 shadow-sm text-center group hover:shadow-lg hover:shadow-[#73AC01]/5 transition-all duration-500 scroll-animate-scale ${statsVisible ? 'visible' : ''}`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#73AC01] mb-2 group-hover:scale-105 transition-transform duration-300">
                                {stat.value}
                            </div>
                            <div className="text-xs sm:text-sm md:text-base text-[#0A0908]/60 font-medium">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
