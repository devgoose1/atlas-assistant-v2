"""Simple note module for ATLAS Assistant."""

import logging
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class NoteModule:
    """Handles CRUD operations for simple text notes."""

    def __init__(self) -> None:
        self.notes: List[Dict[str, Any]] = []
        self.next_id = 1

    def register(self, register_handler) -> None:
        """Register message handlers with the WebSocket server."""
        register_handler('notes/list', self.handle_list_notes)
        register_handler('notes/add', self.handle_add_note)
        register_handler('notes/delete', self.handle_delete_note)
        logger.info("NoteModule handlers registered")

    async def handle_list_notes(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'type': 'notes/list',
            'notes': self.notes,
        }

    async def handle_add_note(self, data: Dict[str, Any]) -> Dict[str, Any]:
        text = (data.get('text') or '').strip()
        if not text:
            return {
                'type': 'notes/error',
                'message': 'Note text cannot be empty.'
            }

        note = {
            'id': self.next_id,
            'text': text,
            'created_at': datetime.utcnow().isoformat() + 'Z',
        }
        self.next_id += 1
        self.notes.append(note)
        logger.info("Note added: %s", note)
        return {
            'type': 'notes/added',
            'note': note,
            'notes': self.notes,
        }

    async def handle_delete_note(self, data: Dict[str, Any]) -> Dict[str, Any]:
        note_id = data.get('id')
        before_count = len(self.notes)
        self.notes = [n for n in self.notes if n.get('id') != note_id]
        after_count = len(self.notes)

        if before_count == after_count:
            return {
                'type': 'notes/error',
                'message': f'Note with id {note_id} not found.'
            }

        logger.info("Note deleted: %s", note_id)
        return {
            'type': 'notes/deleted',
            'id': note_id,
            'notes': self.notes,
        }
