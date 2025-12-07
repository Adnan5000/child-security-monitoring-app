import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { shakeDetectorAPI, childrenAPI } from '../services/api'
import './ShakeDetector.css'

function ShakeDetector() {
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [detector, setDetector] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    sensitivity: 1.5,
    threshold: 2.0,
    is_enabled: true,
  })

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      loadDetector(selectedChildId)
    } else {
      setDetector(null)
      setFormData({ sensitivity: 1.5, threshold: 2.0, is_enabled: true })
    }
  }, [selectedChildId])

  const loadChildren = async () => {
    try {
      const data = await childrenAPI.getAll()
      setChildren(data)
      if (data.length > 0 && !selectedChildId) {
        setSelectedChildId(data[0].child_id)
      }
    } catch (err) {
      setError(err.message || 'Failed to load children')
    } finally {
      setLoading(false)
    }
  }

  const loadDetector = async (childId) => {
    try {
      setLoading(true)
      const data = await shakeDetectorAPI.getByChildId(childId)
      setDetector(data)
      setFormData({
        sensitivity: data.sensitivity,
        threshold: data.threshold,
        is_enabled: data.is_enabled,
      })
      setError('')
    } catch (err) {
      // Detector might not exist yet, that's okay
      setDetector(null)
      setFormData({ sensitivity: 1.5, threshold: 2.0, is_enabled: true })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseFloat(value) || value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedChildId) {
      setError('Please select a child')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (detector) {
        await shakeDetectorAPI.update(selectedChildId, formData)
      } else {
        await shakeDetectorAPI.create(selectedChildId, formData)
      }
      await loadDetector(selectedChildId)
      alert('Shake detector settings saved successfully!')
    } catch (err) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !detector) {
    return (
      <div className="shake-detector-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="shake-detector-container">
      <header className="shake-detector-header">
        <div>
          <h1>📱 Shake Detection Settings</h1>
          <p>Configure automatic shake detection for emergency alerts</p>
        </div>
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </header>

      <main className="shake-detector-main">
        <section className="shake-detector-card">
          <h2>Select Child</h2>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="child-select"
          >
            <option value="">-- Select a child --</option>
            {children.map((child) => (
              <option key={child.child_id} value={child.child_id}>
                {child.name} (Age: {child.age})
              </option>
            ))}
          </select>
        </section>

        {selectedChildId && (
          <section className="shake-detector-card">
            <h2>Shake Detection Configuration</h2>
            {error && <div className="error-banner">{error}</div>}
            
            <form onSubmit={handleSubmit} className="shake-detector-form">
              <div className="form-group">
                <label>
                  <span>Sensitivity</span>
                  <input
                    type="number"
                    name="sensitivity"
                    value={formData.sensitivity}
                    onChange={handleChange}
                    min="0.1"
                    max="10"
                    step="0.1"
                    required
                  />
                  <small>
                    Higher values = more sensitive (detects lighter shakes). 
                    Recommended: 1.0 - 2.0
                  </small>
                </label>
              </div>

              <div className="form-group">
                <label>
                  <span>Threshold</span>
                  <input
                    type="number"
                    name="threshold"
                    value={formData.threshold}
                    onChange={handleChange}
                    min="0.5"
                    max="10"
                    step="0.1"
                    required
                  />
                  <small>
                    Acceleration threshold for triggering alert. 
                    Recommended: 1.5 - 3.0
                  </small>
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_enabled"
                    checked={formData.is_enabled}
                    onChange={handleChange}
                  />
                  <span>Enable shake detection</span>
                </label>
                <small>
                  When enabled, the app will automatically detect shakes and send alerts
                </small>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>

            <div className="info-box">
              <h3>ℹ️ How it works:</h3>
              <ul>
                <li>Shake detection monitors the device's accelerometer</li>
                <li>When a shake exceeds the configured threshold, an alert is automatically sent</li>
                <li>Alerts include the child's current location</li>
                <li>There's a 5-second cooldown between shake alerts to prevent spam</li>
                <li>Shake detection starts automatically when location tracking is enabled</li>
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default ShakeDetector

