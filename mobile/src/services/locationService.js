import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { locationsAPI, deviceStatusAPI } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import backgroundLocationService from './backgroundLocationService';
import deviceTelemetryService from './deviceTelemetryService';

class LocationService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.updateInterval = null;
    this.childId = null;
    this.updateIntervalMs = 30000; // 30 seconds default
    this.lastChildId = null;
  }

  // Request location permissions (including background)
  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        // Request foreground location permissions first
        const foregroundGranted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        if (
          foregroundGranted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] !==
            PermissionsAndroid.RESULTS.GRANTED ||
          foregroundGranted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] !==
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          Alert.alert(
            'Location Permission Required',
            'Please enable location permissions in app settings to track your location.'
          );
          return false;
        }

        // Request background location permission (Android 10+)
        if (Platform.Version >= 29) {
          const backgroundGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
          );

          if (backgroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Background Location Permission',
              'For continuous tracking when the app is closed, please enable "Allow all the time" location permission in app settings.',
              [
                { text: 'OK', style: 'default' },
                {
                  text: 'Open Settings',
                  onPress: () => {
                    // User can manually enable in settings
                  },
                },
              ]
            );
            // Continue anyway, but background tracking may be limited
          }
        }

        return true;
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
    try {
      if (this.isTracking) {
        console.log('Location tracking already started');
        return;
      }

      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permissions not granted');
      }

      // Set child ID
      let resolvedChildId = childId;
      if (resolvedChildId) {
        await this.setChildId(resolvedChildId);
      } else {
        const storedChildId = await this.getChildId();
        if (!storedChildId) {
          Alert.alert(
            'Child ID Required',
            'Please set up your child profile first before starting location tracking.'
          );
          throw new Error('Child ID required');
        }
        resolvedChildId = storedChildId;
      }

      this.isTracking = true;
      this.lastChildId = resolvedChildId;
      this.updateIntervalMs = intervalMs;

      // Start background tracking service (non-blocking)
      backgroundLocationService.startBackgroundTracking(resolvedChildId, intervalMs)
        .then(() => {
          console.log('Background location service started');
        })
        .catch((error) => {
          console.warn('Failed to start background service, continuing with foreground only:', error);
          // Continue without background - foreground tracking will work
        });

      // Start device telemetry monitoring (non-blocking)
      deviceTelemetryService.startMonitoring(resolvedChildId, 60000)
        .then(() => {
          console.log('Device telemetry monitoring started');
        })
        .catch((error) => {
          console.warn('Failed to start telemetry monitoring:', error);
          // Continue without telemetry
        });

      // Send initial location (non-blocking)
      this.getCurrentLocation()
        .then(async (location) => {
          try {
            await this.sendLocationUpdate(location);
            await this.sendDeviceStatus({
              childId: resolvedChildId,
              app_status: 'Active',
              network_status: 'Online',
            });
          } catch (error) {
            console.error('Error sending initial location update:', error);
          }
        })
        .catch((error) => {
          console.error('Error getting initial location:', error);
          // Continue anyway - periodic updates will work
        });

      // Set up periodic location updates (foreground)
      this.updateInterval = setInterval(async () => {
        try {
          const location = await this.getCurrentLocation();
          await this.sendLocationUpdate(location);
          // Telemetry service handles device status updates automatically
          try {
            await deviceTelemetryService.sendTelemetry(resolvedChildId);
          } catch (telemetryError) {
            console.warn('Telemetry update failed:', telemetryError);
          }
        } catch (error) {
          console.error('Error in periodic location update:', error);
        }
      }, this.updateIntervalMs);

      console.log(`Location tracking started (updates every ${this.updateIntervalMs / 1000}s)`);
    } catch (error) {
      // Reset tracking state on error
      this.isTracking = false;
      console.error('Error starting location tracking:', error);
      throw error; // Re-throw so caller can handle it
    }
  }

  // Stop location tracking
  async stopTracking() {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;

    // Stop background tracking
    try {
      await backgroundLocationService.stopBackgroundTracking();
    } catch (error) {
      console.error('Error stopping background service:', error);
    }

    // Stop device telemetry monitoring
    try {
      deviceTelemetryService.stopMonitoring();
    } catch (error) {
      console.error('Error stopping telemetry monitoring:', error);
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.lastChildId) {
      this.sendDeviceStatus({
        childId: this.lastChildId,
        app_status: 'Idle',
        network_status: 'Offline',
      });
    }

    console.log('Location tracking stopped');
  }

  // Check if tracking is active
  isActive() {
    return this.isTracking;
  }

  async sendDeviceStatus({ childId, app_status, network_status }) {
    // Use telemetry service for enhanced device status
    try {
      const targetChildId = childId || this.lastChildId || (await this.getChildId());
      if (!targetChildId) {
        return;
      }
      // Telemetry service will collect and send all device info
      await deviceTelemetryService.sendTelemetry(targetChildId);
    } catch (error) {
      console.error('Error sending device status:', error);
    }
  }
}

// Export singleton instance
export default new LocationService();

