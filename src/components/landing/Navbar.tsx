'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger load animation
    const loadTimer = setTimeout(() => setIsLoaded(true), 50);

    // Handle scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(loadTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-sm' 
          : 'bg-[#F1F1F1]/80 backdrop-blur-md'
      } ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className={`flex items-center transition-all duration-500 ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}
            style={{ transitionDelay: '100ms' }}
          >
            <Image
              src="/brand/seedor-dark.png"
              alt="Seedor"
              width={120}
              height={32}
              className="h-7 md:h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {['Módulos', 'Estadísticas', 'Beneficios'].map((item, index) => (
              <Link 
                key={item}
                href={`#${item === 'Módulos' ? 'features' : item === 'Estadísticas' ? 'stats' : 'benefits'}`}
                className={`text-sm text-[#0A0908]/70 hover:text-[#0A0908] transition-all duration-500 hover:scale-105 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
                style={{ transitionDelay: `${200 + index * 100}ms` }}
              >
                {item}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <Link
            href="#cta"
            className={`px-4 py-2 md:px-6 md:py-2.5 bg-[#D9251C] text-white text-sm font-medium rounded-full hover:bg-[#B81F17] transition-all duration-300 shadow-[0_4px_14px_0_rgba(217,37,28,0.39)] hover:shadow-[0_6px_20px_rgba(217,37,28,0.5)] hover:scale-105 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
            style={{ transitionDelay: '400ms' }}
          >
            Empezar
          </Link>
        </div>
      </div>
    </nav>
  );
}
