import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { childrenAPI, shakeDetectorAPI } from '../services/api';

function ShakeDetectorScreen({ navigation }) {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [detector, setDetector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    sensitivity: 1.5,
    threshold: 2.0,
    is_enabled: true,
  });

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadDetector(selectedChildId);
    } else {
      setDetector(null);
      setFormData({ sensitivity: 1.5, threshold: 2.0, is_enabled: true });
    }
  }, [selectedChildId]);

  const loadChildren = async () => {
    try {
      const data = await childrenAPI.getAll();
      setChildren(data);
      if (data.length > 0 && !selectedChildId) {
        setSelectedChildId(data[0].child_id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  const loadDetector = async (childId) => {
    try {
      setLoading(true);
      const data = await shakeDetectorAPI.getByChildId(childId);
      setDetector(data);
      setFormData({
        sensitivity: data.sensitivity,
        threshold: data.threshold,
        is_enabled: data.is_enabled,
      });
      setError('');
    } catch (err) {
      // Detector might not exist yet, that's okay
      setDetector(null);
      setFormData({ sensitivity: 1.5, threshold: 2.0, is_enabled: true });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'is_enabled' ? value : parseFloat(value) || value,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedChildId) {
      Alert.alert('Error', 'Please select a child');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (detector) {
        await shakeDetectorAPI.update(selectedChildId, formData);
      } else {
        await shakeDetectorAPI.create(selectedChildId, formData);
      }
      await loadDetector(selectedChildId);
      Alert.alert('Success', 'Shake detector settings saved successfully!');
    } catch (err) {
      setError(err.message || 'Failed to save settings');
      Alert.alert('Error', err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !detector) {
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
        <Text style={styles.title}>📱 Shake Detection</Text>
        <Text style={styles.subtitle}>Configure automatic shake detection</Text>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

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

      {selectedChildId && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shake Detection Settings</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Sensitivity</Text>
            <TextInput
              style={styles.input}
              value={formData.sensitivity.toString()}
              onChangeText={(value) => handleChange('sensitivity', value)}
              keyboardType="numeric"
              placeholder="1.5"
            />
            <Text style={styles.helpText}>
              Higher values = more sensitive (detects lighter shakes). Recommended: 1.0 - 2.0
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Threshold</Text>
            <TextInput
              style={styles.input}
              value={formData.threshold.toString()}
              onChangeText={(value) => handleChange('threshold', value)}
              keyboardType="numeric"
              placeholder="2.0"
            />
            <Text style={styles.helpText}>
              Acceleration threshold for triggering alert. Recommended: 1.5 - 3.0
            </Text>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.label}>Enable Shake Detection</Text>
              <Switch
                value={formData.is_enabled}
                onValueChange={(value) => handleChange('is_enabled', value)}
                trackColor={{ false: '#767577', true: '#667eea' }}
                thumbColor={formData.is_enabled ? '#fff' : '#f4f3f4'}
              />
            </View>
            <Text style={styles.helpText}>
              When enabled, the app will automatically detect shakes and send alerts
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ How it works:</Text>
        <Text style={styles.infoText}>
          • Shake detection monitors the device's accelerometer{'\n'}
          • When a shake exceeds the threshold, an alert is automatically sent{'\n'}
          • Alerts include the child's current location{'\n'}
          • There's a 5-second cooldown between shake alerts{'\n'}
          • Shake detection starts automatically when location tracking is enabled
        </Text>
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
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorCard: {
    padding: 15,
    backgroundColor: '#fee',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: '#c33',
    textAlign: 'center',
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
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
    marginTop: 10,
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

export default ShakeDetectorScreen;

