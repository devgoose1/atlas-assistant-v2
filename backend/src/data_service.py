"""Central data service for ATLAS Assistant.

This module provides a clean interface for data operations.
Other modules should use these functions instead of accessing the database directly.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from database import get_database

logger = logging.getLogger(__name__)


# ============================================================================
# NOTES DATA OPERATIONS
# ============================================================================

def get_all_notes() -> List[Dict[str, Any]]:
    """Get all notes from database, ordered by creation date (newest first)."""
    db = get_database()
    return db.execute(
        "SELECT id, text, created_at FROM notes ORDER BY created_at DESC"
    )


def add_note(text: str) -> Dict[str, Any]:
    """Add a new note to the database.
    
    Args:
        text: The note text content
        
    Returns:
        The created note with id, text, and created_at
        
    Raises:
        ValueError: If text is empty
    """
    if not text or not text.strip():
        raise ValueError("Note text cannot be empty")
    
    db = get_database()
    created_at = datetime.utcnow().isoformat() + 'Z'
    note_id = db.execute_write(
        "INSERT INTO notes (text, created_at) VALUES (?, ?)",
        (text.strip(), created_at)
    )
    
    logger.info(f"Note created with ID: {note_id}")
    
    return {
        'id': note_id,
        'text': text.strip(),
        'created_at': created_at,
    }


def delete_note(note_id: int) -> bool:
    """Delete a note from the database.
    
    Args:
        note_id: The ID of the note to delete
        
    Returns:
        True if note was deleted, False if not found
    """
    db = get_database()
    rows_affected = db.execute_write(
        "DELETE FROM notes WHERE id = ?",
        (note_id,)
    )
    
    if rows_affected > 0:
        logger.info(f"Note deleted: ID {note_id}")
        return True
    else:
        logger.warning(f"Note not found: ID {note_id}")
        return False


def get_note_by_id(note_id: int) -> Optional[Dict[str, Any]]:
    """Get a specific note by ID.
    
    Args:
        note_id: The ID of the note to retrieve
        
    Returns:
        The note if found, None otherwise
    """
    db = get_database()
    results = db.execute(
        "SELECT id, text, created_at FROM notes WHERE id = ?",
        (note_id,)
    )
    return results[0] if results else None


def update_note(note_id: int, text: str) -> bool:
    """Update an existing note.
    
    Args:
        note_id: The ID of the note to update
        text: The new text content
        
    Returns:
        True if note was updated, False if not found
        
    Raises:
        ValueError: If text is empty
    """
    if not text or not text.strip():
        raise ValueError("Note text cannot be empty")
    
    db = get_database()
    updated_at = datetime.utcnow().isoformat() + 'Z'
    rows_affected = db.execute_write(
        "UPDATE notes SET text = ?, updated_at = ? WHERE id = ?",
        (text.strip(), updated_at, note_id)
    )
    
    if rows_affected > 0:
        logger.info(f"Note updated: ID {note_id}")
        return True
    else:
        logger.warning(f"Note not found: ID {note_id}")
        return False


# ============================================================================
# FUTURE: Add more data operations here
# ============================================================================
# - Tasks (get_all_tasks, add_task, etc.)
# - Reminders
# - User preferences
# - Conversation history
# - System logs
