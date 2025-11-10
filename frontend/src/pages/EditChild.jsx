import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { childrenAPI } from '../services/api'
import './Auth.css'

function EditChild() {
  const navigate = useNavigate()
  const { childId } = useParams()
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    device_id: '',
    is_active: true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    const loadChild = async () => {
      try {
        const child = await childrenAPI.getById(childId)
        setFormData({
          name: child.name,
          age: child.age.toString(),
          device_id: child.device_id || '',
          is_active: child.is_active,
        })
      } catch (err) {
        setError(err.message || 'Failed to load child information')
      } finally {
        setFetching(false)
      }
    }

    loadChild()
  }, [childId])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }

    const ageNum = parseInt(formData.age)
    if (!formData.age || isNaN(ageNum) || ageNum < 0 || ageNum > 18) {
      setError('Please enter a valid age (0-18)')
      return
    }

    setLoading(true)

    try {
      const childData = {
        name: formData.name.trim(),
        age: ageNum,
        is_active: formData.is_active,
        ...(formData.device_id.trim() ? { device_id: formData.device_id.trim() } : { device_id: null }),
      }

      await childrenAPI.update(childId, childData)
      navigate('/children')
    } catch (err) {
      setError(err.message || 'Failed to update child. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Edit Child</h1>
          <p>Update child information</p>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Child's Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter child's name"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="age">Age *</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter age (0-18)"
              min="0"
              max="18"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="device_id">Device ID (Optional)</label>
            <input
              type="text"
              id="device_id"
              name="device_id"
              value={formData.device_id}
              onChange={handleChange}
              placeholder="Enter device identifier"
              disabled={loading}
            />
            <small>Leave empty if not available yet</small>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={loading}
              />
              {' '}Active
            </label>
            <small>Uncheck to deactivate this child profile</small>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Updating...' : 'Update Child'}
          </button>

          <button
            type="button"
            className="auth-link-button"
            onClick={() => navigate('/children')}
            disabled={loading}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}

export default EditChild

