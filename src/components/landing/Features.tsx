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
    description: 'Planificá, asigná y hacé seguimiento de todas las tareas de campo en tiempo real. Control total de cultivos, lotes y actividades diarias.',
    points: ['Planificación de tareas', 'Seguimiento de cultivos', 'Gestión de lotes', 'Reportes automáticos'],
    color: 'bg-[#73AC01]/10 text-[#73AC01]',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: 'Inventario y Empaque',
    description: 'Controlá insumos, cosecha y empaque con visibilidad total. Optimizá tu cadena de suministro y maximizá la eficiencia.',
    points: ['Control de stock', 'Trazabilidad completa', 'Gestión de pallets', 'Optimización de procesos'],
    color: 'bg-[#5C8A01]/10 text-[#5C8A01]',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Finanzas Inteligentes',
    description: 'Costos, egresos e ingresos siempre a mano para tomar mejores decisiones. Análisis financiero detallado y proyecciones.',
    points: ['Dashboard financiero', 'Análisis de costos', 'Proyecciones', 'Reportes detallados'],
    color: 'bg-[#8BC34A]/10 text-[#8BC34A]',
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
    <section id="features" className="py-16 md:py-20 lg:py-24 bg-[#F8F9FA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center mb-12 md:mb-16 scroll-animate-up ${headerVisible ? 'visible' : ''}`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A0908] mb-4">
            Todo lo que necesitás en un solo lugar
          </h2>
          <p className="text-sm md:text-base text-[#0A0908]/60 max-w-xl mx-auto">
            Herramientas poderosas diseñadas específicamente para la gestión agropecuaria moderna
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={cardRefs[index]}
              className={`group p-6 md:p-8 bg-white rounded-[20px] md:rounded-[28px] border border-black/5 hover:shadow-xl hover:shadow-[#73AC01]/5 transition-all duration-500 hover:-translate-y-1 scroll-animate-scale ${cardVisibility[index] ? 'visible' : ''}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-5 md:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-[#0A0908] mb-3">
                {feature.title}
              </h3>
              <p className="text-sm md:text-base text-[#0A0908]/60 leading-relaxed mb-4">
                {feature.description}
              </p>
              {/* Feature Points */}
              <ul className="space-y-2">
                {feature.points.map((point, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-[#0A0908]/70">
                    <svg className="w-4 h-4 text-[#73AC01] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
