import { useState } from 'react'

function NoteModule({ notes = [], onAdd, onDelete, isConnected }) {
  const [draft, setDraft] = useState('')

  const handleAdd = () => {
    const text = draft.trim()
    if (!text) return
    onAdd?.(text)
    setDraft('')
  }

  return (
    <div className="note-module">
      <div className="note-module__header">
        <span className="note-module__title">Notes</span>
        <span className={`note-module__status ${isConnected ? 'online' : 'offline'}`}>
          {isConnected ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="note-module__input">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Quick note..."
          disabled={!isConnected}
        />
        <button onClick={handleAdd} disabled={!isConnected || !draft.trim()}>
          Add
        </button>
      </div>

      <div className="note-module__list">
        {notes.length === 0 && <div className="note-module__empty">No notes yet</div>}
        {notes.map((note) => (
          <div key={note.id} className="note-module__item">
            <div className="note-module__text">{note.text}</div>
            <div className="note-module__meta">
              <span>{new Date(note.created_at).toLocaleString()}</span>
              <button onClick={() => onDelete?.(note.id)} disabled={!isConnected}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NoteModule
