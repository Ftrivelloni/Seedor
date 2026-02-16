# 🌿 Seedor Telegram Bot

Telegram bot para trabajadores de campo de Seedor. Usa el patrón **Snapshot** para seguridad: nunca toca la base de datos de producción.

## Arquitectura

```
mock_data.py ──→ sync_service.py ──→ data/snapshot.json ──→ bot.py (lee)
                                                             ↓
                                                     data/updates_queue.json (escribe)
```

## Setup

```bash
# 1. Crear entorno virtual
cd telegram-bot
python3 -m venv venv
source venv/bin/activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Generar snapshot inicial
python sync_service.py

# 4. Configurar token del bot (obtener de @BotFather en Telegram)
export TELEGRAM_BOT_TOKEN="tu-token-aquí"

# 5. Ejecutar el bot
python bot.py
```

## Teléfonos de prueba

| Trabajador        | Teléfono         | Rol         |
|-------------------|------------------|-------------|
| Juan Pérez        | +5493816001001   | Tractorista |
| Carlos Gómez      | +5493816001002   | Fumigador   |
| María López       | +5493816001003   | Cosechadora |
| Roberto Fernández | +5493816001004   | Embalador   |
| Ana Martínez      | +5493816001005   | Podadora    |
| Miguel Sánchez    | +5493816001006   | Capataz     |

## Sync en modo daemon

```bash
python sync_service.py --daemon  # actualiza snapshot cada 60s
```
