"""
System utilities for ATLAS Assistant

Provides helpers for:
- System monitoring
- Process management
- File operations
"""

import psutil
from typing import Dict, Any


def get_system_stats() -> Dict[str, Any]:
    """Gather current system statistics."""
    return {
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_percent': psutil.disk_usage('/').percent,
        'processes': len(psutil.pids()),
    }


def get_memory_info() -> Dict[str, Any]:
    """Get detailed memory information."""
    mem = psutil.virtual_memory()
    return {
        'total_gb': mem.total / (1024**3),
        'available_gb': mem.available / (1024**3),
        'used_gb': mem.used / (1024**3),
        'percent': mem.percent,
    }
