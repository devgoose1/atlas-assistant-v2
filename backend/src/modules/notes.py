"""Simple note module for ATLAS Assistant."""

import logging
from typing import Any, Dict
import data_service

logger = logging.getLogger(__name__)


class NoteModule:
    """Handles CRUD operations for simple text notes."""

    def __init__(self) -> None:
        pass

    def register(self, register_handler) -> None:
        """Register message handlers with the WebSocket server."""
        register_handler('notes/list', self.handle_list_notes)
        register_handler('notes/add', self.handle_add_note)
        register_handler('notes/delete', self.handle_delete_note)
        logger.info("NoteModule handlers registered")

    async def handle_list_notes(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Get all notes from database."""
        notes = data_service.get_all_notes()
        return {
            'type': 'notes/list',
            'notes': notes,
        }

    async def handle_add_note(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new note to database."""
        text = (data.get('text') or '').strip()
        
        try:
            note = data_service.add_note(text)
            all_notes = data_service.get_all_notes()
            
            return {
                'type': 'notes/added',
                'note': note,
                'notes': all_notes,
            }
        except ValueError as e:
            return {
                'type': 'notes/error',
                'message': str(e)
            }

    async def handle_delete_note(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Delete a note from database."""
        note_id = data.get('id')
        
        success = data_service.delete_note(note_id)
        
        if not success:
            return {
                'type': 'notes/error',
                'message': f'Note with id {note_id} not found.'
            }
        
        all_notes = data_service.get_all_notes()
        
        return {
            'type': 'notes/deleted',
            'id': note_id,
            'notes': all_notes,
        }


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
