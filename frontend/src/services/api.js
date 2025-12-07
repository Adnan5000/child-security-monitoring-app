const API_BASE_URL = 'http://localhost:8000';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('authToken');
};

// Set token in localStorage
const setToken = (token) => {
  localStorage.setItem('authToken', token);
};

// Remove token from localStorage
const removeToken = () => {
  localStorage.removeItem('authToken');
};

// API request wrapper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      // Handle FastAPI validation errors (422)
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          // Multiple validation errors
          errorMessage = errorData.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            const msg = err.msg || '';
            return field ? `${field}: ${msg}` : msg;
          }).join(', ');
        } else {
          // Single error message
          errorMessage = errorData.detail;
        }
      }
    } catch (e) {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || 'Request failed';
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

// Authentication API
export const authAPI = {
  register: async (userData) => {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (email, password) => {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.access_token) {
      setToken(response.access_token);
    }
    
    return response;
  },

  logout: () => {
    removeToken();
  },

  getCurrentUser: async () => {
    return apiRequest('/api/auth/me');
  },

  isAuthenticated: () => {
    return !!getToken();
  },
};

// Children API
export const childrenAPI = {
  // Get all children for the current parent
  getAll: async () => {
    return apiRequest('/api/children');
  },

  // Get a specific child by ID
  getById: async (childId) => {
    return apiRequest(`/api/children/${childId}`);
  },

  // Create a new child
  create: async (childData) => {
    return apiRequest('/api/children', {
      method: 'POST',
      body: JSON.stringify(childData),
    });
  },

  // Update a child
  update: async (childId, childData) => {
    return apiRequest(`/api/children/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(childData),
    });
  },

  // Delete a child
  delete: async (childId) => {
    return apiRequest(`/api/children/${childId}`, {
      method: 'DELETE',
    });
  },
};

// Locations API
export const locationsAPI = {
  // Get all children's current locations
  getChildrenLocations: async () => {
    return apiRequest('/api/locations/children');
  },

  // Get a specific child's current location
  getChildLocation: async (childId) => {
    return apiRequest(`/api/locations/child/${childId}`);
  },

  // Get location history for a child
  getChildLocationHistory: async (childId, hours = 24) => {
    return apiRequest(`/api/locations/child/${childId}/history?hours=${hours}`);
  },

  // Create/update location (from mobile device)
  updateLocation: async (childId, locationData) => {
    return apiRequest(`/api/locations/child/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  },

  // Create new location
  createLocation: async (locationData) => {
    return apiRequest('/api/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  },
};

export const emergencyContactsAPI = {
  getAll: async () => {
    return apiRequest('/api/emergency-contacts');
  },

  create: async (contactData) => {
    return apiRequest('/api/emergency-contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  },

  update: async (contactId, contactData) => {
    return apiRequest(`/api/emergency-contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  },

  delete: async (contactId) => {
    return apiRequest(`/api/emergency-contacts/${contactId}`, {
      method: 'DELETE',
    });
  },
};

export const alertsAPI = {
  getAlerts: async (status) => {
    const query = status ? `?status_filter=${status}` : '';
    return apiRequest(`/api/alerts${query}`);
  },

  createAlert: async (alertData) => {
    return apiRequest('/api/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  },

  acknowledgeAlert: async (alertId) => {
    return apiRequest(`/api/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    });
  },
};

export const deviceStatusAPI = {
  listStatuses: async () => {
    return apiRequest('/api/devices/status');
  },

  getStatusByChild: async (childId) => {
    return apiRequest(`/api/devices/child/${childId}/status`);
  },
};

export const shakeDetectorAPI = {
  getAll: async () => {
    return apiRequest('/api/shake-detectors');
  },
  getByChildId: async (childId) => {
    return apiRequest(`/api/shake-detectors/child/${childId}`);
  },
  update: async (childId, detectorData) => {
    return apiRequest(`/api/shake-detectors/child/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(detectorData),
    });
  },
  create: async (childId, detectorData) => {
    return apiRequest(`/api/shake-detectors/child/${childId}`, {
      method: 'POST',
      body: JSON.stringify(detectorData),
    });
  },
};

export const geofencesAPI = {
  getByChildId: async (childId) => {
    return apiRequest(`/api/geofences/child/${childId}`);
  },
  create: async (childId, geofenceData) => {
    return apiRequest(`/api/geofences/child/${childId}`, {
      method: 'POST',
      body: JSON.stringify(geofenceData),
    });
  },
  update: async (geofenceId, geofenceData) => {
    return apiRequest(`/api/geofences/${geofenceId}`, {
      method: 'PUT',
      body: JSON.stringify(geofenceData),
    });
  },
  delete: async (geofenceId) => {
    return apiRequest(`/api/geofences/${geofenceId}`, {
      method: 'DELETE',
    });
  },
  getEvents: async (childId, hours = 24) => {
    return apiRequest(`/api/geofences/child/${childId}/events?hours=${hours}`);
  },
};

export default apiRequest;

