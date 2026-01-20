'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  mockCampos,
  mockLotes,
  mockTareas,
  mockDepositos,
  mockInsumos,
  mockMovimientos,
  mockAlertas,
  mockMaquinaria,
  mockServicios,
  mockClientes,
  mockOrdenes,
  mockFacturas,
} from '@/data/seedorData';

interface AppContextType {
  campos: any[];
  lotes: any[];
  tareas: any[];
  depositos: any[];
  insumos: any[];
  movimientos: any[];
  alertas: any[];
  maquinaria: any[];
  servicios: any[];
  clientes: any[];
  ordenes: any[];
  facturas: any[];
  campoActivo: string;
  setCampoActivo: (id: string) => void;
  agregarTarea: (tarea: any) => void;
  actualizarTarea: (id: string, datos: any) => void;
  agregarMovimiento: (movimiento: any) => void;
  agregarServicio: (servicio: any) => void;
  agregarOrden: (orden: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [campos] = useState(mockCampos);
  const [lotes] = useState(mockLotes);
  const [tareas, setTareas] = useState(mockTareas);
  const [depositos] = useState(mockDepositos);
  const [insumos] = useState(mockInsumos);
  const [movimientos, setMovimientos] = useState(mockMovimientos);
  const [alertas] = useState(mockAlertas);
  const [maquinaria] = useState(mockMaquinaria);
  const [servicios, setServicios] = useState(mockServicios);
  const [clientes] = useState(mockClientes);
  const [ordenes, setOrdenes] = useState(mockOrdenes);
  const [facturas] = useState(mockFacturas);
  const [campoActivo, setCampoActivo] = useState('1');
  const [isLoading, setIsLoading] = useState(false);

  const agregarTarea = (tarea: any) => {
    setTareas((prev) => [tarea, ...prev]);
  };

  const actualizarTarea = (id: string, datos: any) => {
    setTareas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...datos } : t))
    );
  };

  const agregarMovimiento = (movimiento: any) => {
    setMovimientos((prev) => [movimiento, ...prev]);
  };

  const agregarServicio = (servicio: any) => {
    setServicios((prev) => [servicio, ...prev]);
  };

  const agregarOrden = (orden: any) => {
    setOrdenes((prev) => [orden, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        campos,
        lotes,
        tareas,
        depositos,
        insumos,
        movimientos,
        alertas,
        maquinaria,
        servicios,
        clientes,
        ordenes,
        facturas,
        campoActivo,
        setCampoActivo,
        agregarTarea,
        actualizarTarea,
        agregarMovimiento,
        agregarServicio,
        agregarOrden,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe usarse dentro de AppProvider');
  }
  return context;
};
