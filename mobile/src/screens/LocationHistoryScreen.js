import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { childrenAPI, locationsAPI } from '../services/api';

function LocationHistoryScreen({ navigation, route }) {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(route?.params?.childId || null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hours, setHours] = useState(24);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadHistory();
    }
  }, [selectedChildId, hours]);

  const loadChildren = async () => {
    try {
      const data = await childrenAPI.getAll();
      setChildren(data);
      if (data.length > 0 && !selectedChildId) {
        setSelectedChildId(data[0].child_id);
      }
    } catch (err) {
      setError('Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!selectedChildId) return;

    try {
      setLoading(true);
      const history = await locationsAPI.getChildLocationHistory(selectedChildId, hours);
      const sorted = (history || []).sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setLocations(sorted);
      setError('');
    } catch (err) {
      setError('Failed to load location history');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      full: date.toLocaleString(),
    };
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading && locations.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📍 Location History</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Child</Text>
        {children.map((child) => (
          <TouchableOpacity
            key={child.child_id}
            style={[
              styles.childOption,
              selectedChildId === child.child_id && styles.childOptionSelected,
            ]}
            onPress={() => setSelectedChildId(child.child_id)}
          >
            <Text style={styles.childName}>{child.name}</Text>
            {selectedChildId === child.child_id && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {selectedChildId && (
        <View style={styles.card}>
          <View style={styles.controls}>
            <Text style={styles.controlLabel}>Time Range:</Text>
            <View style={styles.hoursButtons}>
              {[1, 6, 24, 48, 168].map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.hourButton, hours === h && styles.hourButtonActive]}
                  onPress={() => setHours(h)}
                >
                  <Text
                    style={[
                      styles.hourButtonText,
                      hours === h && styles.hourButtonTextActive,
                    ]}
                  >
                    {h === 1 ? '1h' : h === 168 ? '1w' : `${h}h`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadHistory}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : locations.length === 0 && selectedChildId ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No location history found</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Points</Text>
              <Text style={styles.statValue}>{locations.length}</Text>
            </View>
            {locations.length > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Latest</Text>
                <Text style={styles.statValue}>{getTimeAgo(locations[0].timestamp)}</Text>
              </View>
            )}
          </View>

          <View style={styles.timeline}>
            {locations.map((location, index) => {
              const timeInfo = formatTime(location.timestamp);
              const isFirst = index === 0;

              return (
                <View key={location.location_id} style={styles.timelineItem}>
                  <View style={styles.timelineMarker}>
                    <View
                      style={[
                        styles.timelineDot,
                        isFirst && styles.timelineDotFirst,
                      ]}
                    />
                    {index < locations.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View
                    style={[
                      styles.timelineContent,
                      isFirst && styles.timelineContentFirst,
                    ]}
                  >
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineTime}>{timeInfo.time}</Text>
                      <Text style={styles.timeAgo}>{getTimeAgo(location.timestamp)}</Text>
                    </View>
                    <View style={styles.locationDetails}>
                      <Text style={styles.coords}>
                        Lat: {location.latitude.toFixed(6)}
                      </Text>
                      <Text style={styles.coords}>
                        Lng: {location.longitude.toFixed(6)}
                      </Text>
                      {location.address && (
                        <Text style={styles.address}>📍 {location.address}</Text>
                      )}
                      {location.accuracy && (
                        <Text style={styles.accuracy}>
                          Accuracy: {location.accuracy.toFixed(0)}m
                        </Text>
                      )}
                      <Text style={styles.date}>{timeInfo.date}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
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
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  childOption: {
    backgroundColor: '#f8f9fa',
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
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  checkmark: {
    fontSize: 24,
    color: '#667eea',
    fontWeight: 'bold',
  },
  controls: {
    marginTop: 10,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  hoursButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  hourButton: {
    padding: 10px 16px,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  hourButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  hourButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  hourButtonTextActive: {
    color: '#fff',
  },
  errorCard: {
    backgroundColor: '#fee',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: '#c33',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  timeline: {
    paddingLeft: 30,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  timelineMarker: {
    position: 'absolute',
    left: -30,
    top: 0,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#667eea',
    borderWidth: 3,
    borderColor: '#fff',
  },
  timelineDotFirst: {
    backgroundColor: '#28a745',
  },
  timelineLine: {
    width: 2,
    height: 50,
    backgroundColor: '#e0e0e0',
    marginTop: 16,
    marginLeft: 7,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#667eea',
  },
  timelineContentFirst: {
    borderLeftColor: '#28a745',
    backgroundColor: '#f0fff4',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timelineTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  locationDetails: {
    gap: 5,
  },
  coords: {
    fontSize: 14,
    color: '#555',
  },
  address: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginTop: 5,
  },
  accuracy: {
    fontSize: 12,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
  },
});

export default LocationHistoryScreen;

