'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would save the form data
    router.push('/register/select-plan');
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="w-full lg:w-[45%] flex flex-col p-6 sm:p-8 lg:p-12 overflow-y-auto">
        {/* Form Container */}
        <div className="flex flex-col pt-4 sm:pt-8 lg:pt-12 max-w-lg mx-auto w-full">
          {/* Logo */}
          <div className={`mb-8 lg:mb-10 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <Link href="/" className="flex items-center">
              <div className="relative h-11 sm:h-12 w-48 sm:w-56">
                <Image
                  src="/images/logos/seedor-logo-fondoblanco.png"
                  alt="Seedor"
                  fill
                  priority
                  className="object-contain object-left"
                  sizes="(min-width:640px) 176px, 160px"
                />
              </div>
            </Link>
          </div>
          {/* Title */}
          <h1
            className={`text-2xl sm:text-3xl font-bold text-[#0A0908] mb-8 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '100ms' }}
          >
            Registrarse
          </h1>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div
              className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '150ms' }}
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#0A0908]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  className="w-full pl-12 pr-4 py-5 bg-[#73AC01]/5 border border-[#73AC01]/20 rounded-xl text-[#0A0908] placeholder-[#0A0908]/40 focus:outline-none focus:ring-2 focus:ring-[#73AC01]/50 focus:border-[#73AC01] transition-all duration-200"
                  placeholder="Email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div
              className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '200ms' }}
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#0A0908]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-12 pr-12 py-5 bg-[#73AC01]/5 border border-[#73AC01]/20 rounded-xl text-[#0A0908] placeholder-[#0A0908]/40 focus:outline-none focus:ring-2 focus:ring-[#73AC01]/50 focus:border-[#73AC01] transition-all duration-200"
                  placeholder="Contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#0A0908]/40 hover:text-[#0A0908]/60 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Name Field */}
            <div
              className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '250ms' }}
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#0A0908]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="name"
                  type="text"
                  className="w-full pl-12 pr-4 py-5 bg-[#73AC01]/5 border border-[#73AC01]/20 rounded-xl text-[#0A0908] placeholder-[#0A0908]/40 focus:outline-none focus:ring-2 focus:ring-[#73AC01]/50 focus:border-[#73AC01] transition-all duration-200"
                  placeholder="Nombre completo"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div
              className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '300ms' }}
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#0A0908]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  id="phone"
                  type="tel"
                  className="w-full pl-12 pr-4 py-5 bg-[#73AC01]/5 border border-[#73AC01]/20 rounded-xl text-[#0A0908] placeholder-[#0A0908]/40 focus:outline-none focus:ring-2 focus:ring-[#73AC01]/50 focus:border-[#73AC01] transition-all duration-200"
                  placeholder="Teléfono"
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div
              className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '350ms' }}
            >
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border-2 border-black/20 rounded transition-all duration-200 peer-checked:bg-[#73AC01] peer-checked:border-[#73AC01] group-hover:border-[#73AC01]/50"></div>
                  <svg
                    className={`absolute top-0.5 left-0.5 w-4 h-4 text-white transition-all duration-200 ${agreedToTerms ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-[#0A0908]/60 leading-tight">
                  Confirmo que he leído y acepto los{' '}
                  <Link href="/terms" className="text-[#73AC01] hover:underline">
                    Términos y Condiciones
                  </Link>{' '}
                  y la{' '}
                  <Link href="/privacy" className="text-[#73AC01] hover:underline">
                    Política de Privacidad
                  </Link>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div
              className={`pt-2 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '400ms' }}
            >
              <button
                type="submit"
                disabled={!agreedToTerms}
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${agreedToTerms
                  ? 'bg-[#73AC01] text-white hover:bg-[#5C8A01] shadow-[0_4px_14px_0_rgba(115,172,1,0.39)] hover:shadow-[0_6px_20px_rgba(115,172,1,0.5)] hover:scale-[1.02]'
                  : 'bg-[#73AC01]/30 text-white/70 cursor-not-allowed'
                  }`}
              >
                Elegir plan
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </form>

          {/* Login Link */}
          <p
            className={`text-center mt-6 text-sm text-[#0A0908]/60 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '450ms' }}
          >
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-[#73AC01] font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Media Card */}
      <div className="hidden lg:flex lg:w-[55%] p-6">
        <div
          className={`relative w-full h-full rounded-[32px] overflow-hidden bg-black transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{ transitionDelay: '300ms' }}
        >
          {/* Video */}
          <div className="absolute inset-0 flex items-center justify-center">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/videos/animacionlogo3d.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Text Overlay */}
          <div className="absolute inset-0 flex flex-col pointer-events-none">
            <div className="p-10 lg:p-12">
              <h2
                className={`text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-3 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: '400ms' }}
              >
                Todo lo que necesitás en un solo lugar
              </h2>
              <p
                className={`text-base lg:text-lg text-white/80 mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: '500ms' }}
              >
                Herramientas avanzadas que transforman tu forma de trabajar
              </p>
              <div
                className={`w-full h-px bg-white/30 transition-all duration-700 ${isLoaded ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}
                style={{ transitionDelay: '600ms', transformOrigin: 'left' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
