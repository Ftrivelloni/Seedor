'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BrowserMockup from './BrowserMockup';
import FloatingChips from './FloatingChips';

export default function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations after mount
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen bg-[#F1F1F1] pt-20 md:pt-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        {/* Text Content */}
        <div className="text-center mb-12 md:mb-16">
          {/* Badge */}
          <div 
            className={`inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-black/5 shadow-sm mb-6 md:mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          >
            <span className="w-2 h-2 bg-[#D9251C] rounded-full animate-pulse"></span>
            <span className="text-xs md:text-sm font-medium text-[#0A0908]/70">
              Plataforma #1 en gestión agropecuaria
            </span>
          </div>

          {/* Main Heading - Split animation */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#0A0908] leading-[1.1] mb-4 md:mb-6 tracking-tight overflow-hidden">
            <span 
              className={`inline-block transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}
              style={{ transitionDelay: '150ms' }}
            >
              Simplificá la gestión
            </span>
            <br />
            <span 
              className={`inline-block text-[#D9251C] transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}
              style={{ transitionDelay: '300ms' }}
            >
              agropecuaria
            </span>
          </h1>

          {/* Subtitle */}
          <p 
            className={`text-sm sm:text-base md:text-lg text-[#0A0908]/60 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '450ms' }}
          >
            La plataforma integral que necesitás para administrar tu campo de manera profesional y eficiente.
          </p>

          {/* CTAs */}
          <div 
            className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '600ms' }}
          >
            <Link
              href="#cta"
              className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 bg-[#D9251C] text-white text-sm md:text-base font-semibold rounded-full hover:bg-[#B81F17] transition-all duration-300 shadow-[0_4px_14px_0_rgba(217,37,28,0.39)] hover:shadow-[0_6px_20px_rgba(217,37,28,0.5)] hover:scale-[1.02]"
            >
              Crear mi campo gratis
            </Link>
            <Link
              href="#demo"
              className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 bg-white text-[#0A0908] text-sm md:text-base font-semibold rounded-full border border-black/10 hover:border-black/20 hover:bg-black/5 transition-all duration-300"
            >
              Ver demo
            </Link>
          </div>
        </div>

        {/* Browser Mockup with Floating Elements */}
        <div 
          className={`relative transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-95'}`}
          style={{ transitionDelay: '750ms' }}
        >
          <FloatingChips />
          <BrowserMockup />
        </div>
      </div>

      {/* Decorative gradient orbs with animation */}
      <div 
        className={`absolute top-1/4 -left-32 w-64 h-64 bg-[#D9251C]/5 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
        style={{ transitionDelay: '500ms' }}
      ></div>
      <div 
        className={`absolute bottom-1/4 -right-32 w-64 h-64 bg-[#D9251C]/5 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
        style={{ transitionDelay: '700ms' }}
      ></div>
    </section>
  );
}
