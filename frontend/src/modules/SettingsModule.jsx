function SettingsModule({ isConnected, sendMessage, hardwareSync }) {
  const handleSync = () => {
    sendMessage?.({ type: 'hardware/import', sources: ['mock-arduino', 'mock-rpi'] })
  }

  return (
    <div className="module-card">
      <div className="module-card__header">Instellingen</div>

      <div className="settings-section">
        <div className="settings-row">
          <div>
            <div className="settings-label">Hardware catalogus bijwerken</div>
            <div className="settings-help">
              Haal alle Arduino en Raspberry Pi onderdelen opnieuw op en sla ze lokaal op. Werkt alleen op verzoek zodat offline modus behouden blijft.
            </div>
          </div>
          <button onClick={handleSync} disabled={!isConnected}>Fetch onderdelen</button>
        </div>

        <div className="settings-row settings-status">
          <div className="settings-label">Laatste status</div>
          <div className="settings-help">
            {hardwareSync?.message || 'Nog niet gesynchroniseerd.'}
          </div>
          {hardwareSync?.summary && (
            <div className="settings-help">
              {hardwareSync.summary.imported} geimporteerd · totaal {hardwareSync.summary.total}
            </div>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="settings-notice">Offline. Verbinding nodig om onderdelen te fetchen.</div>
      )}
    </div>
  )
}

export default SettingsModule
