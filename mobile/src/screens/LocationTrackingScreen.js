import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { childrenAPI, alertsAPI } from '../services/api';
import locationService from '../services/locationService';
import shakeDetectionService from '../services/shakeDetectionService';

function LocationTrackingScreen({ navigation }) {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [sendingSOS, setSendingSOS] = useState(false);
  const [isShakeMonitoring, setIsShakeMonitoring] = useState(false);

  useEffect(() => {
    loadChildren();
    checkTrackingStatus();
    checkShakeStatus();
    
    // Cleanup on unmount
    return () => {
      shakeDetectionService.stopMonitoring();
    };
  }, []);

  const loadChildren = async () => {
    try {
      const data = await childrenAPI.getAll();
      setChildren(data);
      if (data.length === 1) {
        // Auto-select if only one child
        setSelectedChildId(data[0].child_id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  const checkTrackingStatus = () => {
    setIsTracking(locationService.isActive());
  };

  const checkShakeStatus = () => {
    setIsShakeMonitoring(shakeDetectionService.isActive());
  };

  const handleStartTracking = async () => {
    if (!selectedChildId) {
      Alert.alert('Error', 'Please select a child first');
      return;
    }

    try {
      await locationService.startTracking(selectedChildId, 30000); // 30 seconds
      setIsTracking(true);
      
      // Start shake detection automatically when tracking starts
      await shakeDetectionService.startMonitoring(selectedChildId);
      setIsShakeMonitoring(true);
      
      // Get initial location
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      setLastUpdate(new Date());
      
      Alert.alert('Success', 'Location tracking and shake detection started!');
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking. Please check permissions.');
    }
  };

  const handleStopTracking = async () => {
    await locationService.stopTracking();
    shakeDetectionService.stopMonitoring();
    setIsTracking(false);
    setIsShakeMonitoring(false);
    setCurrentLocation(null);
    setLastUpdate(null);
    Alert.alert('Stopped', 'Location tracking and shake detection stopped');
  };

  const handleTestLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      setLastUpdate(new Date());
      
      if (selectedChildId) {
        await locationService.sendLocationUpdate(location);
        Alert.alert('Success', 'Test location sent!');
      } else {
        Alert.alert('Location', `Lat: ${location.latitude.toFixed(6)}\nLng: ${location.longitude.toFixed(6)}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please check permissions.');
    }
  };

  const handleSendSOS = async () => {
    if (!selectedChildId) {
      Alert.alert('Error', 'Please select a child first');
      return;
    }

    setSendingSOS(true);
    try {
      let locationPayload = null;
      try {
        const location = await locationService.getCurrentLocation();
        locationPayload = {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        };
      } catch (error) {
        console.warn('Unable to fetch location for SOS alert:', error);
      }

      await alertsAPI.createAlert({
        child_id: selectedChildId,
        alert_type: 'SOS_BUTTON',
        message: 'SOS triggered from mobile device',
        location: locationPayload,
      });
      Alert.alert('SOS Sent', 'Parents have been notified.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send SOS alert');
    } finally {
      setSendingSOS(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>📍 Location Tracking</Text>
          <Text style={styles.subtitle}>
            Share your location with your parents
          </Text>
        </View>

        {children.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No children found</Text>
            <Text style={styles.emptySubtext}>
              Please add a child profile first
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('AddChild')}
            >
              <Text style={styles.buttonText}>Add Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Child Profile</Text>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.child_id}
                  style={[
                    styles.childOption,
                    selectedChildId === child.child_id && styles.childOptionSelected,
                  ]}
                  onPress={() => setSelectedChildId(child.child_id)}
                >
                  <View style={styles.childOptionContent}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childAge}>Age: {child.age}</Text>
                  </View>
                  {selectedChildId === child.child_id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location Status</Text>
              <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Location Tracking:</Text>
                  <Text
                    style={[
                      styles.statusValue,
                      isTracking ? styles.statusActive : styles.statusInactive,
                    ]}
                  >
                    {isTracking ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Shake Detection:</Text>
                  <Text
                    style={[
                      styles.statusValue,
                      isShakeMonitoring ? styles.statusActive : styles.statusInactive,
                    ]}
                  >
                    {isShakeMonitoring ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                {currentLocation && (
                  <>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Latitude:</Text>
                      <Text style={styles.statusValue}>
                        {currentLocation.latitude.toFixed(6)}
                      </Text>
                    </View>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Longitude:</Text>
                      <Text style={styles.statusValue}>
                        {currentLocation.longitude.toFixed(6)}
                      </Text>
                    </View>
                    {currentLocation.accuracy && (
                      <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Accuracy:</Text>
                        <Text style={styles.statusValue}>
                          {currentLocation.accuracy.toFixed(0)}m
                        </Text>
                      </View>
                    )}
                  </>
                )}
                {lastUpdate && (
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Last Update:</Text>
                    <Text style={styles.statusValue}>
                      {lastUpdate.toLocaleTimeString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.actions}>
              {!isTracking ? (
                <TouchableOpacity
                  style={[styles.button, styles.startButton]}
                  onPress={handleStartTracking}
                  disabled={!selectedChildId}
                >
                  <Text style={styles.buttonText}>▶ Start Tracking</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.stopButton]}
                  onPress={handleStopTracking}
                >
                  <Text style={styles.buttonText}>⏹ Stop Tracking</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.testButton]}
                onPress={handleTestLocation}
              >
                <Text style={styles.buttonText}>📍 Test Location</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.sosButton]}
                onPress={handleSendSOS}
                disabled={sendingSOS || !selectedChildId}
              >
                <Text style={styles.buttonText}>
                  {sendingSOS ? 'Sending SOS...' : '🚨 Send SOS Alert'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>ℹ️ How it works:</Text>
              <Text style={styles.infoText}>
                • Select your child profile{'\n'}
                • Tap "Start Tracking" to begin sharing your location{'\n'}
                • Location updates are sent every 30 seconds{'\n'}
                • Parents can see your location on the dashboard map{'\n'}
                • Tap "Stop Tracking" to stop sharing
              </Text>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  childOption: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  childOptionSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  childOptionContent: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  childAge: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    fontSize: 24,
    color: '#667eea',
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  statusActive: {
    color: '#28a745',
  },
  statusInactive: {
    color: '#dc3545',
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  testButton: {
    backgroundColor: '#667eea',
  },
  sosButton: {
    backgroundColor: '#f97316',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default LocationTrackingScreen;

