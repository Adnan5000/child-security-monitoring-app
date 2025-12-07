import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { alertsAPI, shakeDetectorAPI } from './api';
import locationService from './locationService';

class ShakeDetectionService {
  constructor() {
    this.subscription = null;
    this.isMonitoring = false;
    this.childId = null;
    this.sensitivity = 1.5;
    this.threshold = 2.0;
    this.isEnabled = false;
    this.lastShakeTime = 0;
    this.shakeCooldown = 5000; // 5 seconds between shake alerts
    this.accelerationHistory = [];
    this.historySize = 10;
  }

  // Load shake detector settings from backend
  async loadSettings(childId) {
    try {
      const detector = await shakeDetectorAPI.getByChildId(childId);
      this.sensitivity = detector.sensitivity || 1.5;
      this.threshold = detector.threshold || 2.0;
      this.isEnabled = detector.is_enabled !== false;
      this.childId = childId;
      return true;
    } catch (error) {
      console.error('Error loading shake detector settings:', error);
      // Use defaults if API call fails
      this.sensitivity = 1.5;
      this.threshold = 2.0;
      this.isEnabled = true;
      this.childId = childId;
      return false;
    }
  }

  // Calculate magnitude of acceleration vector
  calculateMagnitude(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z);
  }

  // Detect if shake threshold is exceeded
  detectShake(acceleration) {
    const magnitude = this.calculateMagnitude(
      acceleration.x,
      acceleration.y,
      acceleration.z
    );

    // Add to history
    this.accelerationHistory.push(magnitude);
    if (this.accelerationHistory.length > this.historySize) {
      this.accelerationHistory.shift();
    }

    // Calculate average of recent accelerations
    const avgAcceleration = this.accelerationHistory.reduce((a, b) => a + b, 0) / this.accelerationHistory.length;

    // Check if magnitude exceeds threshold (adjusted by sensitivity)
    const adjustedThreshold = this.threshold * this.sensitivity;
    const exceedsThreshold = magnitude > adjustedThreshold;

    // Also check for sudden change (difference from average)
    const suddenChange = Math.abs(magnitude - avgAcceleration) > (adjustedThreshold * 0.5);

    return exceedsThreshold || suddenChange;
  }

  // Trigger shake alert
  async triggerShakeAlert() {
    const now = Date.now();
    
    // Cooldown check - prevent multiple alerts in quick succession
    if (now - this.lastShakeTime < this.shakeCooldown) {
      console.log('Shake alert cooldown active, skipping...');
      return;
    }

    this.lastShakeTime = now;

    if (!this.childId) {
      console.warn('No child ID set, cannot send shake alert');
      return;
    }

    try {
      // Get current location if available
      let locationPayload = null;
      try {
        const location = await locationService.getCurrentLocation();
        locationPayload = {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        };
      } catch (error) {
        console.warn('Unable to fetch location for shake alert:', error);
      }

      // Create alert
      await alertsAPI.createAlert({
        child_id: this.childId,
        alert_type: 'SHAKE_TRIGGER',
        message: 'Shake detected - possible emergency situation',
        location: locationPayload,
      });

      console.log('Shake alert sent successfully');
    } catch (error) {
      console.error('Error sending shake alert:', error);
    }
  }

  // Start monitoring for shakes
  async startMonitoring(childId) {
    if (this.isMonitoring) {
      console.log('Shake detection already monitoring');
      return;
    }

    // Load settings first
    await this.loadSettings(childId);

    if (!this.isEnabled) {
      console.log('Shake detection is disabled');
      return;
    }

    this.isMonitoring = true;
    this.accelerationHistory = [];

    // Set update interval (100ms = 10 updates per second)
    setUpdateIntervalForType(SensorTypes.accelerometer, 100);

    // Subscribe to accelerometer
    this.subscription = accelerometer.subscribe(
      ({ x, y, z, timestamp }) => {
        if (this.detectShake({ x, y, z, timestamp })) {
          console.log('Shake detected!');
          this.triggerShakeAlert();
        }
      },
      (error) => {
        console.error('Accelerometer error:', error);
        this.isMonitoring = false;
      }
    );

    console.log('Shake detection monitoring started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    this.isMonitoring = false;
    this.accelerationHistory = [];
    console.log('Shake detection monitoring stopped');
  }

  // Update settings and reload
  async updateSettings(childId, settings) {
    try {
      await shakeDetectorAPI.update(childId, settings);
      await this.loadSettings(childId);
      return true;
    } catch (error) {
      console.error('Error updating shake detector settings:', error);
      return false;
    }
  }

  // Check if monitoring is active
  isActive() {
    return this.isMonitoring;
  }
}

// Export singleton instance
export default new ShakeDetectionService();

