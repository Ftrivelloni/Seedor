'use client';

import Link from 'next/link';
import { useScrollAnimation, useParallax } from '@/hooks/useScrollAnimation';

export default function CTA() {
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.3 });
  const { ref: parallaxRef, offset } = useParallax(0.3);

  return (
    <section id="cta" className="py-16 md:py-20 lg:py-24 bg-[#F1F1F1] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          ref={sectionRef}
          className={`relative overflow-hidden bg-gradient-to-br from-[#D9251C] to-[#A91D15] rounded-[24px] md:rounded-[32px] p-8 sm:p-12 md:p-16 lg:p-20 text-center scroll-animate-scale ${isVisible ? 'visible' : ''}`}
        >
          {/* Decorative elements with parallax */}
          <div 
            ref={parallaxRef}
            className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 transition-transform duration-300"
            style={{ transform: `translate(-50%, calc(-50% + ${offset}px))` }}
          ></div>
          <div 
            className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 transition-transform duration-300"
            style={{ transform: `translate(50%, calc(50% - ${offset}px))` }}
          ></div>
          
          {/* Animated background shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className={`absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
              style={{ transitionDelay: '200ms' }}
            ></div>
            <div 
              className={`absolute top-1/3 right-1/3 w-3 h-3 bg-white/20 rounded-full transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
              style={{ transitionDelay: '400ms' }}
            ></div>
            <div 
              className={`absolute bottom-1/4 left-1/3 w-2 h-2 bg-white/25 rounded-full transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
              style={{ transitionDelay: '600ms' }}
            ></div>
            <div 
              className={`absolute bottom-1/3 right-1/4 w-4 h-4 bg-white/15 rounded-full transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
              style={{ transitionDelay: '800ms' }}
            ></div>
          </div>
          
          <div className="relative z-10">
            <h2 
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight scroll-animate-up ${isVisible ? 'visible' : ''}`}
              style={{ transitionDelay: '100ms' }}
            >
              Gestioná tu campo
              <br />
              <span className="text-white/90">de manera inteligente</span>
            </h2>
            <p 
              className={`text-sm sm:text-base md:text-lg text-white/80 max-w-xl mx-auto mb-8 md:mb-10 scroll-animate-up ${isVisible ? 'visible' : ''}`}
              style={{ transitionDelay: '200ms' }}
            >
              Empezá hoy y descubrí cómo Seedor puede transformar tu operación agropecuaria.
            </p>
            <Link
              href="#"
              className={`inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-white text-[#D9251C] text-sm md:text-base font-semibold rounded-full hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] group scroll-animate-up ${isVisible ? 'visible' : ''}`}
              style={{ transitionDelay: '300ms' }}
            >
              Empezar ahora
              <svg 
                className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
