import AsyncStorage from '@react-native-async-storage/async-storage';

// Get your MacBook's IP address and update this
// On Android emulator, use 10.0.2.2 instead of localhost
// For physical device, use your MacBook's local IP (e.g., 192.168.1.x)
// Current MacBook IP: 192.168.0.29

// Set this to 'emulator' to test on Android emulator, or 'device' for physical device
const DEVICE_TYPE = 'device'; // Change to 'emulator' if using Android emulator

const API_BASE_URL = DEVICE_TYPE === 'emulator' 
  ? 'http://10.0.2.2:8000' // Android emulator - maps to localhost on MacBook
  : 'http://192.168.0.29:8000'; // Physical device - your MacBook's IP on local network

// Get token from AsyncStorage
const getToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Set token in AsyncStorage
const setToken = async (token) => {
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

// Remove token from AsyncStorage
const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// API request wrapper
const apiRequest = async (endpoint, options = {}) => {
  const token = await getToken();
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
      await setToken(response.access_token);
    }
    
    return response;
  },

  logout: async () => {
    await removeToken();
  },

  getCurrentUser: async () => {
    return apiRequest('/api/auth/me');
  },

  isAuthenticated: async () => {
    const token = await getToken();
    return !!token;
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

// Helper to set API base URL (for physical device testing)
export const setApiBaseUrl = (url) => {
  // This would require a more sophisticated setup
  // For now, update API_BASE_URL manually for physical device testing
  console.log('To test on physical device, update API_BASE_URL in src/services/api.js');
  console.log('Use your MacBook IP address instead of localhost');
};

export default apiRequest;

