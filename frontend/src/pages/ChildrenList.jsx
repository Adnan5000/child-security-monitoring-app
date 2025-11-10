import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { childrenAPI } from '../services/api'
import './Dashboard.css'

function ChildrenList() {
  const navigate = useNavigate()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadChildren()
  }, [])

  const loadChildren = async () => {
    try {
      setLoading(true)
      const data = await childrenAPI.getAll()
      setChildren(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load children')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (childId, childName) => {
    if (!window.confirm(`Are you sure you want to delete ${childName}? This action cannot be undone.`)) {
      return
    }

    try {
      await childrenAPI.delete(childId)
      loadChildren()
    } catch (err) {
      alert(err.message || 'Failed to delete child')
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading children...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>👨‍👩‍👧‍👦 My Children</h1>
          <p>Manage your children's profiles</p>
        </div>
        <div>
          <button
            onClick={() => navigate('/add-child')}
            className="logout-button"
            style={{ marginRight: '10px' }}
          >
            + Add Child
          </button>
          <button onClick={() => navigate('/dashboard')} className="logout-button">
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {error && (
          <div className="dashboard-card" style={{ backgroundColor: '#fee', borderColor: '#fcc' }}>
            <p style={{ color: '#c33' }}>{error}</p>
          </div>
        )}

        {children.length === 0 ? (
          <div className="dashboard-card">
            <h2>No children added yet</h2>
            <p>Tap "Add Child" to create a profile</p>
            <button
              onClick={() => navigate('/add-child')}
              className="auth-button"
              style={{ marginTop: '20px' }}
            >
              Add Your First Child
            </button>
          </div>
        ) : (
          <div className="children-grid">
            {children.map((child) => (
              <div key={child.child_id} className="child-card">
                <div className="child-header">
                  <h3>{child.name}</h3>
                  <span className={`status-badge ${child.is_active ? 'active' : 'inactive'}`}>
                    {child.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="child-info">
                  <p><strong>Age:</strong> {child.age}</p>
                  {child.device_id && (
                    <p><strong>Device ID:</strong> {child.device_id}</p>
                  )}
                </div>
                <div className="child-actions">
                  <button
                    onClick={() => navigate(`/edit-child/${child.child_id}`)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(child.child_id, child.name)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default ChildrenList

