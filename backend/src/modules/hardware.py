"""Hardware catalog module.

Provides offline-first access to Arduino/Raspberry Pi parts and circuit data.
"""

import logging
from typing import Any, Dict

import hardware_service

logger = logging.getLogger(__name__)


class HardwareModule:
    """WebSocket-facing module for hardware catalog operations."""

    def register(self, register_handler) -> None:
        register_handler("hardware/parts/list", self.handle_list_parts)
        register_handler("hardware/parts/search", self.handle_list_parts)
        register_handler("hardware/import", self.handle_import)
        register_handler("hardware/circuits/list", self.handle_list_circuits)
        register_handler("hardware/circuits/save", self.handle_save_circuit)
        register_handler("hardware/circuits/delete", self.handle_delete_circuit)
        register_handler("hardware/circuits/load", self.handle_load_circuit)
        logger.info("HardwareModule handlers registered")

    async def handle_list_parts(self, data: Dict[str, Any]) -> Dict[str, Any]:
        query = (data.get("query") or data.get("search") or "").strip() or None
        platform = data.get("platform") or None
        category = data.get("category") or None
        limit = int(data.get("limit", 200))

        parts = hardware_service.list_parts(query=query, platform=platform, category=category, limit=limit)
        return {
            "type": "hardware/parts/list",
            "parts": parts,
            "meta": {
                "query": query,
                "platform": platform,
                "category": category,
                "limit": limit,
                "total": hardware_service.count_parts(),
            },
        }

    async def handle_import(self, data: Dict[str, Any]) -> Dict[str, Any]:
        sources = data.get("sources")
        summary = hardware_service.refresh_catalog(sources)
        return {
            "type": "hardware/import/status",
            "summary": summary,
            "message": "Catalog refreshed",
        }

    async def handle_list_circuits(self, data: Dict[str, Any]) -> Dict[str, Any]:
        circuits = hardware_service.list_circuits()
        return {
            "type": "hardware/circuits/list",
            "circuits": circuits,
        }

    async def handle_save_circuit(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            circuit = hardware_service.save_circuit(
                name=data.get("name"),
                platform=data.get("platform"),
                description=data.get("description"),
                notes=data.get("notes"),
                part_ids=data.get("parts") or [],
                layout=data.get("layout"),
                circuit_id=data.get("id"),
            )
            circuits = hardware_service.list_circuits()
            return {
                "type": "hardware/circuits/saved",
                "circuit": circuit,
                "circuits": circuits,
            }
        except ValueError as exc:
            return {"type": "hardware/error", "message": str(exc)}
        except Exception as exc:
            logger.error("Circuit save failed: %s", exc)
            return {"type": "hardware/error", "message": "Circuit kon niet opgeslagen worden"}

    async def handle_delete_circuit(self, data: Dict[str, Any]) -> Dict[str, Any]:
        circuit_id = data.get("id")
        if not circuit_id:
            return {"type": "hardware/error", "message": "Circuit ID ontbreekt"}
        
        try:
            from hardware_database import get_hardware_database
            db = get_hardware_database()
            db.execute_write("DELETE FROM circuits WHERE id = ?", (circuit_id,))
            circuits = hardware_service.list_circuits()
            return {
                "type": "hardware/circuits/deleted",
                "id": circuit_id,
                "circuits": circuits,
            }
        except Exception as exc:
            logger.error("Circuit delete failed: %s", exc)
            return {"type": "hardware/error", "message": "Circuit kon niet verwijderd worden"}

    async def handle_load_circuit(self, data: Dict[str, Any]) -> Dict[str, Any]:
        circuit_id = data.get("id")
        if not circuit_id:
            return {"type": "hardware/error", "message": "Circuit ID ontbreekt"}
        
        try:
            from hardware_database import get_hardware_database
            import json
            db = get_hardware_database()
            results = db.execute(
                "SELECT id, name, platform, description, notes, layout, created_at, updated_at FROM circuits WHERE id = ?",
                (circuit_id,)
            )
            if not results:
                return {"type": "hardware/error", "message": "Circuit niet gevonden"}
            
            circuit = results[0]
            if circuit.get("layout"):
                try:
                    circuit["layout"] = json.loads(circuit["layout"])
                except Exception:
                    circuit["layout"] = None
            
            return {
                "type": "hardware/circuits/loaded",
                "circuit": circuit,
            }
        except Exception as exc:
            logger.error("Circuit load failed: %s", exc)
            return {"type": "hardware/error", "message": "Circuit kon niet geladen worden"}
