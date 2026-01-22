"""Template for new ATLAS Assistant backend modules.

Usage:
- Copy this file and rename the class and message types.
- Implement register() to bind handlers to the WebSocket server.
- Handlers should be async and return a dict that can be JSON-serialized.
"""

import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)


class ModuleTemplate:
    """Example module template."""

    def __init__(self) -> None:
        # Initialize module state here
        pass

    def register(self, register_handler) -> None:
        """Register message handlers with the WebSocket server.

        Example message types:
        - 'template/ping'
        - 'template/action'
        """
        register_handler('template/ping', self.handle_ping)
        register_handler('template/action', self.handle_action)
        logger.info("ModuleTemplate handlers registered")

    async def handle_ping(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'type': 'template/pong',
            'message': 'pong'
        }

    async def handle_action(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Implement your module logic
        return {
            'type': 'template/result',
            'result': 'ok'
        }
