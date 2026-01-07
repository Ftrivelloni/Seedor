'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function RegistrationSuccessPage() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4E8] flex flex-col">
            {/* Header */}
            <header className="w-full px-6 py-6">
                <div className="max-w-4xl mx-auto">
                    <Link
                        href="/"
                        className={`inline-block transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
                    >
                        <Image
                            src="/images/logos/seedor-logo-fondoblanco.png"
                            alt="Seedor"
                            width={120}
                            height={32}
                            className="h-8 w-auto"
                            priority
                        />
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="max-w-lg text-center">
                    {/* Success Icon */}
                    <div
                        className={`mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                        style={{ transitionDelay: '100ms' }}
                    >
                        <div className="w-24 h-24 mx-auto bg-[#73AC01] rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(115,172,1,0.3)]">
                            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h1
                        className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A0908] mb-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '200ms' }}
                    >
                        ¡Gracias por registrarte!
                    </h1>

                    {/* Subtitle */}
                    <p
                        className={`text-lg text-[#0A0908]/60 mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '300ms' }}
                    >
                        Tu cuenta ha sido creada exitosamente. Ya podés iniciar sesión y comenzar a gestionar tu campo.
                    </p>

                    {/* Login Button */}
                    <div
                        className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '400ms' }}
                    >
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 bg-[#73AC01] text-white font-semibold px-8 py-4 rounded-xl shadow-[0_4px_14px_0_rgba(115,172,1,0.39)] hover:bg-[#5C8A01] hover:shadow-[0_6px_20px_rgba(115,172,1,0.5)] hover:scale-[1.02] transition-all duration-300"
                        >
                            Iniciar sesión
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                    {/* Back to Home */}
                    <p
                        className={`mt-6 text-sm text-[#0A0908]/50 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: '500ms' }}
                    >
                        O volver a la{' '}
                        <Link href="/" className="text-[#73AC01] hover:underline">
                            página principal
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
