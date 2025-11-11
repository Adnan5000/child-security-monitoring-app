import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { locationsAPI } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LocationService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.updateInterval = null;
    this.childId = null;
    this.updateIntervalMs = 30000; // 30 seconds default
  }

  // Request location permissions
  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        if (
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          return true;
        } else {
          Alert.alert(
            'Location Permission Required',
            'Please enable location permissions in app settings to track your location.'
          );
          return false;
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true; // iOS permissions handled automatically
  }

  // Get current location
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          console.error('Location error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  // Get child ID from AsyncStorage
  async getChildId() {
    try {
      const childId = await AsyncStorage.getItem('childId');
      return childId;
    } catch (error) {
      console.error('Error getting child ID:', error);
      return null;
    }
  }

  // Set child ID (should be set when child logs in or device is registered)
  async setChildId(childId) {
    try {
      await AsyncStorage.setItem('childId', childId);
      this.childId = childId;
    } catch (error) {
      console.error('Error setting child ID:', error);
    }
  }

  // Send location update to backend
  async sendLocationUpdate(location) {
    try {
      const childId = this.childId || await this.getChildId();
      
      if (!childId) {
        console.warn('No child ID found. Cannot send location update.');
        return false;
      }

      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      };

      await locationsAPI.updateLocation(childId, locationData);
      console.log('Location update sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending location update:', error);
      return false;
    }
  }

  // Start location tracking
  async startTracking(childId, intervalMs = 30000) {
    if (this.isTracking) {
      console.log('Location tracking already started');
      return;
    }

    // Request permissions first
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return;
    }

    // Set child ID
    if (childId) {
      await this.setChildId(childId);
    } else {
      const storedChildId = await this.getChildId();
      if (!storedChildId) {
        Alert.alert(
          'Child ID Required',
          'Please set up your child profile first before starting location tracking.'
        );
        return;
      }
    }

    this.isTracking = true;
    this.updateIntervalMs = intervalMs;

    // Send initial location
    try {
      const location = await this.getCurrentLocation();
      await this.sendLocationUpdate(location);
    } catch (error) {
      console.error('Error getting initial location:', error);
    }

    // Set up periodic location updates
    this.updateInterval = setInterval(async () => {
      try {
        const location = await this.getCurrentLocation();
        await this.sendLocationUpdate(location);
      } catch (error) {
        console.error('Error in periodic location update:', error);
      }
    }, this.updateIntervalMs);

    console.log(`Location tracking started (updates every ${this.updateIntervalMs / 1000}s)`);
  }

  // Stop location tracking
  stopTracking() {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    console.log('Location tracking stopped');
  }

  // Check if tracking is active
  isActive() {
    return this.isTracking;
  }
}

// Export singleton instance
export default new LocationService();

