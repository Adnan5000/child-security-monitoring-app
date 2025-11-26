import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { alertsAPI } from '../services/api';

function AlertsScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadAlerts = async () => {
    try {
      setError('');
      const data = await alertsAPI.getAlerts();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err.message || 'Unable to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const handleAck = async (alertId) => {
    try {
      await alertsAPI.acknowledgeAlert(alertId);
      Alert.alert('Acknowledged', 'Alert marked as acknowledged.');
      loadAlerts();
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to acknowledge alert');
    }
  };

  const statusChipStyle = (status) => {
    switch (status) {
      case 'PENDING':
        return [styles.statusChip, { backgroundColor: '#fef3c7', color: '#b45309' }];
      case 'ACKNOWLEDGED':
        return [styles.statusChip, { backgroundColor: '#d1fae5', color: '#047857' }];
      default:
        return [styles.statusChip, { backgroundColor: '#e0f2fe', color: '#0369a1' }];
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>SOS button presses and shake detections</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAlerts}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.emptyText}>SOS or shake alerts will appear here.</Text>
        </View>
      ) : (
        alerts.map((alert) => (
          <View key={alert.alert_id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{alert.child_name}</Text>
              <Text style={statusChipStyle(alert.status)}>{alert.status}</Text>
            </View>
            <Text style={styles.meta}>
              {alert.alert_type.replace('_', ' ')} · {new Date(alert.timestamp).toLocaleString()}
            </Text>
            {alert.message ? <Text style={styles.message}>{alert.message}</Text> : null}
            {alert.location ? (
              <Text style={styles.location}>
                📍{' '}
                {alert.location.address ||
                  `${alert.location.latitude.toFixed(5)}, ${alert.location.longitude.toFixed(5)}`}
              </Text>
            ) : null}
            {alert.status !== 'ACKNOWLEDGED' && (
              <TouchableOpacity style={styles.ackButton} onPress={() => handleAck(alert.alert_id)}>
                <Text style={styles.ackText}>Mark Acknowledged</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  loader: {
    padding: 40,
    alignItems: 'center',
  },
  errorCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fdecea',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    color: '#b91c1c',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  emptyState: {
    padding: 30,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '600',
  },
  meta: {
    color: '#555',
    marginBottom: 8,
  },
  message: {
    color: '#333',
    marginBottom: 6,
  },
  location: {
    color: '#4b5563',
    fontSize: 12,
    marginBottom: 10,
  },
  ackButton: {
    marginTop: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  ackText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default AlertsScreen;


