"""
WebSocket server for communication between frontend and backend
"""

import asyncio
import json
import logging
from typing import Callable, Dict, Any, Set

import websockets
from websockets.server import WebSocketServerProtocol

logger = logging.getLogger(__name__)


class WebSocketServer:
    """Handles WebSocket connections with frontend."""
    
    def __init__(self, host: str = 'localhost', port: int = 8765):
        self.host = host
        self.port = port
        self.logger = logger
        self.clients: Set[WebSocketServerProtocol] = set()
        self.message_handlers: Dict[str, Callable] = {}
    
    def register_handler(self, message_type: str, handler: Callable) -> None:
        """Register a handler for a message type."""
        self.message_handlers[message_type] = handler
        self.logger.info(f"Registered handler for message type: {message_type}")
    
    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Send message to all connected clients."""
        if self.clients:
            message_json = json.dumps(message)
            websockets.broadcast(self.clients, message_json)
            self.logger.info(f"Broadcast message to {len(self.clients)} clients: {message.get('type', 'unknown')}")
    
    async def handle_client(self, websocket: WebSocketServerProtocol) -> None:
        """Handle a client connection."""
        self.clients.add(websocket)
        client_id = id(websocket)
        self.logger.info(f"Client {client_id} connected. Total clients: {len(self.clients)}")
        
        try:
            # Send welcome message
            await websocket.send(json.dumps({
                'type': 'connection',
                'status': 'connected',
                'message': 'Connected to ATLAS Assistant'
            }))
            
            # Listen for messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    message_type = data.get('type', 'unknown')
                    self.logger.info(f"Received message from {client_id}: {message_type}")
                    
                    # Call registered handler if exists
                    if message_type in self.message_handlers:
                        response = await self.message_handlers[message_type](data)
                        if response:
                            await websocket.send(json.dumps(response))
                    else:
                        self.logger.warning(f"No handler for message type: {message_type}")
                        
                except json.JSONDecodeError:
                    self.logger.error(f"Invalid JSON from client {client_id}")
                except Exception as e:
                    self.logger.error(f"Error handling message from {client_id}: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            self.logger.info(f"Client {client_id} disconnected")
        finally:
            self.clients.remove(websocket)
            self.logger.info(f"Client {client_id} removed. Total clients: {len(self.clients)}")
    
    async def start(self) -> None:
        """Start the WebSocket server."""
        self.logger.info(f"WebSocket server starting on ws://{self.host}:{self.port}")
        async with websockets.serve(self.handle_client, self.host, self.port):
            self.logger.info("WebSocket server is running")
            await asyncio.Future()  # Run forever
