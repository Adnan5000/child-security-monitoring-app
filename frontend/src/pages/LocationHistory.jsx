import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { childrenAPI } from '../services/api'
import LocationTimeline from '../components/LocationTimeline'
import LocationMap from '../components/LocationMap'
import './LocationHistory.css'

function LocationHistory() {
  const { childId: paramChildId } = useParams()
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(paramChildId || '')
  const [hours, setHours] = useState(24)
  const [showMap, setShowMap] = useState(true)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    if (paramChildId) {
      setSelectedChildId(paramChildId)
    }
  }, [paramChildId])

  const loadChildren = async () => {
    try {
      const data = await childrenAPI.getAll()
      setChildren(data)
      if (data.length > 0 && !selectedChildId) {
        setSelectedChildId(data[0].child_id)
      }
    } catch (err) {
      console.error('Error loading children:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="location-history-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="location-history-container">
      <header className="location-history-header">
        <div>
          <h1>📍 Location History</h1>
          <p>View timeline and route path of your child's movement</p>
        </div>
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </header>

      <main className="location-history-main">
        <section className="location-history-card">
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
          <>
            <section className="location-history-card">
              <div className="view-controls">
                <div className="time-range-control">
                  <label>
                    Time Range:
                    <select 
                      value={hours} 
                      onChange={(e) => setHours(Number(e.target.value))}
                      className="hours-select"
                    >
                      <option value={1}>Last Hour</option>
                      <option value={6}>Last 6 Hours</option>
                      <option value={24}>Last 24 Hours</option>
                      <option value={48}>Last 2 Days</option>
                      <option value={168}>Last Week</option>
                    </select>
                  </label>
                </div>
                <div className="view-toggle">
                  <button
                    className={`toggle-button ${showMap ? 'active' : ''}`}
                    onClick={() => setShowMap(true)}
                  >
                    📍 Map View
                  </button>
                  <button
                    className={`toggle-button ${!showMap ? 'active' : ''}`}
                    onClick={() => setShowMap(false)}
                  >
                    📋 Timeline View
                  </button>
                </div>
              </div>
            </section>

            {showMap ? (
              <section className="location-history-card">
                <h2>Route Path Map</h2>
                <LocationMap 
                  selectedChildId={selectedChildId}
                  showHistory={true}
                  hours={hours}
                />
              </section>
            ) : (
              <section className="location-history-card">
                <LocationTimeline 
                  childId={selectedChildId}
                  hours={hours}
                />
              </section>
            )}
          </>
        )}

        {!selectedChildId && (
          <section className="location-history-card">
            <div className="empty-state">
              <p>Please select a child to view location history</p>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default LocationHistory

