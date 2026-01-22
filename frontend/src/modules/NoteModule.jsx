import { useState } from 'react'

function NoteModule({ notes = [], isConnected, sendMessage }) {
  const [draft, setDraft] = useState('')

  const handleAdd = () => {
    const text = draft.trim()
    if (!text || !sendMessage) return
    sendMessage({ type: 'notes/add', text })
    setDraft('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && draft.trim() && isConnected) {
      handleAdd()
    }
  }

  return (
    <div className="note-module">
      <div className="note-module__header">
        <span className="note-module__title">My Notes</span>
        <span className={`note-module__status ${isConnected ? 'online' : 'offline'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Offline'}
        </span>
      </div>

      <div className="note-module__input">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a note and press Enter..."
          disabled={!isConnected}
          autoFocus
        />
        <button onClick={handleAdd} disabled={!isConnected || !draft.trim()}>
          ➕ Add
        </button>
      </div>

      <div className="note-module__list">
        {notes.length === 0 && (
          <div className="note-module__empty">
            📝 No notes yet. Start typing above!
          </div>
        )}
        {notes.map((note, index) => (
          <div 
            key={note.id} 
            className="note-module__item"
            style={{ '--item-index': index }}
          >
            <div className="note-module__text">{note.text}</div>
            <div className="note-module__meta">
              <span className="note-module__date">
                🕒 {new Date(note.created_at).toLocaleString('nl-NL', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <button 
                className="note-module__delete"
                onClick={() => sendMessage?.({ type: 'notes/delete', id: note.id })} 
                disabled={!isConnected}
                title="Delete note"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NoteModule
