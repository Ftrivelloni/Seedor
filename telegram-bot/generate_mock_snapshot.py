"""
generate_mock_snapshot.py — Genera data/snapshot.json desde mock_data.py
=========================================================================
Usar para testing local sin necesitar la app Next.js corriendo.

Uso:
    python generate_mock_snapshot.py
"""

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from mock_data import get_all_workers, get_all_fields, get_all_tasks

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
SNAPSHOT_PATH = DATA_DIR / "snapshot.json"

snapshot = {
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "tenant": {"id": "mock-tenant-1", "name": "Seedor Demo"},
    "workers": [
        {
            "id": w["id"],
            "first_name": w["first_name"],
            "last_name": w["last_name"],
            "phone": w.get("phone"),
            "function_type": w.get("function_type"),
            "active": w.get("active", True),
        }
        for w in get_all_workers()
    ],
    "fields": [
        {
            "id": f["id"],
            "name": f["name"],
            "location": f.get("location"),
            "lots": [
                {
                    "id": l["id"],
                    "name": l["name"],
                    "area_hectares": l.get("area_hectares"),
                    "production_type": l.get("production_type"),
                }
                for l in f.get("lots", [])
            ],
        }
        for f in get_all_fields()
    ],
    "tasks": [
        {
            "id": t["id"],
            "description": t["description"],
            "task_type": t["task_type"],
            "status": t["status"],
            "start_date": t["start_date"],
            "due_date": t["due_date"],
            "assigned_worker_ids": t.get("assigned_worker_ids", []),
            "lot_ids": t.get("lot_ids", []),
        }
        for t in get_all_tasks()
    ],
}

DATA_DIR.mkdir(parents=True, exist_ok=True)
fd, tmp = tempfile.mkstemp(dir=str(DATA_DIR), suffix=".tmp")
try:
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)
    os.replace(tmp, str(SNAPSHOT_PATH))
except Exception:
    if os.path.exists(tmp):
        os.unlink(tmp)
    raise

w = len(snapshot["workers"])
fi = len(snapshot["fields"])
t = len(snapshot["tasks"])
print(f"✅ Snapshot generado: {w} trabajadores, {fi} fincas, {t} tareas")
print(f"   → {SNAPSHOT_PATH}")
