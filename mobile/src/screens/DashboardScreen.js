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
import { authAPI } from '../services/api';

function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const isAuthenticated = await authAPI.isAuthenticated();
      if (!isAuthenticated) {
        navigation.replace('Login');
        return;
      }

      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
        await authAPI.logout();
        navigation.replace('Login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigation]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authAPI.logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🛡️ Child Security Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back, {user?.first_name}!</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>
                {user?.first_name} {user?.last_name}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            {user?.phone_number ? (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{user?.phone_number}</Text>
              </View>
            ) : null}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text
                style={[
                  styles.infoValue,
                  user?.is_verified ? styles.verified : styles.unverified,
                ]}
              >
                {user?.is_verified ? '✓ Verified' : '⚠ Not Verified'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => navigation.navigate('ChildrenList')}
            >
              <Text style={styles.actionIcon}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.actionText}>My Children</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => navigation.navigate('AddChild')}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionText}>Add Child</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => navigation.navigate('LocationTracking')}
            >
              <Text style={styles.actionIcon}>📍</Text>
              <Text style={styles.actionText}>Location Tracking</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => navigation.navigate('EmergencyContacts')}
            >
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionText}>Emergency Contacts</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => navigation.navigate('Alerts')}
            >
              <Text style={styles.actionIcon}>🚨</Text>
              <Text style={styles.actionText}>Alerts</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => navigation.navigate('ShakeDetector')}
            >
              <Text style={styles.actionIcon}>📱</Text>
              <Text style={styles.actionText}>Shake Detection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 30,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
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
  infoSection: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  verified: {
    color: '#28a745',
  },
  unverified: {
    color: '#ffc107',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '48%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default DashboardScreen;

