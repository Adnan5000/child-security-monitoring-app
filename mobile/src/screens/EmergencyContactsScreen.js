import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { emergencyContactsAPI } from '../services/api';

function EmergencyContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadContacts = async () => {
    try {
      setError('');
      const data = await emergencyContactsAPI.getAll();
      setContacts(data.contacts || []);
    } catch (err) {
      setError(err.message || 'Unable to fetch contacts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadContacts();
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
        <Text style={styles.title}>Emergency Contacts</Text>
        <Text style={styles.subtitle}>People notified when alerts are triggered</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadContacts}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No contacts yet</Text>
          <Text style={styles.emptyText}>
            Ask your parent to add trusted contacts from the dashboard.
          </Text>
        </View>
      ) : (
        contacts.map((contact) => (
          <View key={contact.contact_id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{contact.name}</Text>
              <View
                style={[
                  styles.badge,
                  contact.is_verified ? styles.badgeVerified : styles.badgePending,
                ]}
              >
                <Text style={styles.badgeText}>
                  {contact.is_verified ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>
            <Text style={styles.detail}>📞 {contact.phone_number}</Text>
            {contact.email ? <Text style={styles.detail}>✉️ {contact.email}</Text> : null}
            <Text style={styles.priority}>Priority: {contact.priority}</Text>
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
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeVerified: {
    backgroundColor: '#d1fae5',
  },
  badgePending: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 12,
    color: '#111',
  },
  detail: {
    color: '#444',
    marginBottom: 6,
  },
  priority: {
    color: '#666',
    fontSize: 12,
  },
});

export default EmergencyContactsScreen;


