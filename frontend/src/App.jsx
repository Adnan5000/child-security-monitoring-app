import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState(null)

  useEffect(() => {
    // Check if backend API is running
    fetch('http://localhost:8000/api/health')
      .then(response => response.json())
      .then(data => setApiStatus(data))
      .catch(error => {
        console.error('API connection error:', error)
        setApiStatus({ status: 'disconnected', error: 'Backend server not reachable' })
      })
  }, [])

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🛡️ Child Security & Monitoring</h1>
        <p className="subtitle">Keeping children safe, one moment at a time</p>
      </header>

      <main className="app-main">
        <div className="status-card">
          <h2>System Status</h2>
          <div className="status-info">
            <div className="status-item">
              <span className="status-label">Frontend:</span>
              <span className="status-value status-success">✓ Running</span>
            </div>
            <div className="status-item">
              <span className="status-label">Backend API:</span>
              {apiStatus?.status === 'healthy' ? (
                <span className="status-value status-success">✓ Connected</span>
              ) : (
                <span className="status-value status-error">✗ Disconnected</span>
              )}
            </div>
          </div>
          {apiStatus?.status === 'healthy' && (
            <p className="api-message">{apiStatus.service}</p>
          )}
        </div>

        <div className="welcome-card">
          <h2>Welcome</h2>
          <p>This application is designed for Android devices to help parents monitor and ensure their children's safety.</p>
          <div className="features">
            <div className="feature-item">
              <span className="feature-icon">📍</span>
              <span>Real-time Location Tracking</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚨</span>
              <span>Emergency Alerts</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <span>Device Status Monitoring</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👨‍👩‍👧‍👦</span>
              <span>Parent Dashboard</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Version 1.0.0 | Initial Setup</p>
      </footer>
    </div>
  )
}

export default App
