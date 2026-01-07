'use client';

import { useEffect, useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const stats = [
  {
    value: 500,
    suffix: '+',
    label: 'Campos activos',
  },
  {
    value: 50,
    suffix: 'K+',
    label: 'Hectáreas gestionadas',
  },
  {
    value: 99,
    suffix: '%',
    label: 'Tiempo de actividad',
  },
  {
    value: 24,
    suffix: '/7',
    label: 'Soporte técnico',
  },
];

function AnimatedNumber({ value, suffix, isVisible }: { value: number; suffix: string; isVisible: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <span>
      {displayValue}{suffix}
    </span>
  );
}

export default function Stats() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section id="stats" className="py-16 md:py-20 lg:py-24 bg-[#F1F1F1] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div 
          ref={headerRef}
          className={`text-center mb-12 md:mb-16 scroll-animate-up ${headerVisible ? 'visible' : ''}`}
        >
          <span className="inline-block px-4 py-1.5 bg-[#D9251C]/10 text-[#D9251C] text-xs md:text-sm font-medium rounded-full mb-4">
            Números que hablan
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A0908] mb-4">
            Resultados comprobados
          </h2>
        </div>

        {/* Stats Grid */}
        <div 
          ref={statsRef}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`bg-white p-6 md:p-8 rounded-[20px] md:rounded-[28px] border border-black/5 shadow-sm text-center group hover:shadow-lg transition-all duration-500 scroll-animate-scale ${statsVisible ? 'visible' : ''}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#D9251C] mb-2 group-hover:scale-105 transition-transform duration-300">
                <AnimatedNumber 
                  value={stat.value} 
                  suffix={stat.suffix} 
                  isVisible={statsVisible} 
                />
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
