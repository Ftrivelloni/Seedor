"""
mock_data.py — Simulated Seedor Production Database
====================================================
Contains realistic farm data that mirrors the real Prisma schema
(Worker, Field, Lot, Task, TaskAssignment, TaskLot).

This module is the "Source of Truth" for the sync service.
It is NEVER imported by the bot.
"""

from datetime import date, timedelta

# ─── Today helper ──────────────────────────────────────────
_today = date.today()

# ═══════════════════════════════════════════════════════════
# WORKERS
# ═══════════════════════════════════════════════════════════
WORKERS = [
    {
        "id": "w1",
        "first_name": "Juan",
        "last_name": "Pérez",
        "dni": "30456789",
        "phone": "+542995751149",
        "function_type": "Tractorista",
        "payment_type": "HOURLY",
        "hourly_rate": 2500.0,
        "active": True,
    },
    {
        "id": "w2",
        "first_name": "Carlos",
        "last_name": "Gómez",
        "dni": "32789012",
        "phone": "+541137809999",
        "function_type": "Fumigador",
        "payment_type": "PER_TASK",
        "task_rate": 18000.0,
        "active": True,
    },
    {
        "id": "w3",
        "first_name": "María",
        "last_name": "López",
        "dni": "28345678",
        "phone": "+5493816001003",
        "function_type": "Cosechadora",
        "payment_type": "PER_TASK",
        "task_rate": 1500.0,
        "active": True,
    },
    {
        "id": "w4",
        "first_name": "Roberto",
        "last_name": "Fernández",
        "dni": "35678901",
        "phone": "+5493816001004",
        "function_type": "Embalador",
        "payment_type": "HOURLY",
        "hourly_rate": 2200.0,
        "active": True,
    },
    {
        "id": "w5",
        "first_name": "Ana",
        "last_name": "Martínez",
        "dni": "29012345",
        "phone": "+5493816001005",
        "function_type": "Podadora",
        "payment_type": "PER_TASK",
        "task_rate": 12000.0,
        "active": True,
    },
    {
        "id": "w6",
        "first_name": "Miguel",
        "last_name": "Sánchez",
        "dni": "27890123",
        "phone": "+5493816001006",
        "function_type": "Capataz",
        "payment_type": "FIXED_SALARY",
        "fixed_salary": 450000.0,
        "active": True,
    },
]

# ═══════════════════════════════════════════════════════════
# FIELDS & LOTS
# ═══════════════════════════════════════════════════════════
FIELDS = [
    {
        "id": "f1",
        "name": "Finca El Naranjo",
        "location": "Ruta 302 km 15, Tucumán",
        "description": "Plantación principal de citrus",
        "lots": [
            {
                "id": "l1",
                "name": "Lote A-1",
                "area_hectares": 12.5,
                "production_type": "Naranja Valencia",
                "planted_fruits": "Naranja Valencia Late",
            },
            {
                "id": "l2",
                "name": "Lote A-2",
                "area_hectares": 8.0,
                "production_type": "Limón",
                "planted_fruits": "Limón Eureka",
            },
            {
                "id": "l3",
                "name": "Lote B-1",
                "area_hectares": 15.0,
                "production_type": "Mandarina",
                "planted_fruits": "Mandarina Murcott",
            },
        ],
    },
    {
        "id": "f2",
        "name": "Finca San Martín",
        "location": "Ruta 38 km 42, Tucumán",
        "description": "Finca de producción mixta",
        "lots": [
            {
                "id": "l4",
                "name": "Lote C-1",
                "area_hectares": 20.0,
                "production_type": "Naranja Navel",
                "planted_fruits": "Naranja Washington Navel",
            },
            {
                "id": "l5",
                "name": "Lote C-2",
                "area_hectares": 10.0,
                "production_type": "Pomelo",
                "planted_fruits": "Pomelo Rosado",
            },
            {
                "id": "l6",
                "name": "Lote D-1",
                "area_hectares": 6.5,
                "production_type": "Limón",
                "planted_fruits": "Limón Génova",
            },
        ],
    },
]

# ═══════════════════════════════════════════════════════════
# TASKS (with assignments to workers and lots)
# ═══════════════════════════════════════════════════════════
TASKS = [
    {
        "id": "t1",
        "description": "Aplicación de herbicida en sector norte",
        "task_type": "Fumigación",
        "status": "PENDING",
        "start_date": _today.isoformat(),
        "due_date": (_today + timedelta(days=2)).isoformat(),
        "assigned_worker_ids": ["w2"],
        "lot_ids": ["l1"],
    },
    {
        "id": "t2",
        "description": "Poda de formación en cítricos jóvenes",
        "task_type": "Poda",
        "status": "IN_PROGRESS",
        "start_date": (_today - timedelta(days=1)).isoformat(),
        "due_date": (_today + timedelta(days=3)).isoformat(),
        "assigned_worker_ids": ["w5"],
        "lot_ids": ["l2"],
    },
    {
        "id": "t3",
        "description": "Cosecha de naranja Valencia — primera pasada",
        "task_type": "Cosecha",
        "status": "PENDING",
        "start_date": _today.isoformat(),
        "due_date": (_today + timedelta(days=5)).isoformat(),
        "assigned_worker_ids": ["w3", "w4"],
        "lot_ids": ["l1"],
    },
    {
        "id": "t4",
        "description": "Rastreo con tractor entre hileras",
        "task_type": "Labranza",
        "status": "PENDING",
        "start_date": (_today + timedelta(days=1)).isoformat(),
        "due_date": (_today + timedelta(days=4)).isoformat(),
        "assigned_worker_ids": ["w1"],
        "lot_ids": ["l3", "l4"],
    },
    {
        "id": "t5",
        "description": "Aplicación de fertilizante foliar",
        "task_type": "Fumigación",
        "status": "IN_PROGRESS",
        "start_date": (_today - timedelta(days=2)).isoformat(),
        "due_date": _today.isoformat(),
        "assigned_worker_ids": ["w2"],
        "lot_ids": ["l4"],
    },
    {
        "id": "t6",
        "description": "Cosecha de limón Eureka — segunda pasada",
        "task_type": "Cosecha",
        "status": "COMPLETED",
        "start_date": (_today - timedelta(days=5)).isoformat(),
        "due_date": (_today - timedelta(days=2)).isoformat(),
        "assigned_worker_ids": ["w3"],
        "lot_ids": ["l2"],
    },
    {
        "id": "t7",
        "description": "Revisión de riego por goteo",
        "task_type": "Mantenimiento",
        "status": "PENDING",
        "start_date": (_today + timedelta(days=2)).isoformat(),
        "due_date": (_today + timedelta(days=6)).isoformat(),
        "assigned_worker_ids": ["w1", "w6"],
        "lot_ids": ["l5"],
    },
    {
        "id": "t8",
        "description": "Embalado y etiquetado de cajas — pedido interno",
        "task_type": "Empaque",
        "status": "PENDING",
        "start_date": _today.isoformat(),
        "due_date": (_today + timedelta(days=1)).isoformat(),
        "assigned_worker_ids": ["w4"],
        "lot_ids": ["l6"],
    },
]


# ═══════════════════════════════════════════════════════════
# Accessor functions (used by sync_service.py)
# ═══════════════════════════════════════════════════════════

def get_all_workers() -> list[dict]:
    """Return all workers (simulates SELECT * FROM workers)."""
    return WORKERS


def get_all_fields() -> list[dict]:
    """Return all fields with nested lots."""
    return FIELDS


def get_all_tasks() -> list[dict]:
    """Return all active tasks with their assignments."""
    return [t for t in TASKS if t["status"] != "COMPLETED"]
