# React Native Setup Guide

## Quick Start

### 1. Install Android Studio
Download and install from: https://developer.android.com/studio

### 2. Create Android Virtual Device (AVD)
1. Open Android Studio
2. Tools → Device Manager
3. Create Virtual Device
4. Choose a device (e.g., Pixel 5)
5. Select a system image (API 33 or 34 recommended)
6. Finish

### 3. Install Dependencies

```bash
cd mobile
npm install
```

### 4. Start Metro Bundler

```bash
npm start
```

Keep this running in a separate terminal.

### 5. Run the App

**In a new terminal:**

```bash
cd mobile
npm run android
```

This will:
- Build the Android app
- Install it on the emulator/device
- Start the app

## Testing on Physical Android Device

### Step 1: Enable Developer Mode
1. Go to Settings → About Phone
2. Tap "Build Number" 7 times
3. Go back to Settings → Developer Options
4. Enable "USB Debugging"

### Step 2: Connect Device
1. Connect Android device to MacBook via USB
2. Accept USB debugging prompt on phone
3. Verify connection: `adb devices` (should show your device)

### Step 3: Update API URL
Edit `mobile/src/services/api.js`:

```javascript
const API_BASE_URL = 'http://192.168.0.29:8000'; // Your MacBook's IP
```

### Step 4: Ensure Same Network
- MacBook and Android device must be on same WiFi network
- Backend server running on MacBook

### Step 5: Run App
```bash
npm run android
```

## Network Configuration

### For Android Emulator
- API URL: `http://10.0.2.2:8000` (already configured)
- This maps to `localhost` on your MacBook

### For Physical Device
- API URL: `http://192.168.0.29:8000` (your MacBook's IP)
- Update in `src/services/api.js`

### Find Your MacBook IP
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## Troubleshooting

### Metro Bundler Not Starting
```bash
npm start -- --reset-cache
```

### Build Fails
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Can't Connect to Backend
1. Check backend is running: `http://localhost:8000`
2. Check API URL in `src/services/api.js`
3. For physical device, verify same WiFi network
4. Check firewall allows port 8000

### App Crashes on Launch
1. Check Metro bundler is running
2. Check Android Studio logs
3. Try: `cd android && ./gradlew clean && cd ..`

## Project Structure

```
mobile/
├── src/
│   ├── screens/          # Screen components
│   ├── services/          # API services
│   └── navigation/        # Navigation setup
├── android/               # Android native code
└── ios/                   # iOS native code (for future)
```

## Next: Add Native Features

Once basic app is working, you can add:

1. **Location Tracking**
   ```bash
   npm install react-native-geolocation-service
   ```

2. **Shake Detection**
   ```bash
   npm install react-native-sensors
   ```

3. **Background Services**
   - Configure in AndroidManifest.xml
   - Use react-native-background-job

