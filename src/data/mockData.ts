// Mock data for Seedor prototype

export const campos = [
  { id: "1", nombre: "Campo Norte", hectareas: 250, ubicacion: "San Pedro" },
  { id: "2", nombre: "Campo Sur", hectareas: 180, ubicacion: "Pergamino" },
  { id: "3", nombre: "Campo Este", hectareas: 320, ubicacion: "Junín" },
];

export const lotes = [
  { 
    id: "L1", 
    campo: "Campo Norte", 
    nombre: "Lote 1A", 
    hectareas: 45, 
    estado: "high", 
    tareasAbiertas: 3,
    ultimoTrabajo: "2026-01-10",
    rendimiento: 85,
    costoHa: 1250,
    cultivo: "Soja"
  },
  { 
    id: "L2", 
    campo: "Campo Norte", 
    nombre: "Lote 1B", 
    hectareas: 52, 
    estado: "medium", 
    tareasAbiertas: 1,
    ultimoTrabajo: "2026-01-12",
    rendimiento: 78,
    costoHa: 1180,
    cultivo: "Maíz"
  },
  { 
    id: "L3", 
    campo: "Campo Norte", 
    nombre: "Lote 2A", 
    hectareas: 38, 
    estado: "ok", 
    tareasAbiertas: 0,
    ultimoTrabajo: "2026-01-14",
    rendimiento: 92,
    costoHa: 950,
    cultivo: "Trigo"
  },
  { 
    id: "L4", 
    campo: "Campo Sur", 
    nombre: "Lote 3A", 
    hectareas: 60, 
    estado: "medium", 
    tareasAbiertas: 2,
    ultimoTrabajo: "2026-01-08",
    rendimiento: 80,
    costoHa: 1320,
    cultivo: "Soja"
  },
  { 
    id: "L5", 
    campo: "Campo Sur", 
    nombre: "Lote 3B", 
    hectareas: 55, 
    estado: "ok", 
    tareasAbiertas: 0,
    ultimoTrabajo: "2026-01-15",
    rendimiento: 88,
    costoHa: 1050,
    cultivo: "Girasol"
  },
];

export const tareas = [
  {
    id: "T1",
    tipo: "Aplicación herbicida",
    descripcion: "Aplicación de glifosato pre-siembra",
    fechaInicio: "2026-01-18",
    fechaFin: "2026-01-20",
    prioridad: "alta",
    estado: "pendiente",
    lotes: ["L1", "L2"],
    trabajadores: ["Juan Pérez", "Carlos Gómez"],
    maquinaria: "Pulverizadora P-450",
    insumos: [
      { nombre: "Glifosato 48%", cantidad: 150, unidad: "L" },
      { nombre: "Coadyuvante", cantidad: 25, unidad: "L" }
    ],
    consumoReal: null,
    automatizarAviso: true
  },
  {
    id: "T2",
    tipo: "Siembra",
    descripcion: "Siembra de soja variedad 5.9",
    fechaInicio: "2026-01-22",
    fechaFin: "2026-01-25",
    prioridad: "alta",
    estado: "en-progreso",
    lotes: ["L3"],
    trabajadores: ["Roberto Fernández", "Miguel Torres"],
    maquinaria: "Sembradora S-300",
    insumos: [
      { nombre: "Semilla Soja 5.9", cantidad: 180, unidad: "kg" },
      { nombre: "Fertilizante arranque", cantidad: 120, unidad: "kg" }
    ],
    consumoReal: null,
    automatizarAviso: false
  },
  {
    id: "T3",
    tipo: "Fertilización",
    descripcion: "Aplicación de urea",
    fechaInicio: "2026-01-10",
    fechaFin: "2026-01-12",
    prioridad: "media",
    estado: "completada",
    lotes: ["L4", "L5"],
    trabajadores: ["Juan Pérez"],
    maquinaria: "Fertilizadora F-200",
    insumos: [
      { nombre: "Urea 46%", cantidad: 300, unidad: "kg" }
    ],
    consumoReal: [
      { nombre: "Urea 46%", cantidad: 285, unidad: "kg" }
    ],
    automatizarAviso: true
  },
];

export const depositos = [
  {
    id: "D1",
    nombre: "Depósito Central",
    ubicacion: "Campo Norte - Galpón A",
    items: 45,
    alertas: 3
  },
  {
    id: "D2",
    nombre: "Depósito Sur",
    ubicacion: "Campo Sur - Galpón B",
    items: 32,
    alertas: 1
  },
  {
    id: "D3",
    nombre: "Depósito Semillas",
    ubicacion: "Campo Norte - Cámara",
    items: 18,
    alertas: 0
  },
];

