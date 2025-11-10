#!/bin/bash

# Script to run React Native app on physical Android device

# Set up environment
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH=$PATH:$JAVA_HOME/bin

# Check if device is connected
echo "Checking for connected Android device..."
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo "❌ No Android device found!"
    echo "Please:"
    echo "1. Connect your device via USB"
    echo "2. Enable USB Debugging"
    echo "3. Run: adb devices"
    exit 1
fi

echo "✅ Device found!"
adb devices

# Change to mobile directory
cd "$(dirname "$0")"

echo ""
echo "🚀 Starting Android build..."
echo "⏳ First build may take 5-10 minutes (downloading dependencies)"
echo ""

# Run Android build
npm run android

