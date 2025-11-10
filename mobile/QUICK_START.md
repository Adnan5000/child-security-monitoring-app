# Quick Start - Run on Physical Device

## Step-by-Step Instructions

### Step 1: Verify Device Connection

Open a new terminal and run:
```bash
~/Library/Android/sdk/platform-tools/adb devices
```

You should see your device listed (like `6d11ec4c1220    device`)

### Step 2: Start Metro Bundler

In one terminal, start Metro:
```bash
cd mobile
npm start
```

Keep this running! You'll see something like:
```
Metro waiting on exp://192.168.x.x:8081
```

### Step 3: Build and Install App

**In a NEW terminal**, run:

```bash
cd mobile
source ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH=$PATH:$JAVA_HOME/bin
npm run android
```

**Or use this one-liner:**

```bash
cd /Users/adnanshaukat/Office/University/Projects/child-security-monitoring-app/mobile && export ANDROID_HOME=$HOME/Library/Android/sdk && export PATH=$PATH:$ANDROID_HOME/platform-tools && export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" && export PATH=$PATH:$JAVA_HOME/bin && npm run android
```

### What Will Happen

1. Gradle will download dependencies (first time only - ~5-10 minutes)
2. App will build
3. APK will install on your device
4. App will launch automatically

### Important Notes

- **First build takes 5-10 minutes** (downloading Gradle and dependencies)
- **Keep Metro bundler running** (the `npm start` terminal)
- **Keep device connected** via USB
- **Ensure backend is running** on your MacBook at `http://localhost:8000`

### If Build Fails

1. **Clean and retry:**
   ```bash
   cd mobile/android
   ./gradlew clean
   cd ../..
   npm run android
   ```

2. **Check device connection:**
   ```bash
   ~/Library/Android/sdk/platform-tools/adb devices
   ```

3. **Check backend is accessible from device:**
   - On your Android device, open Chrome
   - Visit: `http://192.168.0.29:8000/api/health`
   - Should see JSON response

### Troubleshooting

**"adb: command not found"**
- Use full path: `~/Library/Android/sdk/platform-tools/adb`

**"Java Runtime not found"**
- Make sure Android Studio is installed
- Use the JAVA_HOME export from above

**Build hangs or fails**
- Make sure you have internet connection (Gradle downloads files)
- First build always takes longer

