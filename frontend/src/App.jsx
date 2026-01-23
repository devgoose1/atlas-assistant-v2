import { useState, useEffect, useRef, useMemo } from 'react'
import NoteModule from './modules/NoteModule'
import SystemModule from './modules/SystemModule'
import ModuleTemplate from './modules/ModuleTemplate'
import HardwareModule from './modules/HardwareModule'
import SettingsModule from './modules/SettingsModule'
import CircuitDesigner from './modules/CircuitDesigner'
import './App.css'

function App() {
  const [assistantState, setAssistantState] = useState('IDLE')
  const [systemInfo, setSystemInfo] = useState({ cpu_percent: 0, memory: { percent: 0 } })
  const [isConnected, setIsConnected] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const [notes, setNotes] = useState([])
  const [hardwareParts, setHardwareParts] = useState([])
  const [hardwareMeta, setHardwareMeta] = useState({})
  const [hardwareSync, setHardwareSync] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [openedModuleId, setOpenedModuleId] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const wsRef = useRef(null)

  // Define available modules (each own component file)
  const modules = useMemo(() => ([
    {
      id: 'notes',
      label: 'Notes',
      icon: '🗒️',
      component: NoteModule,
      props: { notes },
    },
    {
      id: 'system',
      label: 'System',
      icon: '📊',
      component: SystemModule,
      props: { systemInfo },
    },
    {
      id: 'hardware',
      label: 'Hardware',
      icon: '🔌',
      component: HardwareModule,
      props: { parts: hardwareParts, meta: hardwareMeta },
    },
    {
      id: 'designer',
      label: 'Designer',
      icon: '🔧',
      component: CircuitDesigner,
      props: {},
    },
    {
      id: 'settings',
      label: 'Instellingen',
      icon: '⚙️',
      component: SettingsModule,
      props: { hardwareSync },
    },
    {
      id: 'template',
      label: 'Template',
      icon: '✨',
      component: ModuleTemplate,
      props: {},
    },
  ]), [notes, systemInfo, hardwareParts, hardwareMeta, hardwareSync])

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8765')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Connected to ATLAS Backend')
        setIsConnected(true)
        // Request initial system info
        ws.send(JSON.stringify({ type: 'get_system_info' }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Received:', data)

          switch (data.type) {
            case 'connection':
              console.log(data.message)
              break
            case 'system_info':
              setSystemInfo(data.data)
              break
            case 'state_changed':
              setAssistantState(data.state)
              break
            case 'notes/list':
              setNotes(data.notes || [])
              break
            case 'notes/added':
              setNotes(data.notes || [])
              break
            case 'notes/deleted':
              setNotes(data.notes || [])
              break
            case 'notes/error':
              console.warn('Notes error:', data.message)
              break
            case 'hardware/parts/list':
            case 'hardware/parts/search':
              setHardwareParts(data.parts || [])
              setHardwareMeta(data.meta || {})
              break
            case 'hardware/import/status':
              setHardwareSync({ message: data.message, summary: data.summary })
              sendMessage({ type: 'hardware/parts/list' })
              break
            case 'hardware/error':
              console.warn('Hardware error:', data.message)
              break
            case 'hardware/circuits/saved':
            case 'hardware/circuits/loaded':
            case 'hardware/circuits/deleted':
              console.log('Circuit operation:', data.type)
              break
            default:
              console.log('Unknown message type:', data.type)
          }
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }

      ws.onclose = () => {
        console.log('Disconnected from backend')
        setIsConnected(false)
        // Attempt reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }
    }

    connectWebSocket()

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Request system info every 2 seconds
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'get_system_info' }))
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isConnected])

  // Fetch notes once connected
  useEffect(() => {
    if (isConnected && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'notes/list' }))
      wsRef.current.send(JSON.stringify({ type: 'hardware/parts/list' }))
    }
  }, [isConnected])

  const sendMessage = (payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }

  const handleWheel = (event) => {
    event.preventDefault()
    if (!modules.length) return
    const direction = event.deltaY > 0 ? 1 : -1
    const nextIndex = (selectedIndex + direction + modules.length) % modules.length
    setSelectedIndex(nextIndex)
  }

  const handleOpenModule = () => {
    const module = modules[selectedIndex]
    setIsClosing(false)
    setOpenedModuleId(module?.id || null)
    setFabOpen(false)
  }

  const handleCloseModule = () => {
    setIsClosing(true)
    setFabOpen(false)
    setTimeout(() => {
      setOpenedModuleId(null)
      setIsClosing(false)
    }, 500) // Match animation duration
  }

  const activeModule = modules.find((m) => m.id === openedModuleId)
  const ActiveComponent = activeModule?.component

  const handleMicrophoneClick = () => {
    if (assistantState === 'IDLE') {
      setAssistantState('LISTENING')
      sendMessage({ type: 'change_state', state: 'LISTENING' })
    } else if (assistantState === 'LISTENING') {
      setAssistantState('IDLE')
      sendMessage({ type: 'change_state', state: 'IDLE' })
    }
  }

  return (
    <div className="atlas-container">
      <div className="background-layer">
        {/* Starfield and particle effects will go here */}
      </div>
      
      <div className="main-interface">
        <div className={`center-orb ${assistantState.toLowerCase()}`}>
          <div className="pulse-ring"></div>
          <button 
            className="microphone-btn" 
            onClick={handleMicrophoneClick}
            title={assistantState}
          >
            <span className="mic-icon">{assistantState === 'LISTENING' ? '🎤' : '⚪'}</span>
          </button>
        </div>
        
        <div className="module-ring" onWheel={handleWheel}>
          {modules.map((module, idx) => {
            const offset = idx - selectedIndex
            const normalized = ((offset + modules.length + Math.floor(modules.length / 2)) % modules.length) - Math.floor(modules.length / 2)
            const distance = Math.abs(normalized)
            const scale = normalized === 0 ? 1.1 : 0.82
            const opacity = normalized === 0 ? 1 : 0.45
            const translate = normalized * 52
            const zIndex = modules.length - distance
            return (
              <div
                key={module.id}
                className={`module-chip ${normalized === 0 ? 'active' : ''}`}
                style={{ transform: `translateX(${translate}px) scale(${scale})`, opacity, zIndex }}
                onClick={() => setSelectedIndex(idx)}
              >
                <div className="module-chip__icon">{module.icon}</div>
                <div className="module-chip__label">{module.label}</div>
              </div>
            )
          })}
        </div>

        <div className="module-actions">
          <button className="open-btn" onClick={handleOpenModule} disabled={!modules.length}>
            Open
          </button>
          <div className="module-indicator">{modules[selectedIndex]?.label}</div>
        </div>
      </div>

      <div className="status-panel">
        <div className="status-item">
          <span className="status-label">Time:</span> {currentTime}
        </div>
        <div className="status-item">
          <span className="status-label">CPU:</span> {systemInfo.cpu_percent?.toFixed(1)}%
        </div>
        <div className="status-item">
          <span className="status-label">RAM:</span> {systemInfo.memory?.percent?.toFixed(1)}%
        </div>
        <div className="status-item">
          <span className={`status-label ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢' : '🔴'} {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="voice-feedback">
        <div className="assistant-state">{assistantState}</div>
      </div>

      {ActiveComponent && (
        <div className={`module-overlay ${isClosing ? 'closing' : ''}`}>
          <div className="module-overlay__header">
            <div className="module-overlay__title">{activeModule.label}</div>
            <div className="module-overlay__subtitle">Active module</div>
          </div>
          <div className="module-overlay__content">
            <ActiveComponent
              {...(activeModule.props || {})}
              isConnected={isConnected}
              sendMessage={sendMessage}
            />
          </div>

          <div className={`fab ${fabOpen ? 'open' : ''}`}>
            <button className="fab__main" onClick={() => setFabOpen((v) => !v)}>
              {fabOpen ? '×' : '⋯'}
            </button>
            <div className="fab__items">
              <button
                className="fab__item"
                style={{ '--i': 0 }}
                onClick={() => {
                  sendMessage({ type: 'notes/list' })
                  sendMessage({ type: 'get_system_info' })
                  setFabOpen(false)
                }}
                title="Refresh"
              >
                ↻
              </button>
              <button
                className="fab__item"
                style={{ '--i': 1 }}
                onClick={() => {
                  setAssistantState('IDLE')
                  sendMessage({ type: 'change_state', state: 'IDLE' })
                  setFabOpen(false)
                }}
                title="Set IDLE"
              >
                ◎
              </button>
              <button
                className="fab__item"
                style={{ '--i': 2 }}
                onClick={handleCloseModule}
                title="Back to menu"
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
