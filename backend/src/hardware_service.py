"""Hardware catalog service.

Provides a separate pathway for managing Arduino/Raspberry Pi parts and
circuit templates. Designed to work offline by default and sync on-demand.
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional

from hardware_database import get_hardware_database

logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------------
# Source registry (extend with real fetchers later)
# ----------------------------------------------------------------------------

def _mock_source_arduino() -> List[Dict[str, Any]]:
    now = datetime.utcnow().isoformat() + "Z"
    return [
        {
            "name": "Arduino Uno R3",
            "platform": "Arduino",
            "category": "Board",
            "description": "ATmega328P development board with 14 digital IO and 6 analog inputs.",
            "specs": {"flash_kb": 32, "clock_mhz": 16, "usb": "Type-B"},
            "source": "mock-arduino",
            "source_url": "https://www.arduino.cc/en/Guide/ArduinoUno",
            "last_seen": now,
        },
        {
            "name": "Arduino Nano",
            "platform": "Arduino",
            "category": "Board",
            "description": "Compact ATmega328P board for breadboard prototyping.",
            "specs": {"flash_kb": 32, "clock_mhz": 16, "usb": "Mini-B"},
            "source": "mock-arduino",
            "source_url": "https://store.arduino.cc/products/arduino-nano",
            "last_seen": now,
        },
        {
            "name": "HC-05 Bluetooth Module",
            "platform": "Arduino",
            "category": "Wireless",
            "description": "Classic Bluetooth serial module for wireless UART links.",
            "specs": {"voltage": "3.3-6V", "protocol": "Bluetooth 2.0"},
            "source": "mock-arduino",
            "source_url": "https://components.example/hc-05",
            "last_seen": now,
        },
    ]

def _mock_source_rpi() -> List[Dict[str, Any]]:
    now = datetime.utcnow().isoformat() + "Z"
    return [
        {
            "name": "Raspberry Pi 4 Model B 4GB",
            "platform": "Raspberry Pi",
            "category": "Board",
            "description": "Quad-core 1.5GHz, 4GB RAM, dual micro-HDMI.",
            "specs": {"ram_gb": 4, "usb3": 2, "ethernet": "Gigabit"},
            "source": "mock-rpi",
            "source_url": "https://www.raspberrypi.com/products/raspberry-pi-4-model-b/",
            "last_seen": now,
        },
        {
            "name": "Raspberry Pi Pico W",
            "platform": "Raspberry Pi",
            "category": "Board",
            "description": "RP2040 microcontroller with onboard Wi‑Fi.",
            "specs": {"wifi": "2.4GHz", "flash_mb": 2},
            "source": "mock-rpi",
            "source_url": "https://www.raspberrypi.com/products/raspberry-pi-pico-w/",
            "last_seen": now,
        },
        {
            "name": "DHT22 Temperature Sensor",
            "platform": "Cross-platform",
            "category": "Sensor",
            "description": "Digital temp/humidity sensor usable with Arduino and Raspberry Pi.",
            "specs": {"temp_range_c": "-40..80", "humidity": "0-100%"},
            "source": "mock-rpi",
            "source_url": "https://components.example/dht22",
            "last_seen": now,
        },
    ]

SOURCE_REGISTRY = {
    "mock-arduino": _mock_source_arduino,
    "mock-rpi": _mock_source_rpi,
}

# ----------------------------------------------------------------------------
# Core helpers
# ----------------------------------------------------------------------------

def _serialize_specs(specs: Optional[Dict[str, Any]]) -> str:
    if specs is None:
        return "{}"
    return json.dumps(specs, ensure_ascii=False)


def upsert_part(part: Dict[str, Any]) -> int:
    db = get_hardware_database()
    specs_json = _serialize_specs(part.get("specs"))
    last_seen = part.get("last_seen") or (datetime.utcnow().isoformat() + "Z")

    query = (
        """
        INSERT INTO parts (name, platform, category, description, specs, source, source_url, last_seen)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(name, platform, source) DO UPDATE SET
            category = excluded.category,
            description = excluded.description,
            specs = excluded.specs,
            source_url = excluded.source_url,
            last_seen = excluded.last_seen
        """
    )

    params = (
        part.get("name", "").strip(),
        part.get("platform", "Unknown"),
        part.get("category"),
        part.get("description"),
        specs_json,
        part.get("source", "manual"),
        part.get("source_url"),
        last_seen,
    )

    return db.execute_write(query, params)


def bulk_import_parts(parts: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
    inserted = 0
    for part in parts:
        if not part.get("name"):
            continue
        upsert_part(part)
        inserted += 1

    total = count_parts()
    return {"imported": inserted, "total": total}


def count_parts() -> int:
    db = get_hardware_database()
    result = db.execute("SELECT COUNT(*) AS count FROM parts")
    return int(result[0]["count"]) if result else 0


def list_parts(query: Optional[str] = None, platform: Optional[str] = None, category: Optional[str] = None, limit: int = 200) -> List[Dict[str, Any]]:
    db = get_hardware_database()
    sql = "SELECT id, name, platform, category, description, specs, source, source_url, last_seen, created_at FROM parts WHERE 1=1"
    params: List[Any] = []

    if platform:
        sql += " AND platform = ?"
        params.append(platform)
    if category:
        sql += " AND category = ?"
        params.append(category)
    if query:
        like = f"%{query}%"
        sql += " AND (name LIKE ? OR description LIKE ?)"
        params.extend([like, like])

    sql += " ORDER BY platform, category, name LIMIT ?"
    params.append(limit)

    rows = db.execute(sql, params)
    for row in rows:
        try:
            row["specs"] = json.loads(row.get("specs") or "{}")
        except Exception:
            row["specs"] = {}
    return rows


def refresh_catalog(sources: Optional[List[str]] = None) -> Dict[str, Any]:
    selected_sources = sources or list(SOURCE_REGISTRY.keys())
    collected: List[Dict[str, Any]] = []
    missing: List[str] = []

    for source in selected_sources:
        loader = SOURCE_REGISTRY.get(source)
        if not loader:
            missing.append(source)
            continue
        try:
            batch = loader()
            collected.extend(batch)
            logger.info("Loaded %s items from %s", len(batch), source)
        except Exception as exc:
            logger.error("Failed to load from %s: %s", source, exc)

    summary = bulk_import_parts(collected)
    summary.update({"sources": selected_sources, "missing_sources": missing})
    return summary


def list_circuits() -> List[Dict[str, Any]]:
    db = get_hardware_database()
    circuits = db.execute(
        "SELECT id, name, platform, description, notes, layout, created_at, updated_at FROM circuits ORDER BY created_at DESC"
    )

    if not circuits:
        return []

    part_map: Dict[int, List[Dict[str, Any]]] = {}
    ids = [c["id"] for c in circuits]
    placeholders = ",".join(["?"] * len(ids))
    rows = db.execute(
        f"""
        SELECT cp.circuit_id, p.id as part_id, p.name, p.platform, p.category, cp.quantity
        FROM circuit_parts cp
        JOIN parts p ON cp.part_id = p.id
        WHERE cp.circuit_id IN ({placeholders})
        ORDER BY p.name
        """,
        ids,
    )
    for row in rows:
        part_map.setdefault(row["circuit_id"], []).append(
            {
                "id": row["part_id"],
                "name": row["name"],
                "platform": row["platform"],
                "category": row["category"],
                "quantity": row.get("quantity", 1),
            }
        )

    for circuit in circuits:
        circuit["parts"] = part_map.get(circuit["id"], [])
        if circuit.get("layout"):
            try:
                circuit["layout"] = json.loads(circuit["layout"])
            except Exception:
                circuit["layout"] = None

    return circuits


def save_circuit(name: str, platform: Optional[str], description: Optional[str], notes: Optional[str], part_ids: List[Dict[str, Any]], layout: Optional[Dict[str, Any]] = None, circuit_id: Optional[int] = None) -> Dict[str, Any]:
    if not name or not name.strip():
        raise ValueError("Circuit name is verplicht")

    db = get_hardware_database()
    now = datetime.utcnow().isoformat() + "Z"
    layout_json = json.dumps(layout) if layout else None

    if circuit_id:
        db.execute_write(
            """UPDATE circuits SET name = ?, platform = ?, description = ?, notes = ?, layout = ?, updated_at = ? WHERE id = ?""",
            (name.strip(), platform, description, notes, layout_json, now, circuit_id),
        )
        cid = circuit_id
    else:
        cid = db.execute_write(
            """INSERT INTO circuits (name, platform, description, notes, layout) VALUES (?, ?, ?, ?, ?)""",
            (name.strip(), platform, description, notes, layout_json),
        )

    db.execute_write("DELETE FROM circuit_parts WHERE circuit_id = ?", (cid,))

    for link in part_ids:
        pid = link.get("id")
        quantity = link.get("quantity", 1)
        if pid is None:
            continue
        db.execute_write(
            """INSERT OR REPLACE INTO circuit_parts (circuit_id, part_id, quantity) VALUES (?, ?, ?)""",
            (cid, pid, quantity),
        )

    return {"id": cid, "name": name.strip(), "platform": platform, "description": description, "notes": notes, "layout": layout, "updated_at": now}
