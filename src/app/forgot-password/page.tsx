'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [email, setEmail] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle forgot password logic here
        setIsSubmitted(true);
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

                    {!isSubmitted ? (
                        <>
                            {/* Title */}
                            <h1
                                className={`text-2xl sm:text-3xl font-bold text-[#0A0908] mb-2 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                                style={{ transitionDelay: '100ms' }}
                            >
                                Recuperá tu acceso
                            </h1>
                            <p
                                className={`text-[#0A0908]/60 mb-8 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                                style={{ transitionDelay: '150ms' }}
                            >
                                Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
                            </p>

                            {/* Form */}
                            <form className="space-y-5" onSubmit={handleSubmit}>
                                {/* Email Field */}
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
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-4 bg-[#73AC01]/5 border border-[#73AC01]/20 rounded-xl text-[#0A0908] placeholder-[#0A0908]/40 focus:outline-none focus:ring-2 focus:ring-[#73AC01]/50 focus:border-[#73AC01] transition-all duration-200"
                                        placeholder="tu@email.com"
                                        required
                                    />
                                </div>

                                {/* Submit Button */}
                                <div
                                    className={`pt-2 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                                    style={{ transitionDelay: '250ms' }}
                                >
                                    <button
                                        type="submit"
                                        className="w-full py-4 px-6 rounded-xl font-semibold bg-[#73AC01] text-white hover:bg-[#5C8A01] shadow-[0_4px_14px_0_rgba(115,172,1,0.39)] hover:shadow-[0_6px_20px_rgba(115,172,1,0.5)] hover:scale-[1.02] transition-all duration-300"
                                    >
                                        Enviar enlace
                                    </button>
                                </div>
                            </form>

                            {/* Tips Section */}
                            <div
                                className={`mt-10 space-y-4 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                                style={{ transitionDelay: '300ms' }}
                            >
                                <h3 className="text-sm font-semibold text-[#0A0908]/70">Tips</h3>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#73AC01]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-[#73AC01]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#0A0908]">Revisá spam y promociones</p>
                                        <p className="text-sm text-[#0A0908]/50">A veces el correo puede filtrarse en esas bandejas.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#73AC01]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-[#73AC01]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#0A0908]">El enlace tiene vencimiento</p>
                                        <p className="text-sm text-[#0A0908]/50">Usalo ni bien lo recibas por seguridad.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Back to Login */}
                            <p
                                className={`text-center mt-10 text-sm text-[#0A0908]/60 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                                style={{ transitionDelay: '350ms' }}
                            >
                                <Link href="/login" className="text-[#73AC01] font-medium hover:underline inline-flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Volver al inicio de sesión
                                </Link>
                            </p>
                        </>
                    ) : (
                        /* Success State */
                        <div className={`text-center transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="w-20 h-20 mx-auto mb-6 bg-[#73AC01] rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(115,172,1,0.3)]">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0908] mb-2">
                                ¡Email enviado!
                            </h1>
                            <p className="text-[#0A0908]/60 mb-8">
                                Revisá tu bandeja de entrada en <span className="font-medium text-[#0A0908]">{email}</span> y seguí las instrucciones para restablecer tu contraseña.
                            </p>

                            {/* Tips Section */}
                            <div className="bg-[#F8F9FA] rounded-xl p-5 text-left space-y-3 mb-8">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#73AC01]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-[#73AC01]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-[#0A0908]/60">Revisá también en spam y promociones</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#73AC01]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-[#73AC01]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-[#0A0908]/60">El enlace vence en 1 hora</p>
                                </div>
                            </div>

                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-[#73AC01] font-medium hover:underline"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-auto pt-8">
                    <p className="text-xs text-[#0A0908]/40 text-center">
                        © 2025 Seedor. Todos los derechos reservados.
                    </p>
                </div>
            </div>

            {/* Right Side - Image Panel */}
            <div className="hidden lg:flex lg:w-[55%] p-6">
                <div
                    className={`relative w-full h-full rounded-[32px] overflow-hidden transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                    style={{ transitionDelay: '300ms' }}
                >
                    {/* Background Image */}
                    <Image
                        src="/images/vinedo_ia.png"
                        alt="vinedo"
                        fill
                        className="object-cover"
                        sizes="55vw"
                        priority
                    />

                    {/* Dark Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent"></div>

                    {/* Content */}
                    <div className="relative z-10 p-10 lg:p-12">
                        <h2
                            className={`text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-3 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                            style={{ transitionDelay: '400ms' }}
                        >
                            Recuperá tu cuenta
                        </h2>
                        <p
                            className={`text-base lg:text-lg text-white/80 mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                            style={{ transitionDelay: '500ms' }}
                        >
                            Estás a un paso de volver a acceder a tu campo
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
