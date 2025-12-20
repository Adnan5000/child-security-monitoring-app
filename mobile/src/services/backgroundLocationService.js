import Geolocation from 'react-native-geolocation-service';
import { Platform, AppState } from 'react-native';
import { locationsAPI, deviceStatusAPI } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundFetch from 'react-native-background-fetch';
import deviceTelemetryService from './deviceTelemetryService';

class BackgroundLocationService {
  constructor() {
    this.isTracking = false;
    this.childId = null;
    this.updateIntervalMs = 30000; // 30 seconds
    this.backgroundTaskId = null;
    this.appStateListener = null;
  }

  // Get child ID from storage
  async getChildId() {
    try {
      const childId = await AsyncStorage.getItem('childId');
      return childId;
    } catch (error) {
      console.error('Error getting child ID:', error);
      return null;
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
      
      // Use telemetry service for enhanced device status
      await deviceTelemetryService.sendTelemetry(childId);
      
      console.log('Background location update sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending background location update:', error);
      return false;
    }
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
          console.error('Background location error:', error);
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

  // Background fetch task (can be called from headless task)
  async onBackgroundFetch(taskId) {
    console.log('[BackgroundFetch] Task:', taskId);
    
    try {
      // Ensure we have child ID
      if (!this.childId) {
        this.childId = await this.getChildId();
      }
      
      if (!this.childId) {
        console.warn('[BackgroundFetch] No child ID available, skipping update');
        BackgroundFetch.finish(taskId);
        return;
      }
      
      const location = await this.getCurrentLocation();
      await this.sendLocationUpdate(location);
      
      // Mark task as complete
      BackgroundFetch.finish(taskId);
    } catch (error) {
      console.error('[BackgroundFetch] Error:', error);
      BackgroundFetch.finish(taskId);
    }
  }

  // Handle app state changes
  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      console.log('App moved to background, ensuring background tracking continues');
      // Background fetch will handle updates
    } else if (nextAppState === 'active') {
      console.log('App moved to foreground');
      // Continue with regular tracking
    }
  };

  // Start background location tracking
  async startBackgroundTracking(childId, intervalMs = 30000) {
    if (this.isTracking) {
      console.log('Background tracking already started');
      return;
    }

    this.childId = childId;
    this.updateIntervalMs = intervalMs;

    try {
      // Store child ID
      await AsyncStorage.setItem('childId', childId);

      // Configure background fetch with error handling
      try {
        await BackgroundFetch.configure(
          {
            minimumFetchInterval: Math.floor(intervalMs / 1000), // Convert to seconds
            stopOnTerminate: false, // Continue after app termination
            startOnBoot: true, // Start on device boot
            enableHeadless: true, // Enable headless mode
            requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
          },
          async (taskId) => {
            await this.onBackgroundFetch(taskId);
          },
          async (error) => {
            console.error('[BackgroundFetch] Failed to start:', error);
          }
        );
        console.log('[BackgroundFetch] Configured successfully');
      } catch (configError) {
        console.warn('[BackgroundFetch] Configuration failed, continuing without background fetch:', configError);
        // Continue without background fetch - foreground tracking will still work
      }

      // Listen to app state changes
      this.appStateListener = AppState.addEventListener('change', this.handleAppStateChange);

      // Send initial location
      try {
        const location = await this.getCurrentLocation();
        await this.sendLocationUpdate(location);
      } catch (error) {
        console.error('Error getting initial background location:', error);
      }

      this.isTracking = true;
      console.log(`Background location tracking started (updates every ${intervalMs / 1000}s)`);
    } catch (error) {
      console.error('Error starting background tracking:', error);
      throw error;
    }
  }

  // Stop background location tracking
  async stopBackgroundTracking() {
    if (!this.isTracking) {
      return;
    }

    try {
      // Stop background fetch
      await BackgroundFetch.stop();

      // Remove app state listener
      if (this.appStateListener) {
        this.appStateListener.remove();
        this.appStateListener = null;
      }

      this.isTracking = false;
      this.childId = null;
      console.log('Background location tracking stopped');
    } catch (error) {
      console.error('Error stopping background tracking:', error);
    }
  }

  // Check if tracking is active
  isActive() {
    return this.isTracking;
  }

  // Get status
  getStatus() {
    return {
      isTracking: this.isTracking,
      childId: this.childId,
      updateInterval: this.updateIntervalMs,
    };
  }
}

// Export singleton instance
export default new BackgroundLocationService();

