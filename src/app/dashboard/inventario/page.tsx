'use client';

import { useState } from 'react';
import {
    Plus,
    Search,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronRight,
    Package,
    Warehouse,
    ArrowRightLeft,
    ArrowDownToLine,
    ArrowUpFromLine,
    X,
} from 'lucide-react';

// Types
interface Deposito {
    id: string;
    nombre: string;
    ubicacion: string;
}

interface Insumo {
    id: string;
    nombre: string;
    categoria: string;
    unidad: string;
    minimo: number;
    stockPorDeposito: Record<string, number>;
}

interface Movimiento {
    id: string;
    tipo: 'Ingreso' | 'Consumo' | 'Traslado';
    fecha: string;
    insumoId: string;
    insumoNombre: string;
    cantidad: number;
    depositoOrigenId: string | null;
    depositoDestinoId: string | null;
    usuario: string;
    notas?: string;
}

// Initial data
const initialDepositos: Deposito[] = [
    { id: 'D1', nombre: 'Depósito Central', ubicacion: 'Campo Norte - Sector A' },
    { id: 'D2', nombre: 'Depósito Secundario', ubicacion: 'Campo Norte - Sector B' },
    { id: 'D3', nombre: 'Depósito Sur', ubicacion: 'Campo Sur - Principal' },
];

const initialInsumos: Insumo[] = [
    { id: 'I1', nombre: 'Glifosato 48%', categoria: 'Herbicida', unidad: 'L', minimo: 30, stockPorDeposito: { D1: 50, D2: 20, D3: 15 } },
    { id: 'I2', nombre: 'Fertilizante NPK 15-15-15', categoria: 'Fertilizante', unidad: 'Bolsa 50kg', minimo: 20, stockPorDeposito: { D1: 5, D2: 4, D3: 3 } },
    { id: 'I3', nombre: 'Fungicida Sistémico', categoria: 'Fungicida', unidad: 'L', minimo: 10, stockPorDeposito: { D1: 2, D2: 2, D3: 1 } },
    { id: 'I4', nombre: 'Semilla Soja RG', categoria: 'Semilla', unidad: 'Bolsa 20kg', minimo: 50, stockPorDeposito: { D1: 80, D2: 25, D3: 15 } },
    { id: 'I5', nombre: 'Coadyuvante', categoria: 'Adyuvante', unidad: 'L', minimo: 15, stockPorDeposito: { D1: 15, D2: 8, D3: 5 } },
    { id: 'I6', nombre: 'Insecticida Piretroide', categoria: 'Insecticida', unidad: 'L', minimo: 12, stockPorDeposito: { D1: 5, D2: 2, D3: 1 } },
];

const categorias = ['Herbicida', 'Fertilizante', 'Fungicida', 'Semilla', 'Adyuvante', 'Insecticida', 'Otro'];

