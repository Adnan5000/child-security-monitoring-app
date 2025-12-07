/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Register headless task for background location
import backgroundLocationService from './src/services/backgroundLocationService';
import BackgroundFetch from 'react-native-background-fetch';

// Background fetch headless task (runs when app is terminated)
const headlessTask = async (taskId) => {
  console.log('[BackgroundFetch] Headless task started:', taskId);
  try {
    await backgroundLocationService.onBackgroundFetch(taskId);
  } catch (error) {
    console.error('[BackgroundFetch] Headless task error:', error);
    BackgroundFetch.finish(taskId);
  }
};

// Register headless task
BackgroundFetch.registerHeadlessTask(headlessTask);

AppRegistry.registerComponent(appName, () => App);
