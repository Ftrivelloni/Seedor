'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('admin@seedor.app');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error || 'No se pudo iniciar sesión.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('No se pudo iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="w-full lg:w-[45%] flex flex-col p-6 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="flex flex-col pt-4 sm:pt-8 lg:pt-12 max-w-lg mx-auto w-full">
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

          <h1
            className={`text-2xl sm:text-3xl font-bold text-[#0A0908] mb-2 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '100ms' }}
          >
            Iniciar sesión
          </h1>
          <p
            className={`text-[#0A0908]/60 mb-8 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '150ms' }}
          >
            Accedé con tus credenciales para ingresar al panel de gestión.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div
              className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '200ms' }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-[#0A0908]/70 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full px-4 py-4 bg-[#73AC01]/5 border border-[#73AC01]/20 rounded-xl text-[#0A0908] placeholder-[#0A0908]/40 focus:outline-none focus:ring-2 focus:ring-[#73AC01]/50 focus:border-[#73AC01] transition-all duration-200"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div
              className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '250ms' }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-[#0A0908]/70 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full px-4 py-4 pr-12 bg-[#73AC01]/5 border border-[#73AC01]/20 rounded-xl text-[#0A0908] placeholder-[#0A0908]/40 focus:outline-none focus:ring-2 focus:ring-[#73AC01]/50 focus:border-[#73AC01] transition-all duration-200"
                  placeholder="••••••••"
                  required
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

            <div
              className={`flex items-center justify-between transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '300ms' }}
            >
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border-2 border-black/20 rounded transition-all duration-200 peer-checked:bg-[#73AC01] peer-checked:border-[#73AC01] group-hover:border-[#73AC01]/50"></div>
                  <svg
                    className={`absolute top-0.5 left-0.5 w-4 h-4 text-white transition-all duration-200 ${rememberMe ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-[#0A0908]/60">Recordarme</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-sm text-[#73AC01] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                {error}
              </div>
            ) : null}

            <div
              className={`pt-2 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '350ms' }}
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-xl font-semibold bg-[#73AC01] text-white hover:bg-[#5C8A01] disabled:opacity-70 shadow-[0_4px_14px_0_rgba(115,172,1,0.39)] hover:shadow-[0_6px_20px_rgba(115,172,1,0.5)] hover:scale-[1.02] transition-all duration-300"
              >
                {isSubmitting ? 'Ingresando...' : 'Entrar'}
              </button>
            </div>
          </form>

          <div className="mt-6 rounded-xl border border-[#73AC01]/20 bg-[#73AC01]/5 px-4 py-3 text-sm text-[#0A0908]/70">
            <p className="font-medium text-[#0A0908]">Credenciales demo</p>
            <p>Admin: admin@seedor.app / admin123</p>
            <p>Supervisor: supervisor@seedor.app / super123</p>
          </div>

          <p
            className={`text-center mt-8 text-sm text-[#0A0908]/60 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '400ms' }}
          >
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-[#73AC01] font-medium hover:underline">
              Creá tu cuenta
            </Link>
          </p>
        </div>

        <div className="mt-auto pt-8">
          <p className="text-xs text-[#0A0908]/40 text-center">
            © 2025 Seedor. Todos los derechos reservados.
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-[55%] p-6">
        <div
          className={`relative w-full h-full rounded-[32px] overflow-hidden transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{ transitionDelay: '300ms' }}
        >
          <Image
            src="/images/campo_de_naranjas_ia.png"
            alt="Campo de naranjas"
            fill
            className="object-cover"
            sizes="55vw"
            priority
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent"></div>

          <div className="relative z-10 p-10 lg:p-12">
            <h2
              className={`text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-3 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '400ms' }}
            >
              Bienvenido de vuelta
            </h2>
            <p
              className={`text-base lg:text-lg text-white/80 mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '500ms' }}
            >
              Gestioná tu campo de manera simple y eficiente
            </p>
            <div
              className={`w-full h-px bg-white/30 transition-all duration-700 ${isLoaded ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}
              style={{ transitionDelay: '600ms', transformOrigin: 'left' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
