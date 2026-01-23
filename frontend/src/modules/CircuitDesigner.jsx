import { useEffect, useRef, useState } from 'react'

function CircuitDesigner({ isConnected, sendMessage }) {
  const canvasRef = useRef(null)
  const [parts, setParts] = useState([])
  const [placedComponents, setPlacedComponents] = useState([])
  const [wires, setWires] = useState([])
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [draggingFromCatalog, setDraggingFromCatalog] = useState(null)
  const [wireStart, setWireStart] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [circuitName, setCircuitName] = useState('Nieuw Circuit')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isConnected) {
      sendMessage?.({ type: 'hardware/parts/list', limit: 500 })
    }
  }, [isConnected, sendMessage])

  useEffect(() => {
    const handleMessage = (data) => {
      if (data.type === 'hardware/parts/list') {
        setParts(data.parts || [])
      }
    }
    window.addEventListener('ws-message', (e) => handleMessage(e.detail))
    return () => window.removeEventListener('ws-message', handleMessage)
  }, [])

  const handleCatalogDragStart = (e, part) => {
    setDraggingFromCatalog(part)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleCanvasDrop = (e) => {
    e.preventDefault()
    if (!draggingFromCatalog) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom

    const newComponent = {
      id: `comp-${Date.now()}`,
      part: draggingFromCatalog,
      x,
      y,
      rotation: 0,
      pins: generatePins(draggingFromCatalog),
    }

    setPlacedComponents([...placedComponents, newComponent])
    setDraggingFromCatalog(null)
  }

  const generatePins = (part) => {
    const category = part.category?.toLowerCase() || ''
    const name = part.name?.toLowerCase() || ''
    
    // Genereer pins op basis van type onderdeel
    if (category.includes('board') || name.includes('arduino') || name.includes('raspberry')) {
      return [
        { id: 'pin-gnd', label: 'GND', type: 'power', side: 'left', offset: 0 },
        { id: 'pin-5v', label: '5V', type: 'power', side: 'left', offset: 1 },
        { id: 'pin-3v3', label: '3.3V', type: 'power', side: 'left', offset: 2 },
        { id: 'pin-d0', label: 'D0', type: 'digital', side: 'right', offset: 0 },
        { id: 'pin-d1', label: 'D1', type: 'digital', side: 'right', offset: 1 },
        { id: 'pin-a0', label: 'A0', type: 'analog', side: 'right', offset: 2 },
      ]
    } else if (category.includes('sensor')) {
      return [
        { id: 'pin-vcc', label: 'VCC', type: 'power', side: 'left', offset: 0 },
        { id: 'pin-gnd', label: 'GND', type: 'power', side: 'left', offset: 1 },
        { id: 'pin-out', label: 'OUT', type: 'signal', side: 'right', offset: 0 },
      ]
    } else if (category.includes('motor') || category.includes('actuator')) {
      return [
        { id: 'pin-pos', label: '+', type: 'power', side: 'left', offset: 0 },
        { id: 'pin-neg', label: '-', type: 'power', side: 'left', offset: 1 },
        { id: 'pin-ctrl', label: 'CTRL', type: 'signal', side: 'right', offset: 0 },
      ]
    } else {
      return [
        { id: 'pin-in', label: 'IN', type: 'signal', side: 'left', offset: 0 },
        { id: 'pin-out', label: 'OUT', type: 'signal', side: 'right', offset: 0 },
      ]
    }
  }

  const handleComponentDragStart = (e, component) => {
    e.dataTransfer.effectAllowed = 'move'
    setSelectedComponent(component)
  }

  const handleComponentDrag = (e, componentId) => {
    if (!e.clientX || !e.clientY) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom

    setPlacedComponents(prev => prev.map(c => 
      c.id === componentId ? { ...c, x, y } : c
    ))
  }

  const handlePinClick = (component, pin) => {
    if (!wireStart) {
      setWireStart({ component, pin })
    } else {
      if (wireStart.component.id !== component.id) {
        const newWire = {
          id: `wire-${Date.now()}`,
          from: { componentId: wireStart.component.id, pinId: wireStart.pin.id },
          to: { componentId: component.id, pinId: pin.id },
          color: getPinColor(wireStart.pin.type),
        }
        setWires([...wires, newWire])
      }
      setWireStart(null)
    }
  }

  const getPinColor = (type) => {
    const colors = {
      power: '#ff4444',
      ground: '#333333',
      digital: '#44ff44',
      analog: '#4444ff',
      signal: '#ffff44',
    }
    return colors[type] || '#888888'
  }

  const getPinPosition = (component, pin) => {
    const componentWidth = 120
    const componentHeight = 80
    const pinSpacing = 20

    const baseX = component.x
    const baseY = component.y

    switch (pin.side) {
      case 'left':
        return { x: baseX, y: baseY + 20 + pin.offset * pinSpacing }
      case 'right':
        return { x: baseX + componentWidth, y: baseY + 20 + pin.offset * pinSpacing }
      case 'top':
        return { x: baseX + 20 + pin.offset * pinSpacing, y: baseY }
      case 'bottom':
        return { x: baseX + 20 + pin.offset * pinSpacing, y: baseY + componentHeight }
      default:
        return { x: baseX, y: baseY }
    }
  }

  const handleCanvasMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
    }
  }

  const handleCanvasMouseUp = () => {
    setIsPanning(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.2, Math.min(3, prev * delta)))
  }

  const handleSaveCircuit = () => {
    const circuitData = {
      name: circuitName,
      platform: 'Mixed',
      description: `Circuit met ${placedComponents.length} onderdelen`,
      layout: {
        components: placedComponents,
        wires: wires,
        zoom: zoom,
        pan: pan,
      },
      parts: placedComponents.map(c => ({ id: c.part.id, quantity: 1 })),
    }

    sendMessage?.({ type: 'hardware/circuits/save', ...circuitData })
  }

  const handleDeleteComponent = (componentId) => {
    setPlacedComponents(prev => prev.filter(c => c.id !== componentId))
    setWires(prev => prev.filter(w => 
      w.from.componentId !== componentId && w.to.componentId !== componentId
    ))
    setSelectedComponent(null)
  }

  const handleDeleteWire = (wireId) => {
    setWires(prev => prev.filter(w => w.id !== wireId))
  }

  const filteredParts = parts.filter(part =>
    part.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="circuit-designer">
      <div className="circuit-designer__toolbar">
        <input
          type="text"
          value={circuitName}
          onChange={(e) => setCircuitName(e.target.value)}
          className="circuit-name-input"
          placeholder="Circuit naam..."
        />
        <button onClick={handleSaveCircuit} disabled={!isConnected || placedComponents.length === 0}>
          💾 Opslaan
        </button>
        <button onClick={() => setPlacedComponents([])}>🗑️ Wissen</button>
        <div className="zoom-controls">
          <button onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}>🔍+</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(prev => Math.max(0.2, prev * 0.8))}>🔍-</button>
        </div>
      </div>

      <div className="circuit-designer__main">
        <div className="circuit-designer__sidebar">
          <div className="sidebar-header">
            <h3>Onderdelen Catalog</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek onderdeel..."
              className="sidebar-search"
            />
          </div>
          <div className="sidebar-parts">
            {filteredParts.map((part) => (
              <div
                key={part.id}
                className="sidebar-part"
                draggable
                onDragStart={(e) => handleCatalogDragStart(e, part)}
              >
                <div className="sidebar-part__name">{part.name}</div>
                <div className="sidebar-part__meta">
                  <span className="pill pill--small">{part.platform}</span>
                  {part.category && <span className="pill pill--small pill--ghost">{part.category}</span>}
                </div>
              </div>
            ))}
            {filteredParts.length === 0 && (
              <div className="sidebar-empty">Geen onderdelen gevonden</div>
            )}
          </div>
        </div>

        <div
          ref={canvasRef}
          className="circuit-designer__canvas"
          onDrop={handleCanvasDrop}
          onDragOver={(e) => e.preventDefault()}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isPanning ? 'grabbing' : 'default' }}
        >
          <div
            className="canvas-content"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Grid background */}
            <svg className="canvas-grid" width="5000" height="5000">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="rgba(100, 200, 255, 0.15)" />
                </pattern>
              </defs>
              <rect width="5000" height="5000" fill="url(#grid)" />
            </svg>

            {/* Render wires */}
            <svg className="canvas-wires" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {wires.map((wire) => {
                const fromComp = placedComponents.find(c => c.id === wire.from.componentId)
                const toComp = placedComponents.find(c => c.id === wire.to.componentId)
                if (!fromComp || !toComp) return null

                const fromPin = fromComp.pins.find(p => p.id === wire.from.pinId)
                const toPin = toComp.pins.find(p => p.id === wire.to.pinId)
                if (!fromPin || !toPin) return null

                const start = getPinPosition(fromComp, fromPin)
                const end = getPinPosition(toComp, toPin)

                return (
                  <g key={wire.id} style={{ pointerEvents: 'all' }} onClick={() => handleDeleteWire(wire.id)}>
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={wire.color}
                      strokeWidth="3"
                      style={{ cursor: 'pointer' }}
                    />
                    <circle cx={start.x} cy={start.y} r="4" fill={wire.color} />
                    <circle cx={end.x} cy={end.y} r="4" fill={wire.color} />
                  </g>
                )
              })}
            </svg>

            {/* Render components */}
            {placedComponents.map((component) => (
              <div
                key={component.id}
                className={`canvas-component ${selectedComponent?.id === component.id ? 'selected' : ''}`}
                style={{
                  position: 'absolute',
                  left: component.x,
                  top: component.y,
                  transform: `rotate(${component.rotation}deg)`,
                }}
                draggable
                onDragStart={(e) => handleComponentDragStart(e, component)}
                onDrag={(e) => handleComponentDrag(e, component.id)}
                onClick={() => setSelectedComponent(component)}
              >
                <div className="canvas-component__header">
                  <span className="canvas-component__name">{component.part.name}</span>
                  <button
                    className="canvas-component__delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteComponent(component.id)
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="canvas-component__body">
                  {component.pins.map((pin) => {
                    const isWireStart = wireStart?.component.id === component.id && wireStart?.pin.id === pin.id
                    return (
                      <div
                        key={pin.id}
                        className={`canvas-pin canvas-pin--${pin.side} ${isWireStart ? 'wire-start' : ''}`}
                        style={{ '--pin-color': getPinColor(pin.type) }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePinClick(component, pin)
                        }}
                        title={`${pin.label} (${pin.type})`}
                      >
                        <span className="canvas-pin__label">{pin.label}</span>
                        <div className="canvas-pin__dot" />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="circuit-designer__help">
        💡 Sleep onderdelen naar het canvas · Klik op pins om draden te verbinden · Shift+drag om te pannen · Scroll om te zoomen
      </div>
    </div>
  )
}

export default CircuitDesigner
