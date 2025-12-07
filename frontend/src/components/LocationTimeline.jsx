import { useEffect, useState } from 'react'
import { locationsAPI } from '../services/api'
import './LocationTimeline.css'

function LocationTimeline({ childId, hours = 24 }) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedHours, setSelectedHours] = useState(hours)

  const loadHistory = async () => {
    if (!childId) return
    
    try {
      setLoading(true)
      const history = await locationsAPI.getChildHistory(childId, selectedHours)
      // Sort by timestamp descending (most recent first)
      const sorted = (history || []).sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )
      setLocations(sorted)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load location history')
      console.error('Error loading history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [childId, selectedHours])

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      full: date.toLocaleString()
    }
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now - then
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  if (!childId) {
    return (
      <div className="timeline-container">
        <div className="timeline-empty">Please select a child to view location history</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="timeline-container">
        <div className="timeline-loading">Loading location history...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="timeline-container">
        <div className="timeline-error">{error}</div>
        <button onClick={loadHistory} className="retry-button">Retry</button>
      </div>
    )
  }

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h3>📍 Location History Timeline</h3>
        <div className="timeline-controls">
          <label>
            Time Range:
            <select 
              value={selectedHours} 
              onChange={(e) => setSelectedHours(Number(e.target.value))}
              className="hours-select"
            >
              <option value={1}>Last Hour</option>
              <option value={6}>Last 6 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={48}>Last 2 Days</option>
              <option value={168}>Last Week</option>
            </select>
          </label>
          <button onClick={loadHistory} className="refresh-button">🔄 Refresh</button>
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="timeline-empty">
          <p>No location history found for the selected time range</p>
          <p className="timeline-empty-sub">Location updates will appear here when the child's device sends location data</p>
        </div>
      ) : (
        <div className="timeline-content">
          <div className="timeline-stats">
            <div className="stat-item">
              <span className="stat-label">Total Points:</span>
              <span className="stat-value">{locations.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Time Range:</span>
              <span className="stat-value">{selectedHours} hours</span>
            </div>
            {locations.length > 0 && (
              <div className="stat-item">
                <span className="stat-label">Latest:</span>
                <span className="stat-value">{getTimeAgo(locations[0].timestamp)}</span>
              </div>
            )}
          </div>

          <div className="timeline-list">
            {locations.map((location, index) => {
              const timeInfo = formatTime(location.timestamp)
              const isFirst = index === 0
              const isLast = index === locations.length - 1
              
              return (
                <div key={location.location_id} className={`timeline-item ${isFirst ? 'timeline-item-first' : ''}`}>
                  <div className="timeline-marker">
                    <div className="timeline-dot"></div>
                    {!isLast && <div className="timeline-line"></div>}
                  </div>
                  <div className="timeline-content-item">
                    <div className="timeline-time">
                      <strong>{timeInfo.time}</strong>
                      <span className="time-ago">{getTimeAgo(location.timestamp)}</span>
                    </div>
                    <div className="timeline-details">
                      <div className="location-coords">
                        <span className="coord-item">
                          <strong>Lat:</strong> {location.latitude.toFixed(6)}
                        </span>
                        <span className="coord-item">
                          <strong>Lng:</strong> {location.longitude.toFixed(6)}
                        </span>
                      </div>
                      {location.address && (
                        <div className="location-address">
                          📍 {location.address}
                        </div>
                      )}
                      {location.accuracy && (
                        <div className="location-accuracy">
                          Accuracy: {location.accuracy.toFixed(0)}m
                        </div>
                      )}
                      <div className="location-date">
                        {timeInfo.date}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationTimeline

