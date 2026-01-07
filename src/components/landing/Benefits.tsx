'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const benefits = [
  {
    value: '70%',
    description: 'Menos tiempo en tareas administrativas',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: '+85%',
    description: 'Productividad',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    value: '+95%',
    description: 'Satisfacción',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function Benefits() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: card1Ref, isVisible: card1Visible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: card2Ref, isVisible: card2Visible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: card3Ref, isVisible: card3Visible } = useScrollAnimation({ threshold: 0.2 });

  const cardRefs = [card1Ref, card2Ref, card3Ref];
  const cardVisibility = [card1Visible, card2Visible, card3Visible];
  const animationTypes = ['scroll-animate-right', 'scroll-animate-up', 'scroll-animate-left'];

  return (
    <section id="benefits" className="py-16 md:py-20 lg:py-24 bg-[#F8F9FA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center mb-12 md:mb-16 scroll-animate-up ${headerVisible ? 'visible' : ''}`}
        >
          <span className="inline-block px-4 py-1.5 bg-[#73AC01]/10 text-[#73AC01] text-xs md:text-sm font-medium rounded-full mb-4">
            Beneficios
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A0908] mb-4">
            Por qué elegirnos
          </h2>
          <p className="text-sm md:text-base text-[#0A0908]/60 max-w-xl mx-auto">
            Transformá la manera en que gestionás tu campo con resultados tangibles.
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              ref={cardRefs[index]}
              className={`relative overflow-hidden p-6 md:p-8 bg-gradient-to-br from-[#0A0908] to-[#1A1918] rounded-[20px] md:rounded-[28px] text-white group ${animationTypes[index]} ${cardVisibility[index] ? 'visible' : ''}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#73AC01]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#73AC01]/30 transition-all duration-500"></div>

              <div className="relative z-10">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#73AC01] rounded-xl flex items-center justify-center mb-5 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                  {benefit.icon}
                </div>
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2 text-white group-hover:scale-105 transition-transform duration-300 origin-left">
                  {benefit.value}
                </div>
                <p className="text-sm md:text-base text-white/70">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
