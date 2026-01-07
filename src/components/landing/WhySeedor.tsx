'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const benefits = [
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        title: 'Equipo especializado',
        description: 'Desarrollado por expertos en agro y tecnología.',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
        title: 'Datos seguros',
        description: 'Máxima seguridad y respaldo de tu información.',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        title: 'Ahorro de tiempo',
        description: 'Hasta 70% menos tiempo en tareas administrativas.',
    },
];

const metrics = [
    { value: '+85%', label: 'Eficiencia operativa' },
    { value: '-30%', label: 'Reducción de costos' },
    { value: '+95%', label: 'Control de inventario' },
];

export default function WhySeedor() {
    const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
    const { ref: benefitsRef, isVisible: benefitsVisible } = useScrollAnimation({ threshold: 0.2 });
    const { ref: metricsRef, isVisible: metricsVisible } = useScrollAnimation({ threshold: 0.2 });

    return (
        <section id="why-seedor" className="py-16 md:py-20 lg:py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div
                    ref={headerRef}
                    className={`text-center mb-12 md:mb-16 scroll-animate-up ${headerVisible ? 'visible' : ''}`}
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A0908] mb-4">
                        ¿Por qué elegir Seedor?
                    </h2>
                    <p className="text-sm md:text-base text-[#0A0908]/60 max-w-xl mx-auto">
                        Más que un software, somos tu socio tecnológico para hacer crecer tu operación agropecuaria.
                    </p>
                </div>

                {/* Benefits Grid */}
                <div
                    ref={benefitsRef}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16"
                >
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className={`group p-6 md:p-8 bg-[#F8F9FA] rounded-[20px] md:rounded-[28px] border border-black/5 hover:shadow-lg hover:shadow-[#73AC01]/5 transition-all duration-500 scroll-animate-scale ${benefitsVisible ? 'visible' : ''}`}
                            style={{ transitionDelay: `${index * 150}ms` }}
                        >
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-[#73AC01]/10 text-[#73AC01] rounded-2xl flex items-center justify-center mb-5 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                                {benefit.icon}
                            </div>
                            <h3 className="text-xl md:text-2xl font-semibold text-[#0A0908] mb-2 md:mb-3">
                                {benefit.title}
                            </h3>
                            <p className="text-sm md:text-base text-[#0A0908]/60 leading-relaxed">
                                {benefit.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Metrics Row */}
                <div
                    ref={metricsRef}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
                >
                    {metrics.map((metric, index) => (
                        <div
                            key={index}
                            className={`relative overflow-hidden p-6 md:p-8 bg-gradient-to-br from-[#0A0908] to-[#1A1918] rounded-[20px] md:rounded-[28px] text-white group scroll-animate-scale ${metricsVisible ? 'visible' : ''}`}
                            style={{ transitionDelay: `${index * 150}ms` }}
                        >
                            {/* Decorative gradient */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#73AC01]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#73AC01]/30 transition-all duration-500"></div>

                            <div className="relative z-10 text-center">
                                <div className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2 text-white group-hover:scale-105 transition-transform duration-300">
                                    {metric.value}
                                </div>
                                <p className="text-sm md:text-base text-white/70">
                                    {metric.label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
