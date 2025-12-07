# Background Location Tracking Setup

This guide explains how background location tracking works and how to configure it properly.

## Overview

The app now supports **background location tracking**, which means location updates continue even when:
- The app is in the background
- The app is closed/minimized
- The device screen is locked
- The device is rebooted (optional)

## How It Works

### Architecture

1. **Foreground Tracking**: Uses `react-native-geolocation-service` when app is active
2. **Background Tracking**: Uses `react-native-background-fetch` for periodic updates when app is in background
3. **Headless Mode**: Continues tracking even after app termination (Android)

### Update Intervals

- **Foreground**: Updates every 30 seconds (configurable)
- **Background**: Updates every 30 seconds (configurable, minimum 15 minutes on Android)
- **Battery Optimization**: Android may limit frequency to save battery

## Android Permissions

### Required Permissions

The app requests the following permissions:

1. **ACCESS_FINE_LOCATION** - For precise GPS location
2. **ACCESS_COARSE_LOCATION** - For network-based location
3. **ACCESS_BACKGROUND_LOCATION** - For location when app is in background (Android 10+)

### Permission Setup

1. **First Launch**: App will request foreground location permissions
2. **Background Permission**: On Android 10+, you'll be prompted for background location
3. **Settings**: If denied, user must enable "Allow all the time" in:
   - Settings → Apps → ChildSecurityApp → Permissions → Location → "Allow all the time"

### Manual Permission Setup

If background permission is denied:

1. Go to **Settings** → **Apps** → **ChildSecurityApp**
2. Tap **Permissions** → **Location**
3. Select **"Allow all the time"** (not just "While using the app")

## Battery Optimization

### Android Battery Optimization

Android may limit background location updates to save battery. To ensure continuous tracking:

1. Go to **Settings** → **Apps** → **ChildSecurityApp**
2. Tap **Battery** → **Battery optimization**
3. Select **"Not optimized"** or **"Don't optimize"**

### Battery Impact

- **High Accuracy GPS**: Higher battery usage, more precise location
- **Background Updates**: Minimal battery impact with proper configuration
- **Recommendation**: Keep device charged or use power-saving mode sparingly

## Testing Background Tracking

### Test Steps

1. **Start Tracking**: Open app and tap "Start Tracking"
2. **Verify Foreground**: Check that location updates appear in dashboard
3. **Background Test**: Press home button (app goes to background)
4. **Wait**: Wait 30-60 seconds
5. **Check Dashboard**: Open app or check web dashboard - should see new location updates
6. **Termination Test**: Force close the app
7. **Wait**: Wait 1-2 minutes
8. **Check Dashboard**: Should see location updates even though app was closed

### Verification

- Check backend logs for location update requests
- Check web dashboard map for location updates
- Check device logs: `adb logcat | grep BackgroundFetch`

## Troubleshooting

### Location Not Updating in Background

**Possible Causes:**
1. Background location permission not granted
2. Battery optimization enabled
3. Device in power-saving mode
4. Network connectivity issues

**Solutions:**
1. Verify "Allow all the time" permission is granted
2. Disable battery optimization for the app
3. Disable power-saving mode
4. Check internet connection

### App Crashes in Background

**Possible Causes:**
1. Missing permissions
2. Background task timeout
3. Memory issues

**Solutions:**
1. Check Android logs: `adb logcat`
2. Verify all permissions are granted
3. Restart the app
4. Check device available memory

### Updates Too Infrequent

**Android Limitation:**
- Android enforces minimum 15-minute interval for background fetch
- Actual interval may be longer based on battery optimization
- System may batch updates to save battery

**Workarounds:**
1. Disable battery optimization
2. Keep app in foreground when possible
3. Use high-priority mode (may require foreground service)

## Configuration

### Update Interval

Default: 30 seconds (30000ms)

To change:
```javascript
// In LocationTrackingScreen.js
await locationService.startTracking(childId, 30000); // 30 seconds
```

**Note**: Android may enforce minimum 15 minutes for background updates regardless of setting.

### Auto-Start on Boot

Background tracking can auto-start when device boots (if enabled):

1. App must have been started at least once
2. Tracking must have been active before reboot
3. Requires `RECEIVE_BOOT_COMPLETED` permission (already included)

## Privacy & Security

### Location Data

- Location data is only sent to your backend server
- Data is encrypted in transit (HTTPS)
- No third-party location services are used
- Location history is stored in your database

### User Control

- Users can stop tracking at any time
- Location permission can be revoked in device settings
- No tracking occurs without explicit user consent

## Best Practices

1. **Battery Management**: Keep device charged during extended tracking
2. **Network**: Ensure stable internet connection for reliable updates
3. **Testing**: Test background tracking before relying on it
4. **Monitoring**: Regularly check dashboard to verify updates
5. **Permissions**: Explain to users why background location is needed

## Technical Details

### Background Fetch

- Uses `react-native-background-fetch` library
- Implements headless JS task for background execution
- Registers task in `index.js` for app termination scenarios

### Location Service

- Dual-mode: Foreground (interval-based) + Background (fetch-based)
- Automatic fallback if background service fails
- Graceful error handling and retry logic

### Android Manifest

Required permissions already configured:
- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_LOCATION`
- `WAKE_LOCK`
- `RECEIVE_BOOT_COMPLETED`

## Limitations

1. **Android Minimum Interval**: 15 minutes minimum for background fetch
2. **Battery Optimization**: System may limit updates to save battery
3. **Network Dependency**: Requires internet connection for updates
4. **Device Restrictions**: Some devices may have stricter background limits

## Support

For issues or questions:
1. Check device logs: `adb logcat`
2. Verify permissions in device settings
3. Test with app in foreground first
4. Check backend logs for received updates