export const insumos = [
  {
    id: "INS1",
    nombre: "Glifosato 48%",
    categoria: "Herbicida",
    stockTotal: 450,
    stockPorDeposito: {
      "D1": 280,
      "D2": 170
    },
    unidad: "L",
    minimo: 200,
    estado: "ok"
  },
  {
    id: "INS2",
    nombre: "Semilla Soja 5.9",
    categoria: "Semilla",
    stockTotal: 380,
    stockPorDeposito: {
      "D1": 180,
      "D3": 200
    },
    unidad: "kg",
    minimo: 500,
    estado: "bajo"
  },
  {
    id: "INS3",
    nombre: "Urea 46%",
    categoria: "Fertilizante",
    stockTotal: 1200,
    stockPorDeposito: {
      "D1": 650,
      "D2": 550
    },
    unidad: "kg",
    minimo: 800,
    estado: "ok"
  },
  {
    id: "INS4",
    nombre: "Insecticida Cipermetrina",
    categoria: "Insecticida",
    stockTotal: 15,
    stockPorDeposito: {
      "D1": 15
    },
    unidad: "L",
    minimo: 50,
    estado: "critico"
  },
  {
    id: "INS5",
    nombre: "Fertilizante arranque NPK",
    categoria: "Fertilizante",
    stockTotal: 850,
    stockPorDeposito: {
      "D1": 450,
      "D2": 400
    },
    unidad: "kg",
    minimo: 600,
    estado: "ok"
  },
];

export const movimientos = [
  {
    id: "MOV1",
    tipo: "Consumo",
    fecha: "2026-01-12",
    insumo: "Urea 46%",
    cantidad: 285,
    unidad: "kg",
    depositoOrigen: "D1",
    depositoDestino: null,
    referencia: "Tarea T3",
    usuario: "Juan Pérez"
  },
  {
    id: "MOV2",
    tipo: "Ingreso",
    fecha: "2026-01-15",
    insumo: "Glifosato 48%",
    cantidad: 200,
    unidad: "L",
    depositoOrigen: null,
    depositoDestino: "D2",
    referencia: "Compra #4521",
    usuario: "Admin"
  },
  {
    id: "MOV3",
    tipo: "Traslado",
    fecha: "2026-01-14",
    insumo: "Semilla Soja 5.9",
    cantidad: 50,
    unidad: "kg",
    depositoOrigen: "D3",
    depositoDestino: "D1",
    referencia: null,
    usuario: "Carlos Gómez"
  },
];

export const maquinarias = [
  {
    id: "MAQ1",
    nombre: "Tractor JD 7230R",
    tipo: "Tractor",
    contahoras: 2450,
    ubicacion: "Campo Norte",
    proximoService: 2600,
    estado: "ok",
    ultimoService: "2025-12-20"
  },
  {
    id: "MAQ2",
    nombre: "Pulverizadora P-450",
    tipo: "Pulverizadora",
    contahoras: 1850,
    ubicacion: "Depósito Central",
    proximoService: 1900,
    estado: "service-pronto",
    ultimoService: "2025-11-15"
  },
  {
    id: "MAQ3",
    nombre: "Sembradora S-300",
    tipo: "Sembradora",
    contahoras: 980,
    ubicacion: "Campo Norte",
    proximoService: 1200,
    estado: "ok",
    ultimoService: "2025-10-05"
  },
  {
    id: "MAQ4",
    nombre: "Cosechadora C-980",
    tipo: "Cosechadora",
    contahoras: 3200,
    ubicacion: "Galpón Sur",
    proximoService: 3100,
    estado: "critico",
    ultimoService: "2025-09-10"
  },
  {
    id: "MAQ5",
    nombre: "Fertilizadora F-200",
    tipo: "Fertilizadora",
    contahoras: 1520,
    ubicacion: "Campo Sur",
    proximoService: 1700,
    estado: "ok",
    ultimoService: "2025-12-01"
  },
];

export const serviciosMaquinaria = [
  {
    id: "SER1",
    maquinariaId: "MAQ2",
    tipo: "Service preventivo",
    fecha: "2025-11-15",
    descripcion: "Cambio de filtros y aceite",
    costo: 45000,
    contahoras: 1650
  },
  {
    id: "SER2",
    maquinariaId: "MAQ1",
    tipo: "Service",
    fecha: "2025-12-20",
    descripcion: "Service 250hs - revisión completa",
    costo: 125000,
    contahoras: 2250
  },
  {
    id: "SER3",
    maquinariaId: "MAQ4",
    tipo: "Reparación",
    fecha: "2025-09-10",
    descripcion: "Reparación sistema hidráulico",
    costo: 280000,
    contahoras: 3100
  },
];

