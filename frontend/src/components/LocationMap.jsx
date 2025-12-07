import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle, Polygon } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { locationsAPI, geofencesAPI } from '../services/api'

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Component to auto-fit map to show all markers
function MapBounds({ locations }) {
  const map = useMap()
  
  useEffect(() => {
    if (locations && locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.latitude, loc.longitude])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [locations, map])
  
  return null
}

function LocationMap({ selectedChildId = null, showHistory = false, hours = 24 }) {
  const [locations, setLocations] = useState([])
  const [historyLocations, setHistoryLocations] = useState([])
  const [geofences, setGeofences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState(null)

  const loadLocations = async () => {
    try {
      const response = await locationsAPI.getChildrenLocations()
      setLocations(response.children || [])
      setError('')
      setLastUpdate(new Date())
    } catch (err) {
      setError(err.message || 'Failed to load locations')
      console.error('Error loading locations:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    if (!selectedChildId || !showHistory) return
    
    try {
      const history = await locationsAPI.getChildHistory(selectedChildId, hours)
      setHistoryLocations(history || [])
    } catch (err) {
      console.error('Error loading history:', err)
    }
  }

  const loadGeofences = async () => {
    if (!selectedChildId) return
    
    try {
      const fences = await geofencesAPI.getByChildId(selectedChildId)
      setGeofences(fences || [])
    } catch (err) {
      console.error('Error loading geofences:', err)
    }
  }

  useEffect(() => {
    loadLocations()
    if (selectedChildId) {
      loadHistory()
      loadGeofences()
    }
    
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      loadLocations()
      if (selectedChildId) {
        loadHistory()
        loadGeofences()
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [selectedChildId, showHistory, hours])

  if (loading) {
    return (
      <div className="map-container">
        <div className="map-loading">Loading map...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="map-container">
        <div className="map-error">{error}</div>
      </div>
    )
  }

  // Default center (can be adjusted based on user's location or first child)
  const defaultCenter = locations.length > 0
    ? [locations[0].latitude, locations[0].longitude]
    : [37.7749, -122.4194] // San Francisco default

  return (
    <div className="map-wrapper">
      <div className="map-header">
        <h3>📍 Real-Time Locations</h3>
        {lastUpdate && (
          <span className="last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
        <button onClick={loadLocations} className="refresh-button">
          🔄 Refresh
        </button>
      </div>
      
      {locations.length === 0 ? (
        <div className="map-empty">
          <p>No active children with location data</p>
          <p className="map-empty-sub">Location updates will appear here when children's devices send location data</p>
        </div>
      ) : (
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ height: '500px', width: '100%', borderRadius: '8px' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBounds locations={locations} />
          
          {/* Route path for history */}
          {showHistory && historyLocations.length > 1 && (
            <Polyline
              positions={historyLocations.map(loc => [loc.latitude, loc.longitude])}
              color="#667eea"
              weight={4}
              opacity={0.7}
            />
          )}
          
          {/* Geofences */}
          {geofences.map((geofence) => {
            if (geofence.geofence_type === 'CIRCLE' && geofence.radius_meters) {
              return (
                <Circle
                  key={geofence.geofence_id}
                  center={[geofence.center_latitude, geofence.center_longitude]}
                  radius={geofence.radius_meters}
                  pathOptions={{
                    color: geofence.is_active ? '#28a745' : '#6c757d',
                    fillColor: geofence.is_active ? '#28a745' : '#6c757d',
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div>
                      <strong>{geofence.name}</strong>
                      <br />
                      <small>{geofence.description || 'No description'}</small>
                      <br />
                      <small>Type: Circle ({geofence.radius_meters.toFixed(0)}m radius)</small>
                      <br />
                      <small>Status: {geofence.is_active ? 'Active' : 'Inactive'}</small>
                    </div>
                  </Popup>
                </Circle>
              )
            } else if (geofence.geofence_type === 'POLYGON' && geofence.polygon_coordinates) {
              return (
                <Polygon
                  key={geofence.geofence_id}
                  positions={geofence.polygon_coordinates}
                  pathOptions={{
                    color: geofence.is_active ? '#28a745' : '#6c757d',
                    fillColor: geofence.is_active ? '#28a745' : '#6c757d',
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div>
                      <strong>{geofence.name}</strong>
                      <br />
                      <small>{geofence.description || 'No description'}</small>
                      <br />
                      <small>Type: Polygon</small>
                      <br />
                      <small>Status: {geofence.is_active ? 'Active' : 'Inactive'}</small>
                    </div>
                  </Popup>
                </Polygon>
              )
            }
            return null
          })}
          
          {/* Current location markers */}
          {locations.map((location) => (
            <Marker
              key={location.location_id}
              position={[location.latitude, location.longitude]}
            >
              <Popup>
                <div className="marker-popup">
                  <strong>{location.child_name}</strong>
                  <br />
                  {location.address || (
                    <>
                      Lat: {location.latitude.toFixed(6)}
                      <br />
                      Lng: {location.longitude.toFixed(6)}
                    </>
                  )}
                  {location.accuracy && (
                    <>
                      <br />
                      <small>Accuracy: {location.accuracy.toFixed(0)}m</small>
                    </>
                  )}
                  <br />
                  <small>
                    {new Date(location.timestamp).toLocaleString()}
                  </small>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* History markers (smaller, different color) */}
          {showHistory && historyLocations.map((location, index) => (
            <Marker
              key={`history-${location.location_id}-${index}`}
              position={[location.latitude, location.longitude]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                iconSize: [20, 30],
                iconAnchor: [12, 30],
              })}
            >
              <Popup>
                <div className="marker-popup">
                  <strong>{location.child_name}</strong>
                  <br />
                  <small>History Point</small>
                  <br />
                  <small>
                    {new Date(location.timestamp).toLocaleString()}
                  </small>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  )
}

export default LocationMap

