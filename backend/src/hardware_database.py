"""Dedicated SQLite database for hardware components and circuit designs.

This database is intentionally separate from the core atlas.db so that the
parts catalog can grow independently and be updated via manual syncs.
"""

import logging
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

logger = logging.getLogger(__name__)


class HardwareDatabase:
    """SQLite manager for the hardware catalog and circuit data."""

    def __init__(self, db_path: str = "backend/data/hardware_parts.db") -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_database()
        logger.info("Hardware database ready at %s", self.db_path)

    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _init_database(self) -> None:
        with self.get_connection() as conn:
            cur = conn.cursor()

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS parts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    category TEXT,
                    description TEXT,
                    specs TEXT,
                    source TEXT,
                    source_url TEXT,
                    last_seen TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    UNIQUE(name, platform, source)
                )
                """
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS circuits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    platform TEXT,
                    description TEXT,
                    notes TEXT,
                    layout TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT
                )
                """
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS circuit_parts (
                    circuit_id INTEGER NOT NULL,
                    part_id INTEGER NOT NULL,
                    quantity REAL DEFAULT 1,
                    PRIMARY KEY (circuit_id, part_id),
                    FOREIGN KEY(circuit_id) REFERENCES circuits(id) ON DELETE CASCADE,
                    FOREIGN KEY(part_id) REFERENCES parts(id) ON DELETE CASCADE
                )
                """
            )

            cur.execute("CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_parts_platform ON parts(platform)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_circuits_platform ON circuits(platform)")

            conn.commit()
            logger.info("Hardware tables initialized")

    def execute(self, query: str, params: Iterable[Any] = ()) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def execute_write(self, query: str, params: Iterable[Any] = ()) -> int:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(query, tuple(params))
            return cur.lastrowid if cur.lastrowid else cur.rowcount


_hardware_db: Optional[HardwareDatabase] = None


def get_hardware_database() -> HardwareDatabase:
    global _hardware_db
    if _hardware_db is None:
        _hardware_db = HardwareDatabase()
    return _hardware_db
