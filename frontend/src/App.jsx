import { useState, useEffect, useRef, useMemo } from 'react'
import NoteModule from './modules/NoteModule'
import SystemModule from './modules/SystemModule'
import ModuleTemplate from './modules/ModuleTemplate'
import './App.css'

function App() {
  const [assistantState, setAssistantState] = useState('IDLE')
  const [systemInfo, setSystemInfo] = useState({ cpu_percent: 0, memory: { percent: 0 } })
  const [isConnected, setIsConnected] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const [notes, setNotes] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [openedModuleId, setOpenedModuleId] = useState(null)
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
      id: 'template',
      label: 'Template',
      icon: '✨',
      component: ModuleTemplate,
      props: {},
    },
  ]), [notes, systemInfo])

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
    setOpenedModuleId(module?.id || null)
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
            const scale = normalized === 0 ? 1 : 0.8
            const opacity = normalized === 0 ? 1 : 0.6
            const translate = normalized * 110
            return (
              <div
                key={module.id}
                className={`module-chip ${normalized === 0 ? 'active' : ''}`}
                style={{ transform: `translateX(${translate}px) scale(${scale})`, opacity }}
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
        <div className="module-shell">
          <ActiveComponent
            {...(activeModule.props || {})}
            isConnected={isConnected}
            onAdd={(text) => sendMessage({ type: 'notes/add', text })}
            onDelete={(id) => sendMessage({ type: 'notes/delete', id })}
            sendMessage={sendMessage}
          />
        </div>
      )}
    </div>
  )
}

export default App
