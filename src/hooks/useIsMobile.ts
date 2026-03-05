'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para detectar si el dispositivo es móvil (< 768px)
 * Retorna true si la pantalla es menor a 768px (breakpoint md de Tailwind)
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Función para verificar el tamaño de pantalla
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar al montar
    checkMobile();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
