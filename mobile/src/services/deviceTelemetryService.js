import { Platform, AppState } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import { deviceStatusAPI } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class DeviceTelemetryService {
  constructor() {
    this.isMonitoring = false;
    this.updateInterval = null;
    this.appStateListener = null;
    this.netInfoListener = null;
    this.currentAppState = AppState.currentState;
    this.currentNetworkState = null;
    this.updateIntervalMs = 60000; // Update every 60 seconds
    this.childId = null;
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

  // Get battery level (Android)
  async getBatteryLevel() {
    try {
      if (Platform.OS === 'android') {
        // Use DeviceInfo for battery level
        const batteryLevel = await DeviceInfo.getBatteryLevel();
        if (batteryLevel !== null && batteryLevel !== undefined) {
          // Convert to percentage (0-100)
          return Math.round(batteryLevel * 100);
        }
      }
      // iOS or fallback
      return null;
    } catch (error) {
      console.error('Error getting battery level:', error);
      return null;
    }
  }

  // Get network type and status
  async getNetworkInfo() {
    try {
      const state = await NetInfo.fetch();
      
      if (!state.isConnected) {
        return {
          network_status: 'Offline',
          network_type: 'None',
          is_connected: false,
        };
      }

      let networkType = 'Unknown';
      let networkStatus = 'Online';

      if (state.type === 'wifi') {
        networkType = 'WiFi';
        networkStatus = 'Online (WiFi)';
      } else if (state.type === 'cellular') {
        // Get cellular generation
        const details = state.details;
        if (details && details.cellularGeneration) {
          const gen = details.cellularGeneration;
          if (gen === '5g') {
            networkType = '5G';
            networkStatus = 'Online (5G)';
          } else if (gen === '4g') {
            networkType = '4G';
            networkStatus = 'Online (4G)';
          } else if (gen === '3g') {
            networkType = '3G';
            networkStatus = 'Online (3G)';
          } else if (gen === '2g') {
            networkType = '2G';
            networkStatus = 'Online (2G)';
          } else {
            networkType = 'Cellular';
            networkStatus = 'Online (Cellular)';
          }
        } else {
          // Fallback: try to infer from connection type
          networkType = 'Cellular';
          networkStatus = 'Online (Cellular)';
        }
      } else if (state.type === 'ethernet') {
        networkType = 'Ethernet';
        networkStatus = 'Online (Ethernet)';
      } else if (state.type === 'none') {
        networkType = 'None';
        networkStatus = 'Offline';
      } else {
        networkType = state.type;
        networkStatus = `Online (${state.type})`;
      }

      return {
        network_status: networkStatus,
        network_type: networkType,
        is_connected: state.isConnected,
        is_expensive: state.isInternetReachable === false || state.details?.isConnectionExpensive === true,
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return {
        network_status: 'Unknown',
        network_type: 'Unknown',
        is_connected: false,
      };
    }
  }

  // Get app state (foreground/background)
  getAppState() {
    return this.currentAppState;
  }

  // Get app state string
  getAppStateString() {
    switch (this.currentAppState) {
      case 'active':
        return 'Active';
      case 'background':
        return 'Background';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  }

  // Collect all telemetry data
  async collectTelemetry() {
    try {
      const batteryLevel = await this.getBatteryLevel();
      const networkInfo = await this.getNetworkInfo();
      const appState = this.getAppStateString();

      return {
        battery_level: batteryLevel,
        network_status: networkInfo.network_status,
        network_type: networkInfo.network_type,
        app_status: appState,
        is_connected: networkInfo.is_connected,
        is_expensive: networkInfo.is_expensive,
      };
    } catch (error) {
      console.error('Error collecting telemetry:', error);
      return {
        battery_level: null,
        network_status: 'Unknown',
        network_type: 'Unknown',
        app_status: this.getAppStateString(),
        is_connected: false,
      };
    }
  }

  // Send telemetry to backend
  async sendTelemetry(childId = null) {
    try {
      const targetChildId = childId || this.childId || (await this.getChildId());
      if (!targetChildId) {
        console.warn('No child ID available for telemetry update');
        return false;
      }

      const telemetry = await this.collectTelemetry();
      
      // Get device ID
      const deviceId = await DeviceInfo.getUniqueId();

      await deviceStatusAPI.updateStatus(targetChildId, {
        device_id: deviceId,
        battery_level: telemetry.battery_level,
        network_status: telemetry.network_status,
        network_type: telemetry.network_type,
        app_status: telemetry.app_status,
      });

      console.log('Device telemetry sent:', telemetry);
      return true;
    } catch (error) {
      console.error('Error sending telemetry:', error);
      return false;
    }
  }

  // Handle app state changes
  handleAppStateChange = (nextAppState) => {
    if (this.currentAppState !== nextAppState) {
      this.currentAppState = nextAppState;
      console.log('App state changed to:', nextAppState);
      
      // Send telemetry immediately on state change
      if (this.isMonitoring) {
        this.sendTelemetry();
      }
    }
  };

  // Handle network state changes
  handleNetworkStateChange = (state) => {
    this.currentNetworkState = state;
    console.log('Network state changed:', state.type, state.isConnected);
    
    // Send telemetry immediately on network change
    if (this.isMonitoring) {
      this.sendTelemetry();
    }
  };

  // Start monitoring telemetry
  async startMonitoring(childId = null, intervalMs = 60000) {
    if (this.isMonitoring) {
      console.log('Telemetry monitoring already started');
      return;
    }

    this.childId = childId || (await this.getChildId());
    this.updateIntervalMs = intervalMs;

    // Set up app state listener
    this.appStateListener = AppState.addEventListener('change', this.handleAppStateChange);
    this.currentAppState = AppState.currentState;

    // Set up network state listener
    this.netInfoListener = NetInfo.addEventListener(this.handleNetworkStateChange);
    
    // Get initial network state
    const initialNetworkState = await NetInfo.fetch();
    this.currentNetworkState = initialNetworkState;

    // Send initial telemetry
    await this.sendTelemetry(this.childId);

    // Set up periodic updates
    this.updateInterval = setInterval(async () => {
      await this.sendTelemetry(this.childId);
    }, this.updateIntervalMs);

    this.isMonitoring = true;
    console.log(`Device telemetry monitoring started (updates every ${this.updateIntervalMs / 1000}s)`);
  }

  // Stop monitoring telemetry
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    // Remove listeners
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }

    if (this.netInfoListener) {
      this.netInfoListener();
      this.netInfoListener = null;
    }

    // Clear interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isMonitoring = false;
    console.log('Device telemetry monitoring stopped');
  }

  // Get current telemetry (without sending)
  async getCurrentTelemetry() {
    return await this.collectTelemetry();
  }

  // Check if monitoring is active
  isActive() {
    return this.isMonitoring;
  }
}

// Export singleton instance
export default new DeviceTelemetryService();

