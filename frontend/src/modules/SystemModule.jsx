function SystemModule({ systemInfo }) {
  const cpu = systemInfo?.cpu_percent ?? 0
  const ram = systemInfo?.memory?.percent ?? 0

  return (
    <div className="module-card">
      <div className="module-card__header">System Monitor</div>
      <div className="module-card__metrics">
        <div className="metric">
          <div className="metric__label">CPU</div>
          <div className="metric__value">{cpu.toFixed(1)}%</div>
        </div>
        <div className="metric">
          <div className="metric__label">RAM</div>
          <div className="metric__value">{ram.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}

export default SystemModule
