import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { childrenAPI, geofencesAPI } from '../services/api'
import LocationMap from '../components/LocationMap'
import './Geofences.css'

function Geofences() {
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [geofences, setGeofences] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingGeofence, setEditingGeofence] = useState(null)
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    geofence_type: 'CIRCLE',
    center_latitude: '',
    center_longitude: '',
    radius_meters: '',
    polygon_coordinates: null,
    alert_on_entry: true,
    alert_on_exit: true,
    is_active: true,
  })

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      loadGeofences()
    } else {
      setGeofences([])
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

  const loadGeofences = async () => {
    if (!selectedChildId) return
    
    try {
      const data = await geofencesAPI.getByChildId(selectedChildId)
      setGeofences(data || [])
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load geofences')
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleMapClick = (e) => {
    if (!showForm || formData.geofence_type !== 'CIRCLE') return
    
    const { lat, lng } = e.latlng
    setFormData((prev) => ({
      ...prev,
      center_latitude: lat.toFixed(6),
      center_longitude: lng.toFixed(6),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedChildId) {
      setError('Please select a child')
      return
    }

    if (formData.geofence_type === 'CIRCLE' && !formData.radius_meters) {
      setError('Radius is required for circle geofences')
      return
    }

    setSaving(true)
    setError('')
    
    try {
      const submitData = {
        ...formData,
        center_latitude: parseFloat(formData.center_latitude),
        center_longitude: parseFloat(formData.center_longitude),
        radius_meters: formData.radius_meters ? parseFloat(formData.radius_meters) : null,
      }

      if (editingGeofence) {
        await geofencesAPI.update(editingGeofence.geofence_id, submitData)
      } else {
        await geofencesAPI.create(selectedChildId, submitData)
      }
      
      await loadGeofences()
      resetForm()
      alert('Geofence saved successfully!')
    } catch (err) {
      setError(err.message || 'Failed to save geofence')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (geofence) => {
    setEditingGeofence(geofence)
    setFormData({
      name: geofence.name,
      description: geofence.description || '',
      geofence_type: geofence.geofence_type,
      center_latitude: geofence.center_latitude.toString(),
      center_longitude: geofence.center_longitude.toString(),
      radius_meters: geofence.radius_meters ? geofence.radius_meters.toString() : '',
      polygon_coordinates: geofence.polygon_coordinates,
      alert_on_entry: geofence.alert_on_entry,
      alert_on_exit: geofence.alert_on_exit,
      is_active: geofence.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async (geofenceId) => {
    if (!confirm('Are you sure you want to delete this geofence?')) return
    
    try {
      await geofencesAPI.delete(geofenceId)
      await loadGeofences()
      alert('Geofence deleted successfully!')
    } catch (err) {
      setError(err.message || 'Failed to delete geofence')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      geofence_type: 'CIRCLE',
      center_latitude: '',
      center_longitude: '',
      radius_meters: '',
      polygon_coordinates: null,
      alert_on_entry: true,
      alert_on_exit: true,
      is_active: true,
    })
    setEditingGeofence(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="geofences-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="geofences-container">
      <header className="geofences-header">
        <div>
          <h1>🗺️ Safe Zones (Geofencing)</h1>
          <p>Define safe zones and get alerts when your child enters or exits them</p>
        </div>
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </header>

      <main className="geofences-main">
        <section className="geofences-card">
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
            <section className="geofences-card">
              <div className="geofences-header-section">
                <h2>Geofences</h2>
                <button 
                  className="primary-button"
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? 'Cancel' : '+ Add Geofence'}
                </button>
              </div>

              {error && <div className="error-banner">{error}</div>}

              {showForm && (
                <form onSubmit={handleSubmit} className="geofence-form">
                  <div className="form-group">
                    <label>
                      Name <span className="required">*</span>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Home, School, Park"
                      />
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      Description
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Optional description"
                      />
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      Type <span className="required">*</span>
                      <select
                        name="geofence_type"
                        value={formData.geofence_type}
                        onChange={handleChange}
                        required
                      >
                        <option value="CIRCLE">Circle (Radius-based)</option>
                        <option value="POLYGON">Polygon (Custom shape)</option>
                      </select>
                    </label>
                  </div>

                  {formData.geofence_type === 'CIRCLE' && (
                    <>
                      <div className="form-group">
                        <label>
                          Center Latitude <span className="required">*</span>
                          <input
                            type="number"
                            name="center_latitude"
                            value={formData.center_latitude}
                            onChange={handleChange}
                            step="0.000001"
                            required
                            placeholder="Click on map to set"
                          />
                        </label>
                      </div>

                      <div className="form-group">
                        <label>
                          Center Longitude <span className="required">*</span>
                          <input
                            type="number"
                            name="center_longitude"
                            value={formData.center_longitude}
                            onChange={handleChange}
                            step="0.000001"
                            required
                            placeholder="Click on map to set"
                          />
                        </label>
                      </div>

                      <div className="form-group">
                        <label>
                          Radius (meters) <span className="required">*</span>
                          <input
                            type="number"
                            name="radius_meters"
                            value={formData.radius_meters}
                            onChange={handleChange}
                            min="10"
                            step="10"
                            required
                            placeholder="e.g., 100"
                          />
                        </label>
                      </div>
                    </>
                  )}

                  {formData.geofence_type === 'POLYGON' && (
                    <div className="form-group">
                      <label>
                        Polygon Coordinates
                        <small>Note: Polygon drawing will be available in a future update. For now, use Circle type.</small>
                      </label>
                    </div>
                  )}

                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="alert_on_entry"
                        checked={formData.alert_on_entry}
                        onChange={handleChange}
                      />
                      Alert when child enters this zone
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="alert_on_exit"
                        checked={formData.alert_on_exit}
                        onChange={handleChange}
                      />
                      Alert when child exits this zone
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                      />
                      Active (geofence is enabled)
                    </label>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="primary" disabled={saving}>
                      {saving ? 'Saving...' : editingGeofence ? 'Update Geofence' : 'Create Geofence'}
                    </button>
                    <button type="button" onClick={resetForm} className="secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {geofences.length === 0 ? (
                <div className="empty-state">
                  <p>No geofences defined yet</p>
                  <p className="empty-state-sub">Click "+ Add Geofence" to create a safe zone</p>
                </div>
              ) : (
                <div className="geofences-list">
                  {geofences.map((geofence) => (
                    <div key={geofence.geofence_id} className="geofence-item">
                      <div className="geofence-header">
                        <h3>{geofence.name}</h3>
                        <span className={`status-badge ${geofence.is_active ? 'active' : 'inactive'}`}>
                          {geofence.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {geofence.description && (
                        <p className="geofence-description">{geofence.description}</p>
                      )}
                      <div className="geofence-details">
                        <div className="detail-item">
                          <strong>Type:</strong> {geofence.geofence_type}
                        </div>
                        {geofence.radius_meters && (
                          <div className="detail-item">
                            <strong>Radius:</strong> {geofence.radius_meters.toFixed(0)}m
                          </div>
                        )}
                        <div className="detail-item">
                          <strong>Location:</strong> {geofence.center_latitude.toFixed(6)}, {geofence.center_longitude.toFixed(6)}
                        </div>
                        <div className="detail-item">
                          <strong>Alerts:</strong> 
                          {geofence.alert_on_entry && ' Entry'}
                          {geofence.alert_on_exit && ' Exit'}
                        </div>
                      </div>
                      <div className="geofence-actions">
                        <button onClick={() => handleEdit(geofence)} className="edit-button">
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDelete(geofence.geofence_id)} className="delete-button">
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="geofences-card">
              <h2>Map Preview</h2>
              <p className="map-help-text">
                Click on the map to set the center point for circle geofences. Existing geofences are shown as colored zones.
              </p>
              <LocationMap 
                selectedChildId={selectedChildId} 
                showHistory={false}
              />
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default Geofences

