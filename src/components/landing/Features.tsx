'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    title: 'Gestión de Campo',
    description: 'Administrá lotes, tareas y seguimiento en tiempo real.',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: 'Inventario y Empaque',
    description: 'Control de insumos, stock y registro de empaques.',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Finanzas Inteligentes',
    description: 'Costos, presupuestos y reportes para decidir mejor.',
    color: 'bg-amber-500/10 text-amber-600',
  },
];

export default function Features() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: card1Ref, isVisible: card1Visible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: card2Ref, isVisible: card2Visible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: card3Ref, isVisible: card3Visible } = useScrollAnimation({ threshold: 0.2 });

  const cardRefs = [card1Ref, card2Ref, card3Ref];
  const cardVisibility = [card1Visible, card2Visible, card3Visible];

  return (
    <section id="features" className="py-16 md:py-20 lg:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div 
          ref={headerRef}
          className={`text-center mb-12 md:mb-16 scroll-animate-up ${headerVisible ? 'visible' : ''}`}
        >
          <span className="inline-block px-4 py-1.5 bg-[#D9251C]/10 text-[#D9251C] text-xs md:text-sm font-medium rounded-full mb-4">
            Módulos
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A0908] mb-4">
            Todo lo que necesitás
          </h2>
          <p className="text-sm md:text-base text-[#0A0908]/60 max-w-xl mx-auto">
            Herramientas diseñadas para optimizar cada aspecto de tu operación agropecuaria.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={cardRefs[index]}
              className={`group p-6 md:p-8 bg-[#F8F9FA] rounded-[20px] md:rounded-[28px] border border-black/5 hover:shadow-xl hover:shadow-black/5 transition-all duration-500 hover:-translate-y-1 scroll-animate-scale ${cardVisibility[index] ? 'visible' : ''}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-5 md:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-[#0A0908] mb-2 md:mb-3">
                {feature.title}
              </h3>
              <p className="text-sm md:text-base text-[#0A0908]/60 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
