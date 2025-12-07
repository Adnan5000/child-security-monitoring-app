import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { authAPI } from '../services/api';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ChildrenListScreen from '../screens/ChildrenListScreen';
import AddChildScreen from '../screens/AddChildScreen';
import EditChildScreen from '../screens/EditChildScreen';
import LocationTrackingScreen from '../screens/LocationTrackingScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ShakeDetectorScreen from '../screens/ShakeDetectorScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await authAPI.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f5f5f5' },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="ChildrenList" component={ChildrenListScreen} />
            <Stack.Screen name="AddChild" component={AddChildScreen} />
            <Stack.Screen name="EditChild" component={EditChildScreen} />
            <Stack.Screen name="LocationTracking" component={LocationTrackingScreen} />
            <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
            <Stack.Screen name="Alerts" component={AlertsScreen} />
            <Stack.Screen name="ShakeDetector" component={ShakeDetectorScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;