export default function InventarioPage() {
    // State
    const [depositos, setDepositos] = useState<Deposito[]>(initialDepositos);
    const [insumos, setInsumos] = useState<Insumo[]>(initialInsumos);
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [expandedDepositos, setExpandedDepositos] = useState<Set<string>>(new Set(['D1']));
    const [busqueda, setBusqueda] = useState('');
    const [activeTab, setActiveTab] = useState<'depositos' | 'items' | 'movimientos'>('depositos');

    // Modal states
    const [showNewItemModal, setShowNewItemModal] = useState(false);
    const [showNewDepositoModal, setShowNewDepositoModal] = useState(false);
    const [showMovimientoModal, setShowMovimientoModal] = useState(false);
    const [movimientoType, setMovimientoType] = useState<'Ingreso' | 'Consumo' | 'Traslado'>('Ingreso');

    // Form states
    const [newItem, setNewItem] = useState({ nombre: '', categoria: 'Herbicida', unidad: '', minimo: 0 });
    const [newDeposito, setNewDeposito] = useState({ nombre: '', ubicacion: '' });
    const [movimientoForm, setMovimientoForm] = useState({
        insumoId: '',
        cantidad: 0,
        depositoOrigenId: '',
        depositoDestinoId: '',
        notas: '',
    });

    // Toggle deposito expansion
    const toggleDeposito = (depositoId: string) => {
        setExpandedDepositos(prev => {
            const newSet = new Set(prev);
            if (newSet.has(depositoId)) {
                newSet.delete(depositoId);
            } else {
                newSet.add(depositoId);
            }
            return newSet;
        });
    };

    // Get stock status
    const getStockStatus = (insumo: Insumo) => {
        const total = Object.values(insumo.stockPorDeposito).reduce((a, b) => a + b, 0);
        if (total === 0) return 'sin-stock';
        if (total < insumo.minimo) return 'bajo';
        return 'ok';
    };

    // Get stock for specific deposit
    const getStockEnDeposito = (insumo: Insumo, depositoId: string) => {
        return insumo.stockPorDeposito[depositoId] || 0;
    };

    // Get total stock
    const getTotalStock = (insumo: Insumo) => {
        return Object.values(insumo.stockPorDeposito).reduce((a, b) => a + b, 0);
    };

    // Add new item to all deposits
    const handleAddItem = () => {
        if (!newItem.nombre || !newItem.unidad) return;

        const stockPorDeposito: Record<string, number> = {};
        depositos.forEach(d => {
            stockPorDeposito[d.id] = 0;
        });

        const nuevoInsumo: Insumo = {
            id: `I${Date.now()}`,
            nombre: newItem.nombre,
            categoria: newItem.categoria,
            unidad: newItem.unidad,
            minimo: newItem.minimo,
            stockPorDeposito,
        };

        setInsumos(prev => [...prev, nuevoInsumo]);
        setNewItem({ nombre: '', categoria: 'Herbicida', unidad: '', minimo: 0 });
        setShowNewItemModal(false);
    };

    // Add new deposito
    const handleAddDeposito = () => {
        if (!newDeposito.nombre) return;

        const nuevoDeposito: Deposito = {
            id: `D${Date.now()}`,
            nombre: newDeposito.nombre,
            ubicacion: newDeposito.ubicacion,
        };

        // Add new deposit to all existing items with 0 stock
        setInsumos(prev => prev.map(insumo => ({
            ...insumo,
            stockPorDeposito: {
                ...insumo.stockPorDeposito,
                [nuevoDeposito.id]: 0,
            },
        })));

        setDepositos(prev => [...prev, nuevoDeposito]);
        setNewDeposito({ nombre: '', ubicacion: '' });
        setShowNewDepositoModal(false);
    };

    // Handle movement
    const handleMovimiento = () => {
        if (!movimientoForm.insumoId || movimientoForm.cantidad <= 0) return;

        const insumo = insumos.find(i => i.id === movimientoForm.insumoId);
        if (!insumo) return;

        // Create movement record
        const nuevoMovimiento: Movimiento = {
            id: `M${Date.now()}`,
            tipo: movimientoType,
            fecha: new Date().toISOString().split('T')[0],
            insumoId: movimientoForm.insumoId,
            insumoNombre: insumo.nombre,
            cantidad: movimientoForm.cantidad,
            depositoOrigenId: movimientoType !== 'Ingreso' ? movimientoForm.depositoOrigenId : null,
            depositoDestinoId: movimientoType !== 'Consumo' ? movimientoForm.depositoDestinoId : null,
            usuario: 'Juan Pérez',
            notas: movimientoForm.notas,
        };

        // Update stock based on movement type
        setInsumos(prev => prev.map(ins => {
            if (ins.id !== movimientoForm.insumoId) return ins;

            const newStockPorDeposito = { ...ins.stockPorDeposito };

            if (movimientoType === 'Ingreso' && movimientoForm.depositoDestinoId) {
                newStockPorDeposito[movimientoForm.depositoDestinoId] =
                    (newStockPorDeposito[movimientoForm.depositoDestinoId] || 0) + movimientoForm.cantidad;
            } else if (movimientoType === 'Consumo' && movimientoForm.depositoOrigenId) {
                newStockPorDeposito[movimientoForm.depositoOrigenId] =
                    Math.max(0, (newStockPorDeposito[movimientoForm.depositoOrigenId] || 0) - movimientoForm.cantidad);
            } else if (movimientoType === 'Traslado' && movimientoForm.depositoOrigenId && movimientoForm.depositoDestinoId) {
                const stockOrigen = newStockPorDeposito[movimientoForm.depositoOrigenId] || 0;
                const cantidadReal = Math.min(stockOrigen, movimientoForm.cantidad);
                newStockPorDeposito[movimientoForm.depositoOrigenId] = stockOrigen - cantidadReal;
                newStockPorDeposito[movimientoForm.depositoDestinoId] =
                    (newStockPorDeposito[movimientoForm.depositoDestinoId] || 0) + cantidadReal;
            }

            return { ...ins, stockPorDeposito: newStockPorDeposito };
        }));

        setMovimientos(prev => [nuevoMovimiento, ...prev]);
        setMovimientoForm({ insumoId: '', cantidad: 0, depositoOrigenId: '', depositoDestinoId: '', notas: '' });
        setShowMovimientoModal(false);
    };

    // Open movement modal with preset values
    const openMovimientoModal = (type: 'Ingreso' | 'Consumo' | 'Traslado', depositoId?: string, insumoId?: string) => {
        setMovimientoType(type);
        setMovimientoForm({
            insumoId: insumoId || '',
            cantidad: 0,
            depositoOrigenId: type !== 'Ingreso' ? (depositoId || '') : '',
            depositoDestinoId: type !== 'Consumo' ? (depositoId || '') : '',
            notas: '',
        });
        setShowMovimientoModal(true);
    };

    // Filter insumos
    const insumosFiltrados = insumos.filter(i =>
        i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        i.categoria.toLowerCase().includes(busqueda.toLowerCase())
    );

    // Count items with stock in deposito
    const countItemsWithStock = (depositoId: string) => {
        return insumos.filter(i => (i.stockPorDeposito[depositoId] || 0) > 0).length;
    };

    // Count alerts in deposito
    const countAlertasInDeposito = (depositoId: string) => {
        return insumos.filter(i => {
            const stock = i.stockPorDeposito[depositoId] || 0;
            const status = getStockStatus(i);
            return stock > 0 && (status === 'bajo' || status === 'sin-stock');
        }).length;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Inventario</h1>
                    <p className="mt-0.5 text-sm text-gray-500">
                        Gestiona depósitos, insumos y movimientos de stock
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowNewDepositoModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Warehouse className="h-4 w-4" />
                        Nuevo Depósito
                    </button>
                    <button
                        onClick={() => setShowNewItemModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Insumo
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('depositos')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'depositos'
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Warehouse className="h-4 w-4 inline mr-2" />
                        Depósitos
                    </button>
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'items'
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Package className="h-4 w-4 inline mr-2" />
                        Todos los Insumos
                    </button>
                    <button
                        onClick={() => setActiveTab('movimientos')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'movimientos'
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <ArrowRightLeft className="h-4 w-4 inline mr-2" />
                        Movimientos
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar insumo..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            {/* Depositos Tab */}
            {activeTab === 'depositos' && (
                <div className="space-y-4">
                    {depositos.map((deposito) => (
                        <div key={deposito.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Deposito Header */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleDeposito(deposito.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {expandedDepositos.has(deposito.id) ? (
                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                    )}
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <Warehouse className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{deposito.nombre}</h3>
                                        <p className="text-sm text-gray-500">{deposito.ubicacion}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">{countItemsWithStock(deposito.id)} items</p>
                                        {countAlertasInDeposito(deposito.id) > 0 && (
                                            <p className="text-xs text-amber-600">{countAlertasInDeposito(deposito.id)} alertas</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => openMovimientoModal('Ingreso', deposito.id)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Ingreso"
                                        >
                                            <ArrowDownToLine className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => openMovimientoModal('Consumo', deposito.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Consumo"
                                        >
                                            <ArrowUpFromLine className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => openMovimientoModal('Traslado', deposito.id)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Traslado"
                                        >
                                            <ArrowRightLeft className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Items in Deposito */}
                            {expandedDepositos.has(deposito.id) && (
                                <div className="border-t border-gray-200">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <th className="px-4 py-3">Insumo</th>
                                                <th className="px-4 py-3">Categoría</th>
                                                <th className="px-4 py-3 text-right">Stock</th>
                                                <th className="px-4 py-3 text-right">Mínimo</th>
                                                <th className="px-4 py-3 text-center">Estado</th>
                                                <th className="px-4 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {insumosFiltrados.map((insumo) => {
                                                const stockEnDeposito = getStockEnDeposito(insumo, deposito.id);
                                                const status = getStockStatus(insumo);
                                                const rowBg = status === 'bajo' ? 'bg-amber-50' : status === 'sin-stock' ? 'bg-red-50' : '';

                                                return (
                                                    <tr key={insumo.id} className={`${rowBg} hover:bg-gray-50 transition-colors`}>
                                                        <td className="px-4 py-3">
                                                            <span className="font-medium text-gray-900">{insumo.nombre}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-sm text-gray-600">{insumo.categoria}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="font-medium text-gray-900">
                                                                {stockEnDeposito} {insumo.unidad}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-sm text-gray-500">
                                                                {insumo.minimo} {insumo.unidad}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-center">
                                                                {status === 'ok' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                                                {status === 'bajo' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                                                                {status === 'sin-stock' && <XCircle className="h-5 w-5 text-red-500" />}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => openMovimientoModal('Ingreso', deposito.id, insumo.id)}
                                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                                    title="Ingreso"
                                                                >
                                                                    <ArrowDownToLine className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => openMovimientoModal('Consumo', deposito.id, insumo.id)}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                    title="Consumo"
                                                                >
                                                                    <ArrowUpFromLine className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Items Tab */}
            {activeTab === 'items' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Insumo</th>
                                <th className="px-4 py-3">Categoría</th>
                                <th className="px-4 py-3 text-right">Stock Total</th>
                                <th className="px-4 py-3 text-right">Mínimo</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                                <th className="px-4 py-3">Distribución por Depósito</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {insumosFiltrados.map((insumo) => {
                                const total = getTotalStock(insumo);
                                const status = getStockStatus(insumo);
                                const rowBg = status === 'bajo' ? 'bg-amber-50' : status === 'sin-stock' ? 'bg-red-50' : '';

                                return (
                                    <tr key={insumo.id} className={`${rowBg} hover:bg-gray-50 transition-colors`}>
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-gray-900">{insumo.nombre}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                                {insumo.categoria}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="font-semibold text-gray-900">
                                                {total} {insumo.unidad}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm text-gray-500">
                                                {insumo.minimo} {insumo.unidad}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center">
                                                {status === 'ok' && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                        OK
                                                    </span>
                                                )}
                                                {status === 'bajo' && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                                        Bajo
                                                    </span>
                                                )}
                                                {status === 'sin-stock' && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                                        Sin Stock
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                {depositos.map(dep => {
                                                    const stock = insumo.stockPorDeposito[dep.id] || 0;
                                                    if (stock === 0) return null;
                                                    return (
                                                        <span key={dep.id} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                                            {dep.nombre.split(' ')[0]}: {stock}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Movimientos Tab */}
            {activeTab === 'movimientos' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => openMovimientoModal('Ingreso')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Registrar Movimiento
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {movimientos.length === 0 ? (
                            <div className="p-12 text-center">
                                <ArrowRightLeft className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">Sin movimientos</h3>
                                <p className="text-sm text-gray-500 mt-1">Los movimientos que registres aparecerán aquí</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3">Tipo</th>
                                        <th className="px-4 py-3">Insumo</th>
                                        <th className="px-4 py-3 text-right">Cantidad</th>
                                        <th className="px-4 py-3">Origen</th>
                                        <th className="px-4 py-3">Destino</th>
                                        <th className="px-4 py-3">Usuario</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {movimientos.map((mov) => (
                                        <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-600">{mov.fecha}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${mov.tipo === 'Ingreso'
                                                    ? 'bg-green-100 text-green-700'
                                                    : mov.tipo === 'Consumo'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {mov.tipo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{mov.insumoNombre}</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">{mov.cantidad}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {mov.depositoOrigenId ? depositos.find(d => d.id === mov.depositoOrigenId)?.nombre : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {mov.depositoDestinoId ? depositos.find(d => d.id === mov.depositoDestinoId)?.nombre : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{mov.usuario}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* New Item Modal */}
            {showNewItemModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowNewItemModal(false)} />
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Nuevo Insumo</h2>
                                <button onClick={() => setShowNewItemModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <p className="text-sm text-gray-500">
                                    El nuevo insumo se agregará a todos los depósitos con stock inicial de 0.
                                </p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newItem.nombre}
                                        onChange={(e) => setNewItem(p => ({ ...p, nombre: e.target.value }))}
                                        placeholder="Ej: Fertilizante Triple 15"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newItem.categoria}
                                        onChange={(e) => setNewItem(p => ({ ...p, categoria: e.target.value }))}
                                    >
                                        {categorias.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newItem.unidad}
                                        onChange={(e) => setNewItem(p => ({ ...p, unidad: e.target.value }))}
                                        placeholder="Ej: L, kg, Bolsa 50kg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newItem.minimo}
                                        onChange={(e) => setNewItem(p => ({ ...p, minimo: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowNewItemModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddItem}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                >
                                    Crear Insumo
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* New Deposito Modal */}
            {showNewDepositoModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowNewDepositoModal(false)} />
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Nuevo Depósito</h2>
                                <button onClick={() => setShowNewDepositoModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newDeposito.nombre}
                                        onChange={(e) => setNewDeposito(p => ({ ...p, nombre: e.target.value }))}
                                        placeholder="Ej: Depósito Norte"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={newDeposito.ubicacion}
                                        onChange={(e) => setNewDeposito(p => ({ ...p, ubicacion: e.target.value }))}
                                        placeholder="Ej: Campo Norte - Galpón B"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowNewDepositoModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddDeposito}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                >
                                    Crear Depósito
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Movimiento Modal */}
            {showMovimientoModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowMovimientoModal(false)} />
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {movimientoType === 'Ingreso' && 'Registrar Ingreso'}
                                    {movimientoType === 'Consumo' && 'Registrar Consumo'}
                                    {movimientoType === 'Traslado' && 'Registrar Traslado'}
                                </h2>
                                <button onClick={() => setShowMovimientoModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                {/* Movement Type Selector */}
                                <div className="flex gap-2">
                                    {(['Ingreso', 'Consumo', 'Traslado'] as const).map(tipo => (
                                        <button
                                            key={tipo}
                                            onClick={() => setMovimientoType(tipo)}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${movimientoType === tipo
                                                ? tipo === 'Ingreso'
                                                    ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                                    : tipo === 'Consumo'
                                                        ? 'bg-red-100 text-red-700 border-2 border-red-500'
                                                        : 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                                                : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                                                }`}
                                        >
                                            {tipo}
                                        </button>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Insumo</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={movimientoForm.insumoId}
                                        onChange={(e) => setMovimientoForm(p => ({ ...p, insumoId: e.target.value }))}
                                    >
                                        <option value="">Seleccionar insumo</option>
                                        {insumos.map(ins => (
                                            <option key={ins.id} value={ins.id}>{ins.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={movimientoForm.cantidad || ''}
                                        onChange={(e) => setMovimientoForm(p => ({ ...p, cantidad: parseInt(e.target.value) || 0 }))}
                                        min="1"
                                    />
                                </div>

                                {movimientoType !== 'Ingreso' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Depósito Origen</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                            value={movimientoForm.depositoOrigenId}
                                            onChange={(e) => setMovimientoForm(p => ({ ...p, depositoOrigenId: e.target.value }))}
                                        >
                                            <option value="">Seleccionar depósito</option>
                                            {depositos.map(dep => (
                                                <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {movimientoType !== 'Consumo' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Depósito Destino</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                            value={movimientoForm.depositoDestinoId}
                                            onChange={(e) => setMovimientoForm(p => ({ ...p, depositoDestinoId: e.target.value }))}
                                        >
                                            <option value="">Seleccionar depósito</option>
                                            {depositos
                                                .filter(dep => dep.id !== movimientoForm.depositoOrigenId)
                                                .map(dep => (
                                                    <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                                ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                        rows={2}
                                        value={movimientoForm.notas}
                                        onChange={(e) => setMovimientoForm(p => ({ ...p, notas: e.target.value }))}
                                        placeholder="Referencia, orden de compra, etc."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowMovimientoModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleMovimiento}
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${movimientoType === 'Ingreso'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : movimientoType === 'Consumo'
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    Registrar {movimientoType}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
