// Template for new ATLAS Assistant modules (frontend)
// Copy and adjust names/message types to match backend module

function ModuleTemplate({ sendMessage, isConnected }) {
  const handlePing = () => {
    sendMessage?.({ type: 'template/ping' })
  }

  return (
    <div className="module-template">
      <div className="module-template__header">Template Module</div>
      <button onClick={handlePing} disabled={!isConnected}>
        Send Ping
      </button>
    </div>
  )
}

export default ModuleTemplate
