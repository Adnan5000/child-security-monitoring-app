import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { emergencyContactsAPI } from '../services/api'
import './EmergencyContacts.css'

const emptyForm = {
  name: '',
  phone_number: '',
  email: '',
  priority: 1,
}

function EmergencyContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState(emptyForm)
  const [editingContactId, setEditingContactId] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const loadContacts = async () => {
    try {
      setLoading(true)
      const response = await emergencyContactsAPI.getAll()
      setContacts(response.contacts || [])
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'priority' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingContactId) {
        await emergencyContactsAPI.update(editingContactId, formData)
      } else {
        await emergencyContactsAPI.create(formData)
      }
      setFormData(emptyForm)
      setEditingContactId(null)
      await loadContacts()
    } catch (err) {
      setError(err.message || 'Failed to save contact')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (contact) => {
    setEditingContactId(contact.contact_id)
    setFormData({
      name: contact.name,
      phone_number: contact.phone_number,
      email: contact.email || '',
      priority: contact.priority || 1,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (contactId) => {
    if (!window.confirm('Delete this emergency contact?')) return
    try {
      await emergencyContactsAPI.delete(contactId)
      await loadContacts()
    } catch (err) {
      setError(err.message || 'Failed to delete contact')
    }
  }

  const handleCancelEdit = () => {
    setEditingContactId(null)
    setFormData(emptyForm)
  }

  return (
    <div className="contacts-container">
      <header className="contacts-header">
        <div>
          <h1>📞 Emergency Contacts</h1>
          <p>Manage who gets notified when alerts are triggered</p>
        </div>
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </header>

      <main className="contacts-main">
        <section className="contacts-card">
          <h2>{editingContactId ? 'Edit Contact' : 'Add New Contact'}</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>Name</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                <span>Phone Number</span>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                <span>Email (optional)</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </label>
              <label>
                <span>Priority</span>
                <input
                  type="number"
                  name="priority"
                  min={1}
                  max={10}
                  value={formData.priority}
                  onChange={handleChange}
                />
                <small>Lower number = notified sooner</small>
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="primary" disabled={isSubmitting}>
                {editingContactId ? 'Update Contact' : 'Add Contact'}
              </button>
              {editingContactId && (
                <button type="button" className="secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="contacts-card">
          <div className="card-header">
            <h2>Saved Contacts</h2>
            <button className="secondary" onClick={loadContacts}>
              Refresh
            </button>
          </div>
          {error && <div className="error-banner">{error}</div>}
          {loading ? (
            <div className="contacts-empty">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="contacts-empty">
              <p>No emergency contacts yet.</p>
              <p>Add at least one contact to receive alerts.</p>
            </div>
          ) : (
            <div className="contacts-list">
              {contacts.map((contact) => (
                <div key={contact.contact_id} className="contact-item">
                  <div>
                    <div className="contact-name">
                      {contact.name}
                      {contact.is_verified ? (
                        <span className="contact-badge verified">Verified</span>
                      ) : (
                        <span className="contact-badge pending">Pending</span>
                      )}
                    </div>
                    <div className="contact-details">
                      <span>📞 {contact.phone_number}</span>
                      {contact.email && <span>✉️ {contact.email}</span>}
                      <span>Priority: {contact.priority}</span>
                    </div>
                  </div>
                  <div className="contact-actions">
                    <button onClick={() => handleEdit(contact)}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(contact.contact_id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default EmergencyContacts


