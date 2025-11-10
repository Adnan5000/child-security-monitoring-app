# Running on Physical Android Device - Setup Guide

## Prerequisites Check

### 1. Android Studio Installation

You need Android Studio installed with:
- Android SDK
- Android SDK Platform Tools (includes ADB)
- Java Development Kit (JDK)

**Install Android Studio:**
1. Download from: https://developer.android.com/studio
2. Install and open Android Studio
3. Go to: **Tools → SDK Manager**
4. Install:
   - Android SDK Platform (API 33 or 34)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools (this includes ADB)

### 2. Set Up Environment Variables

Add these to your `~/.zshrc` file:

```bash
# Add to ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload:
```bash
source ~/.zshrc
```

### 3. Install Java Development Kit (JDK)

React Native requires JDK. Install via Homebrew:

```bash
brew install --cask zulu@17
```

Or download from: https://adoptium.net/

### 4. Verify Setup

Run React Native doctor to check your setup:

```bash
cd mobile
npx react-native doctor
```

This will tell you what's missing.

## Steps to Run on Physical Device

### Step 1: Enable USB Debugging on Android Device

1. Go to **Settings → About Phone**
2. Tap **"Build Number"** 7 times (enables Developer Options)
3. Go back to **Settings → Developer Options**
4. Enable **"USB Debugging"**
5. Enable **"Install via USB"** (if available)

### Step 2: Connect Device via USB

1. Connect your Android device to MacBook via USB cable
2. On your phone, accept the "Allow USB Debugging" prompt
3. Verify connection:

```bash
# If ADB is in PATH
adb devices

# Or using full path
~/Library/Android/sdk/platform-tools/adb devices
```

You should see your device listed.

### Step 3: Update API URL (Already Done ✅)

The API URL is already configured for physical device:
- File: `mobile/src/services/api.js`
- Current setting: `DEVICE_TYPE = 'device'`
- API URL: `http://192.168.0.29:8000`

### Step 4: Ensure Same WiFi Network

**Important:** Both your MacBook and Android device must be on the **same WiFi network**.

### Step 5: Start Metro Bundler

In one terminal:
```bash
cd mobile
npm start
```

Keep this running!

### Step 6: Build and Install App

In another terminal:
```bash
cd mobile
npm run android
```

This will:
- Build the app
- Install it on your device
- Launch it automatically

## Troubleshooting

### "adb: command not found"

**Solution:** Add Android SDK platform-tools to PATH (see Step 2 above)

**Or use full path:**
```bash
~/Library/Android/sdk/platform-tools/adb devices
```

### "Unable to locate a Java Runtime"

**Solution:** Install JDK (see Step 3 above)

### "Network request failed" in app

**Check:**
1. Backend server is running: `http://localhost:8000`
2. Both devices on same WiFi
3. MacBook IP is correct: Check with `ifconfig`
4. Firewall allows port 8000

**Test backend from device:**
- Open Chrome on Android device
- Visit: `http://192.168.0.29:8000/api/health`
- Should see JSON response

### Build Fails

Try cleaning:
```bash
cd mobile/android
./gradlew clean
cd ../..
npm run android
```

### Device Not Detected

1. Unplug and replug USB cable
2. Try different USB cable/port
3. Check USB debugging is enabled
4. Try `adb kill-server && adb start-server`

## Alternative: Use Android Studio

1. Open Android Studio
2. Open project: `mobile/android`
3. Connect device
4. Click Run button (▶️)

## Testing Backend Connection

Before running the app, test if your device can reach the backend:

1. On Android device, open Chrome browser
2. Visit: `http://192.168.0.29:8000/api/health`
3. Should see: `{"status":"healthy",...}`

If this fails, the app won't be able to connect either.

## Quick Checklist

- [ ] Android Studio installed
- [ ] Android SDK Platform-Tools installed
- [ ] JDK installed
- [ ] Environment variables set (`ANDROID_HOME`, `PATH`)
- [ ] USB Debugging enabled on device
- [ ] Device connected and detected (`adb devices`)
- [ ] API URL updated for physical device
- [ ] Both devices on same WiFi
- [ ] Backend server running
- [ ] Metro bundler running (`npm start`)
- [ ] Ready to run `npm run android`