export const clientes = [
  {
    id: "CLI1",
    nombre: "Molino San Pedro S.A.",
    tipo: "Empresa",
    email: "compras@molinosp.com",
    telefono: "+54 11 4567-8900",
    ubicacion: "San Pedro, Buenos Aires",
    saldoPendiente: 0,
    ultimaCompra: "2026-01-10"
  },
  {
    id: "CLI2",
    nombre: "Acopio Junín",
    tipo: "Acopio",
    email: "info@acopiojunin.com.ar",
    telefono: "+54 236 444-5555",
    ubicacion: "Junín, Buenos Aires",
    saldoPendiente: 850000,
    ultimaCompra: "2026-01-12"
  },
  {
    id: "CLI3",
    nombre: "Exportadora del Plata",
    tipo: "Exportadora",
    email: "granos@exportadoradelplata.com",
    telefono: "+54 11 5234-7800",
    ubicacion: "Rosario, Santa Fe",
    saldoPendiente: 0,
    ultimaCompra: "2025-12-28"
  },
  {
    id: "CLI4",
    nombre: "Cooperativa Agrícola",
    tipo: "Cooperativa",
    email: "ventas@coopagraria.coop",
    telefono: "+54 341 456-7890",
    ubicacion: "Pergamino, Buenos Aires",
    saldoPendiente: 420000,
    ultimaCompra: "2026-01-05"
  },
];

export const ordenes = [
  {
    id: "ORD1",
    numero: "ORD-2026-001",
    cliente: "CLI1",
    clienteNombre: "Molino San Pedro S.A.",
    fecha: "2026-01-10",
    estado: "completada",
    items: [
      { producto: "Soja", cantidad: 150, unidad: "Ton", precioUnitario: 350000 },
      { producto: "Trigo", cantidad: 80, unidad: "Ton", precioUnitario: 280000 }
    ],
    total: 7490000,
    pagado: 7490000
  },
  {
    id: "ORD2",
    numero: "ORD-2026-002",
    cliente: "CLI2",
    clienteNombre: "Acopio Junín",
    fecha: "2026-01-12",
    estado: "pendiente-pago",
    items: [
      { producto: "Maíz", cantidad: 100, unidad: "Ton", precioUnitario: 180000 }
    ],
    total: 1800000,
    pagado: 950000
  },
  {
    id: "ORD3",
    numero: "ORD-2026-003",
    cliente: "CLI4",
    clienteNombre: "Cooperativa Agrícola",
    fecha: "2026-01-05",
    estado: "pendiente-pago",
    items: [
      { producto: "Girasol", cantidad: 60, unidad: "Ton", precioUnitario: 420000 }
    ],
    total: 2520000,
    pagado: 2100000
  },
  {
    id: "ORD4",
    numero: "ORD-2026-004",
    cliente: "CLI3",
    clienteNombre: "Exportadora del Plata",
    fecha: "2025-12-28",
    estado: "completada",
    items: [
      { producto: "Soja", cantidad: 200, unidad: "Ton", precioUnitario: 350000 },
      { producto: "Maíz", cantidad: 120, unidad: "Ton", precioUnitario: 180000 }
    ],
    total: 9160000,
    pagado: 9160000
  },
];

export const rendimientosLote = {
  "L1": {
    ingresos: 5250000,
    gastos: 3875000,
    ganancia: 1375000,
    margen: 26.2,
    historia: [
      { mes: "Sep", ingreso: 850000, gasto: 650000 },
      { mes: "Oct", ingreso: 1200000, gasto: 980000 },
      { mes: "Nov", ingreso: 1550000, gasto: 1120000 },
      { mes: "Dic", ingreso: 980000, gasto: 580000 },
      { mes: "Ene", ingreso: 670000, gasto: 545000 },
    ]
  },
  "L2": {
    ingresos: 4680000,
    gastos: 3245000,
    ganancia: 1435000,
    margen: 30.7,
    historia: [
      { mes: "Sep", ingreso: 720000, gasto: 520000 },
      { mes: "Oct", ingreso: 1100000, gasto: 850000 },
      { mes: "Nov", ingreso: 1380000, gasto: 980000 },
      { mes: "Dic", ingreso: 850000, gasto: 480000 },
      { mes: "Ene", ingreso: 630000, gasto: 415000 },
    ]
  },
  "L3": {
    ingresos: 3920000,
    gastos: 2456000,
    ganancia: 1464000,
    margen: 37.3,
    historia: [
      { mes: "Sep", ingreso: 620000, gasto: 380000 },
      { mes: "Oct", ingreso: 950000, gasto: 720000 },
      { mes: "Nov", ingreso: 1180000, gasto: 820000 },
      { mes: "Dic", ingreso: 720000, gasto: 350000 },
      { mes: "Ene", ingreso: 450000, gasto: 186000 },
    ]
  },
};
