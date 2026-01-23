import { useEffect, useMemo, useState } from 'react'

const platformOptions = ['Alle', 'Arduino', 'Raspberry Pi', 'Cross-platform']

function HardwareModule({ parts = [], meta = {}, isConnected, sendMessage }) {
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState('Alle')
  const [category, setCategory] = useState('')

  useEffect(() => {
    if (!isConnected) return
    sendMessage?.({ type: 'hardware/parts/list', limit: 200 })
  }, [isConnected, sendMessage])

  const filteredParts = useMemo(() => {
    return parts.map((part) => ({ ...part, specs: part.specs || {} }))
  }, [parts])

  const handleSearch = () => {
    sendMessage?.({
      type: 'hardware/parts/search',
      query: query.trim() || undefined,
      platform: platform === 'Alle' ? undefined : platform,
      category: category.trim() || undefined,
      limit: 200,
    })
  }

  return (
    <div className="module-card">
      <div className="module-card__header">Hardware Catalog</div>

      <div className="hardware-controls">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek onderdelen..."
          disabled={!isConnected}
        />
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} disabled={!isConnected}>
          {platformOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Categorie (bijv. Sensor)"
          disabled={!isConnected}
        />
        <button onClick={handleSearch} disabled={!isConnected}>Zoeken</button>
      </div>

      <div className="hardware-meta">
        <span>{meta?.total || 0} onderdelen in catalogus</span>
        {meta?.platform && <span>Platform: {meta.platform}</span>}
        {meta?.category && <span>Categorie: {meta.category}</span>}
        {!isConnected && <span className="offline">Offline modus</span>}
      </div>

      <div className="hardware-list">
        {filteredParts.length === 0 && (
          <div className="hardware-empty">Geen onderdelen gevonden. Probeer een andere zoekopdracht.</div>
        )}
        {filteredParts.map((part) => (
          <div key={`${part.id}-${part.source}`} className="hardware-item">
            <div className="hardware-item__title">{part.name}</div>
            <div className="hardware-item__meta">
              <span className="pill">{part.platform || 'Onbekend'}</span>
              {part.category && <span className="pill pill--ghost">{part.category}</span>}
              {part.source && <span className="pill pill--ghost">{part.source}</span>}
            </div>
            {part.description && <div className="hardware-item__desc">{part.description}</div>}
            {Object.keys(part.specs || {}).length > 0 && (
              <div className="hardware-item__specs">
                {Object.entries(part.specs).map(([key, value]) => (
                  <span key={key} className="pill pill--spec">{key}: {String(value)}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default HardwareModule
