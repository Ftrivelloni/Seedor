'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadTimer = setTimeout(() => setIsLoaded(true), 50);

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? 'bg-white/95 backdrop-blur-md shadow-sm'
        : 'bg-white/80 backdrop-blur-md'
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
              src="/images/logos/seedor-logo-fondoblanco.png"
              alt="Seedor"
              width={120}
              height={32}
              className="h-7 md:h-8 w-auto"
              priority
            />
          </Link>

          {/* CTA Buttons */}
          <div
            className={`hidden md:flex items-center gap-3 transition-all duration-500 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
            style={{ transitionDelay: '300ms' }}
          >
            <Link
              href="/login"
              className="px-6 py-2.5 bg-white text-[#73AC01] text-sm font-medium rounded-full border-2 border-[#73AC01] hover:bg-[#73AC01]/5 transition-all duration-300 hover:scale-105"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 bg-[#73AC01] text-white text-sm font-medium rounded-full hover:bg-[#5C8A01] transition-all duration-300 shadow-[0_4px_14px_0_rgba(115,172,1,0.39)] hover:shadow-[0_6px_20px_rgba(115,172,1,0.5)] hover:scale-105"
            >
              Crear usuario
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#0A0908]/70 hover:text-[#73AC01] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-black/5">
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="text-sm text-[#0A0908]/70 hover:text-[#73AC01] py-2"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="text-sm bg-[#73AC01] text-white text-center py-2 rounded-full"
              >
                Crear usuario
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
