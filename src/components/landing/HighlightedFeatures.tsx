'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const characteristics = [
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        title: 'Automatización Inteligente',
        description: 'Automatizá tareas repetitivas y enfocate en lo que realmente importa.',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        title: 'Análisis Predictivo',
        description: 'Proyecciones y tendencias para tomar decisiones informadas.',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        title: 'Acceso en Tiempo Real',
        description: 'Sincronización instantánea en todos tus dispositivos.',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        title: 'Reportes Personalizados',
        description: 'Creá reportes a medida según tus necesidades específicas.',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: 'Cumplimiento Normativo',
        description: 'Mantené tu operación en línea con todas las regulaciones.',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        title: 'Soporte Premium',
        description: 'Equipo dedicado para ayudarte cuando lo necesites.',
    },
];

export default function HighlightedFeatures() {
    const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
    const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });

    return (
        <section id="highlighted-features" className="py-16 md:py-20 lg:py-24 bg-[#F8F9FA] overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div
                    ref={headerRef}
                    className={`text-center mb-12 md:mb-16 scroll-animate-up ${headerVisible ? 'visible' : ''}`}
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A0908] mb-4">
                        Características destacadas
                    </h2>
                    <p className="text-sm md:text-base text-[#0A0908]/60 max-w-xl mx-auto">
                        Herramientas avanzadas que transforman tu forma de trabajar
                    </p>
                </div>

                {/* Characteristics Grid */}
                <div
                    ref={gridRef}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                >
                    {characteristics.map((item, index) => (
                        <div
                            key={index}
                            className={`group p-6 md:p-8 bg-white rounded-[20px] md:rounded-[28px] border border-black/5 hover:shadow-lg hover:shadow-[#73AC01]/5 transition-all duration-500 hover:-translate-y-1 scroll-animate-scale ${gridVisible ? 'visible' : ''}`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-[#73AC01]/10 text-[#73AC01] rounded-2xl flex items-center justify-center mb-5 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                                {item.icon}
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-[#0A0908] mb-2">
                                {item.title}
                            </h3>
                            <p className="text-sm md:text-base text-[#0A0908]/60 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
