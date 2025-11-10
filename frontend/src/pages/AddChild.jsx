import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { childrenAPI } from '../services/api'
import './Auth.css'

function AddChild() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    device_id: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
        ...(formData.device_id.trim() ? { device_id: formData.device_id.trim() } : {}),
      }

      await childrenAPI.create(childData)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to add child. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Add Child</h1>
          <p>Create a new child profile</p>
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

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Adding...' : 'Add Child'}
          </button>

          <button
            type="button"
            className="auth-link-button"
            onClick={() => navigate('/dashboard')}
            disabled={loading}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddChild

