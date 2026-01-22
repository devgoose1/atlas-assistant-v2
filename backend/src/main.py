"""
ATLAS Assistant - Backend Main Entry Point

Handles:
- Speech recognition
- Assistant logic & reasoning
- System information (CPU, RAM, network)
- Task execution
- Communication with frontend via WebSockets
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any

import psutil

from websocket_server import WebSocketServer
from modules.notes import NoteModule

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AssistantCore:
    """Main brain of the ATLAS assistant."""
    
    def __init__(self):
        self.state = 'IDLE'
        self.logger = logger
        self.logger.info("ATLAS Assistant initialized")
    
    def set_state(self, new_state: str) -> None:
        """Update assistant state."""
        valid_states = ['IDLE', 'LISTENING', 'THINKING', 'RESPONDING', 'ERROR']
        if new_state in valid_states:
            self.state = new_state
            self.logger.info(f"State changed to: {new_state}")
        else:
            self.logger.warning(f"Invalid state: {new_state}")
    
    def process_voice_input(self, audio_data: bytes) -> str:
        """
        Process voice input and convert to text.
        TODO: Implement speech recognition
        """
        self.set_state('THINKING')
        # Speech-to-text logic here
        return "Voice input received"
    
    def get_system_info(self) -> Dict[str, Any]:
        """Get current system information."""
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory': {
                'percent': psutil.virtual_memory().percent,
                'available_gb': psutil.virtual_memory().available / (1024**3),
            },
            'timestamp': datetime.now().isoformat(),
        }
    
    def process_assistant_request(self, query: str) -> str:
        """
        Process user query and generate response.
        TODO: Implement LLM integration
        """
        self.set_state('THINKING')
        response = f"Processing: {query}"
        self.set_state('RESPONDING')
        return response


async def main():
    """Main entry point."""
    logger.info("Starting ATLAS Assistant Backend")
    assistant = AssistantCore()
    
    # Create WebSocket server
    ws_server = WebSocketServer(host='localhost', port=8765)
    
    # Register message handlers
    async def handle_system_info(data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle system info requests."""
        system_info = assistant.get_system_info()
        return {
            'type': 'system_info',
            'data': system_info
        }
    
    async def handle_state_change(data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle assistant state changes."""
        new_state = data.get('state', 'IDLE')
        assistant.set_state(new_state)
        return {
            'type': 'state_changed',
            'state': assistant.state
        }
    
    async def handle_voice_input(data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle voice input."""
        audio_data = data.get('audio', b'')
        result = assistant.process_voice_input(audio_data)
        return {
            'type': 'voice_processed',
            'result': result
        }
    
    # Register core handlers
    ws_server.register_handler('get_system_info', handle_system_info)
    ws_server.register_handler('change_state', handle_state_change)
    ws_server.register_handler('voice_input', handle_voice_input)

    # Register modules
    note_module = NoteModule()
    note_module.register(ws_server.register_handler)
    
    # Start WebSocket server
    try:
        logger.info("Backend running. Press Ctrl+C to exit.")
        await ws_server.start()
    except KeyboardInterrupt:
        logger.info("Shutting down gracefully...")


if __name__ == '__main__':
    asyncio.run(main())
