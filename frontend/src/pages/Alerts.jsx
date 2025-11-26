import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { alertsAPI } from '../services/api'
import './Alerts.css'

function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [ackInFlight, setAckInFlight] = useState({})
  const navigate = useNavigate()

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const response = await alertsAPI.getAlerts(filter)
      setAlerts(response.alerts || [])
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [filter])

  const handleAcknowledge = async (alertId) => {
    setAckInFlight((prev) => ({ ...prev, [alertId]: true }))
    try {
      await alertsAPI.acknowledgeAlert(alertId)
      await loadAlerts()
    } catch (err) {
      setError(err.message || 'Failed to acknowledge alert')
    } finally {
      setAckInFlight((prev) => ({ ...prev, [alertId]: false }))
    }
  }

  const statusChipClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'status-chip pending'
      case 'SENT':
        return 'status-chip sent'
      case 'ACKNOWLEDGED':
        return 'status-chip acknowledged'
      default:
        return 'status-chip'
    }
  }

  const summary = useMemo(() => {
    return alerts.reduce(
      (acc, alert) => {
        acc.total += 1
        acc[alert.status] = (acc[alert.status] || 0) + 1
        return acc
      },
      { total: 0, PENDING: 0, SENT: 0, ACKNOWLEDGED: 0 }
    )
  }, [alerts])

  return (
    <div className="alerts-container">
      <header className="alerts-header">
        <div>
          <h1>🚨 Emergency Alerts</h1>
          <p>Monitor SOS events and quickly confirm that you are responding.</p>
        </div>
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </header>

      <main className="alerts-main">
        <section className="alerts-card summary-card">
          <div className="summary-item">
            <span>Total Alerts</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="summary-item">
            <span>Pending</span>
            <strong>{summary.PENDING}</strong>
          </div>
          <div className="summary-item">
            <span>Acknowledged</span>
            <strong>{summary.ACKNOWLEDGED}</strong>
          </div>
        </section>

        <section className="alerts-card">
          <div className="card-header">
            <h2>Alert History</h2>
            <div className="filters">
              <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SENT">Sent</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
              </select>
              <button className="secondary" onClick={loadAlerts}>
                Refresh
              </button>
            </div>
          </div>
          {error && <div className="error-banner">{error}</div>}
          {loading ? (
            <div className="alerts-empty">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="alerts-empty">
              <p>No alerts yet.</p>
              <p>Shake detection or SOS button events will appear here.</p>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map((alert) => (
                <div key={alert.alert_id} className="alert-item">
                  <div className="alert-row">
                    <div>
                      <div className="alert-title">
                        {alert.child_name}
                        <span className={statusChipClass(alert.status)}>{alert.status}</span>
                      </div>
                      <div className="alert-meta">
                        <span>{alert.alert_type.replace('_', ' ')}</span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    {alert.status !== 'ACKNOWLEDGED' && (
                      <button
                        className="ack-button"
                        onClick={() => handleAcknowledge(alert.alert_id)}
                        disabled={ackInFlight[alert.alert_id]}
                      >
                        {ackInFlight[alert.alert_id] ? 'Acknowledging...' : 'Mark Acknowledged'}
                      </button>
                    )}
                  </div>
                  {alert.message && <p className="alert-message">{alert.message}</p>}
                  {alert.location && (
                    <p className="alert-location">
                      📍 {alert.location.address || `${alert.location.latitude.toFixed(5)}, ${alert.location.longitude.toFixed(5)}`}
                    </p>
                  )}
                  {alert.distribution_contacts.length > 0 && (
                    <div className="alert-contacts">
                      Notified:{' '}
                      {alert.distribution_contacts.map((contact) => contact.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Alerts


