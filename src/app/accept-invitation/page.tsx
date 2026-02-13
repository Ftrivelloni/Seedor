'use client';

import { FormEvent, useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoaded, setIsLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invitation validation states
  const [invitationStatus, setInvitationStatus] = useState<
    'loading' | 'valid' | 'invalid'
  >('loading');
  const [invitationData, setInvitationData] = useState<{
    email: string;
    role: string;
    tenantName: string;
    inviterName: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setInvitationStatus('invalid');
      return;
    }

    fetch(`/api/auth/validate-invitation?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then(
        (
          data: {
            ok?: boolean;
            email?: string;
            role?: string;
            tenantName?: string;
            inviterName?: string;
            error?: string;
          }
        ) => {
          if (data.ok) {
            setInvitationData({
              email: data.email!,
              role: data.role!,
              tenantName: data.tenantName!,
              inviterName: data.inviterName!,
            });
            setInvitationStatus('valid');
          } else {
            setError(data.error || 'Invitación inválida.');
            setInvitationStatus('invalid');
          }
        }
      )
      .catch(() => {
        setError('No se pudo validar la invitación.');
        setInvitationStatus('invalid');
      });
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, firstName, lastName, phone, password }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok) {
        setError(data.error || 'No se pudo completar el registro.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('No se pudo completar el registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (invitationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="h-10 w-10 mx-auto mb-4 border-4 border-[#73AC01] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#0A0908]/60">Validando invitación...</p>
        </div>
      </div>
    );
  }

  if (invitationStatus === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center">
              <div className="relative h-11 w-48">
                <Image
                  src="/images/logos/seedor-logo-fondoblanco.png"
                  alt="Seedor"
                  fill
                  priority
                  className="object-contain"
                  sizes="176px"
                />
              </div>
            </Link>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <svg
              className="mx-auto h-12 w-12 text-red-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <h2 className="text-xl font-bold text-[#0A0908] mb-2">
              Invitación inválida
            </h2>
            <p className="text-[#0A0908]/60 mb-4">
              {error ||
                'El enlace de invitación no es válido o ha expirado. Solicitá una nueva invitación al administrador de tu organización.'}
            </p>
            <Link
              href="/login"
              className="inline-block py-3 px-6 rounded-xl font-semibold bg-[#73AC01] text-white hover:bg-[#5C8A01] transition-all duration-300"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const roleLabel =
    invitationData?.role === 'ADMIN' ? 'Administrador' : 'Operativo';

  return (
    <div className="min-h-screen flex bg-white">
      <div className="w-full lg:w-[45%] flex flex-col p-6 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="flex flex-col pt-4 sm:pt-8 lg:pt-12 max-w-lg mx-auto w-full">
          <div
            className={`mb-8 lg:mb-10 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          >
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
            Completá tu registro
          </h1>
          <p
            className={`text-[#0A0908]/60 mb-6 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '150ms' }}
          >
            Fuiste invitado/a por{' '}
            <strong className="text-[#0A0908]">
              {invitationData?.inviterName}
            </strong>{' '}
            a unirte a{' '}
            <strong className="text-[#0A0908]">
              {invitationData?.tenantName}
            </strong>
            .
          </p>

          {/* Role badge */}
          <div
            className={`mb-6 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '175ms' }}
          >
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#73AC01]/20 bg-[#73AC01]/5 px-4 py-2">
              <span className="text-sm text-[#0A0908]/60">Rol asignado:</span>
              <span className="text-sm font-semibold text-[#73AC01]">
                {roleLabel}
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email (read-only) */}
            <div
              className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '200ms' }}
            >
              <label className="block text-sm font-medium text-[#0A0908]/70 mb-2">
                Email
              </label>
              <input
                type="email"
                value={invitationData?.email || ''}
                disabled
                className="w-full px-4 py-4 bg-gray-100 border border-gray-200 rounded-xl text-[#0A0908]/60 cursor-not-allowed"
              />
            </div>

            {/* Name fields */}
            <div
              className={`grid grid-cols-2 gap-3 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '250ms' }}
            >
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-[#0A0908]/70 mb-2"
                >
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-4 bg-[#73AC01]/5 border border-[#73AC01]/20 rounded-xl text-[#0A0908] placeholder-[#0A0908]/40 focus:outline-none focus:ring-2 focus:ring-[#73AC01]/50 focus:border-[#73AC01] transition-all duration-200"
                  placeholder="Juan"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-[#0A0908]/70 mb-2"
                >
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-4 bg-[#73AC01]/5 border border-[#73AC01]/20 rounded-xl text-[#0A0908] placeholder-[#0A0908]/40 focus:outline-none focus:ring-2 focus:ring-[#73AC01]/50 focus:border-[#73AC01] transition-all duration-200"
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div
              className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '300ms' }}
            >
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-[#0A0908]/70 mb-2"
              >
                Teléfono{' '}
                <span className="text-[#0A0908]/40">(opcional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-4 bg-[#73AC01]/5 border border-[#73AC01]/20 rounded-xl text-[#0A0908] placeholder-[#0A0908]/40 focus:outline-none focus:ring-2 focus:ring-[#73AC01]/50 focus:border-[#73AC01] transition-all duration-200"
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            {/* Password */}
            <div
              className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '350ms' }}
            >
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#0A0908]/70 mb-2"
              >
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 pr-12 bg-[#73AC01]/5 border border-[#73AC01]/20 rounded-xl text-[#0A0908] placeholder-[#0A0908]/40 focus:outline-none focus:ring-2 focus:ring-[#73AC01]/50 focus:border-[#73AC01] transition-all duration-200"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#0A0908]/40 hover:text-[#0A0908]/60 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div
              className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '400ms' }}
            >
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[#0A0908]/70 mb-2"
              >
                Confirmar contraseña <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-4 bg-[#73AC01]/5 border border-[#73AC01]/20 rounded-xl text-[#0A0908] placeholder-[#0A0908]/40 focus:outline-none focus:ring-2 focus:ring-[#73AC01]/50 focus:border-[#73AC01] transition-all duration-200"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                {error}
              </div>
            ) : null}

            <div
              className={`pt-2 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '450ms' }}
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-xl font-semibold bg-[#73AC01] text-white hover:bg-[#5C8A01] disabled:opacity-70 shadow-[0_4px_14px_0_rgba(115,172,1,0.39)] hover:shadow-[0_6px_20px_rgba(115,172,1,0.5)] hover:scale-[1.02] transition-all duration-300"
              >
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta y entrar'}
              </button>
            </div>
          </form>

          <p
            className={`text-center mt-6 text-sm text-[#0A0908]/60 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '500ms' }}
          >
            ¿Ya tenés cuenta?{' '}
            <Link
              href="/login"
              className="text-[#73AC01] font-medium hover:underline"
            >
              Iniciá sesión
            </Link>
          </p>
        </div>

        <div className="mt-auto pt-8">
          <p className="text-xs text-[#0A0908]/40 text-center">
            © {new Date().getFullYear()} Seedor. Todos los derechos reservados.
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />
          <div className="relative z-10 p-10 lg:p-12">
            <h2
              className={`text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-3 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '400ms' }}
            >
              Unite al equipo
            </h2>
            <p
              className={`text-base lg:text-lg text-white/80 mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '500ms' }}
            >
              Colaborá con tu equipo y gestioná el campo de forma eficiente
            </p>
            <div
              className={`w-full h-px bg-white/30 transition-all duration-700 ${isLoaded ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}
              style={{
                transitionDelay: '600ms',
                transformOrigin: 'left',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="h-10 w-10 border-4 border-[#73AC01] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AcceptInvitationForm />
    </Suspense>
  );
}
