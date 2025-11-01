import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import './Dashboard.css'

function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
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
            <div className="action-item">
              <span className="action-icon">👨‍👩‍👧‍👦</span>
              <span>Add Child Profile</span>
            </div>
            <div className="action-item">
              <span className="action-icon">📞</span>
              <span>Emergency Contacts</span>
            </div>
            <div className="action-item">
              <span className="action-icon">📍</span>
              <span>View Locations</span>
            </div>
            <div className="action-item">
              <span className="action-icon">⚙️</span>
              <span>Settings</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Coming Soon</h2>
          <p>Features like child profiles, location tracking, and alerts will be available here.</p>
        </div>
      </main>
    </div>
  )
}

export default Dashboard

