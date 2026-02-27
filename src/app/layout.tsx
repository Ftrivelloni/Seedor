import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'sonner';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seedor - Gestión Agropecuaria Inteligente",
  description: "La plataforma integral que necesitás para administrar tu campo de manera profesional y eficiente. Gestión de lotes, inventario, finanzas y más.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <NextTopLoader
          color="#16a34a"
          height={3}
          showSpinner={false}
          speed={200}
          shadow="0 0 10px #16a34a,0 0 5px #16a34a"
        />
        <Toaster position="top-right" richColors />
        {children}
      </body>
    </html>
  );
}
