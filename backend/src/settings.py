"""Settings manager for ATLAS Assistant using JSON files."""

import json
import logging
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger(__name__)


class Settings:
    """JSON-based settings manager for application configuration."""

    def __init__(self, settings_path: str = "backend/data/settings.json") -> None:
        """Initialize settings manager.
        
        Args:
            settings_path: Path to the settings JSON file
        """
        self.settings_path = Path(settings_path)
        self.settings_path.parent.mkdir(parents=True, exist_ok=True)
        self._settings: Dict[str, Any] = {}
        self._load_settings()
        logger.info(f"Settings loaded from {self.settings_path}")

    def _load_settings(self) -> None:
        """Load settings from JSON file."""
        if self.settings_path.exists():
            try:
                with open(self.settings_path, 'r', encoding='utf-8') as f:
                    self._settings = json.load(f)
                logger.info("Settings loaded successfully")
            except Exception as e:
                logger.error(f"Error loading settings: {e}")
                self._settings = self._get_default_settings()
                self._save_settings()
        else:
            self._settings = self._get_default_settings()
            self._save_settings()

    def _save_settings(self) -> None:
        """Save settings to JSON file."""
        try:
            with open(self.settings_path, 'w', encoding='utf-8') as f:
                json.dump(self._settings, f, indent=2, ensure_ascii=False)
            logger.info("Settings saved successfully")
        except Exception as e:
            logger.error(f"Error saving settings: {e}")

    def _get_default_settings(self) -> Dict[str, Any]:
        """Get default settings."""
        return {
            "assistant": {
                "name": "ATLAS",
                "voice_enabled": False,
                "language": "nl-NL"
            },
            "ui": {
                "theme": "dark",
                "animations_enabled": True
            },
            "system": {
                "update_interval_ms": 2000,
                "log_level": "INFO"
            }
        }

    def get(self, key: str, default: Any = None) -> Any:
        """Get a setting value by key (supports dot notation).
        
        Args:
            key: Setting key (e.g., "assistant.name")
            default: Default value if key not found
            
        Returns:
            Setting value or default
        """
        keys = key.split('.')
        value = self._settings
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        return value

    def set(self, key: str, value: Any) -> None:
        """Set a setting value by key (supports dot notation).
        
        Args:
            key: Setting key (e.g., "assistant.name")
            value: Value to set
        """
        keys = key.split('.')
        target = self._settings
        for k in keys[:-1]:
            if k not in target or not isinstance(target[k], dict):
                target[k] = {}
            target = target[k]
        target[keys[-1]] = value
        self._save_settings()

    def get_all(self) -> Dict[str, Any]:
        """Get all settings."""
        return self._settings.copy()


# Global settings instance
_settings_instance: Settings = None


def get_settings() -> Settings:
    """Get or create the global settings instance."""
    global _settings_instance
    if _settings_instance is None:
        _settings_instance = Settings()
    return _settings_instance
