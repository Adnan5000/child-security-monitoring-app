import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI, deviceStatusAPI } from '../services/api'
import LocationMap from '../components/LocationMap'
import './Dashboard.css'

function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deviceStatuses, setDeviceStatuses] = useState([])
  const [statusError, setStatusError] = useState('')
  const [statusLoading, setStatusLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUser = async () => {
      if (!authAPI.isAuthenticated()) {
        navigate('/login')
        return
      }

      try {
        const userData = await authAPI.getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error('Error fetching user:', error)
        authAPI.logout()
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await deviceStatusAPI.listStatuses()
        setDeviceStatuses(response.devices || [])
        setStatusError('')
      } catch (err) {
        setStatusError(err.message || 'Unable to load device statuses')
      } finally {
        setStatusLoading(false)
      }
    }

    fetchStatuses()
    const interval = setInterval(fetchStatuses, 20000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    authAPI.logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>🛡️ Child Security Dashboard</h1>
          <p>Welcome back, {user?.first_name}!</p>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-card">
          <h2>Account Information</h2>
          <div className="info-section">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">
                {user?.first_name} {user?.last_name}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user?.email}</span>
            </div>
            {user?.phone_number && (
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">{user?.phone_number}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className={`info-value ${user?.is_verified ? 'verified' : 'unverified'}`}>
                {user?.is_verified ? '✓ Verified' : '⚠ Not Verified'}
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <div className="action-item" onClick={() => navigate('/children')}>
              <span className="action-icon">👨‍👩‍👧‍👦</span>
              <span>My Children</span>
            </div>
            <div className="action-item" onClick={() => navigate('/add-child')}>
              <span className="action-icon">➕</span>
              <span>Add Child</span>
            </div>
            <div className="action-item" onClick={() => navigate('/emergency-contacts')}>
              <span className="action-icon">📞</span>
              <span>Emergency Contacts</span>
            </div>
            <div className="action-item" onClick={() => navigate('/alerts')}>
              <span className="action-icon">🚨</span>
              <span>Alerts</span>
            </div>
            <div className="action-item" onClick={() => navigate('/dashboard#map')}>
              <span className="action-icon">📍</span>
              <span>View Locations</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Device Health</h2>
          {statusLoading ? (
            <div className="status-placeholder">Loading device statuses...</div>
          ) : statusError ? (
            <div className="status-error">{statusError}</div>
          ) : deviceStatuses.length === 0 ? (
            <div className="status-placeholder">No device telemetry yet.</div>
          ) : (
            <div className="device-status-list">
              {deviceStatuses.map((status) => (
                <div key={status.child_id} className="device-status-item">
                  <div className="device-status-row">
                    <strong>{status.child_id.slice(0, 8)}...</strong>
                    <span className="status-dot" data-state={status.app_status === 'Active' ? 'online' : 'idle'} />
                  </div>
                  <div className="device-status-row">
                    <span>Battery</span>
                    <span>{typeof status.battery_level === 'number' ? `${status.battery_level}%` : '—'}</span>
                  </div>
                  <div className="device-status-row">
                    <span>Network</span>
                    <span>{status.network_status || 'Unknown'}</span>
                  </div>
                  <div className="device-status-row">
                    <span>Updated</span>
                    <span>{new Date(status.last_update).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div id="map">
            <LocationMap />
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard

