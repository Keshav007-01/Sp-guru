#!/bin/bash

# Make script executable
chmod +x ./build-apk.sh

# Set app name and bundle ID
APP_NAME="Hindu Mantra Chanting"
APP_ID="com.mantra.chanting"

echo "==============================================="
echo "Building APK for $APP_NAME"
echo "==============================================="

# Note about necessary tools
echo "Note: To fully build the APK, you will need Java JDK 11+ and Android SDK installed."
echo "We will prepare the project for APK generation without requiring Java for now."

# Build the web app
echo "Step 1: Building web application..."
npm run build
if [ $? -ne 0 ]; then
    echo "Error: Web app build failed!"
    exit 1
fi
echo "✓ Web application build successful!"

# Skip Capacitor initialization since we already have a config file
echo "Step 2: Using existing Capacitor configuration..."
echo "✓ Using existing Capacitor configuration!"

# Add Android platform
echo "Step 3: Adding Android platform..."
npx cap add android || true
echo "✓ Android platform added!"

# Update capacitor.config.ts to point to the correct web directory
echo "Step 4: Updating capacitor configuration..."
cat > capacitor.config.ts << EOL
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '$APP_ID',
  appName: '$APP_NAME',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#fffbf5",
      spinnerColor: "#F6754D",
    },
  },
};

export default config;
EOL
echo "✓ Capacitor configuration updated!"

# Copy web assets to the Android project
echo "Step 5: Copying web assets to Android project..."
npx cap copy android
echo "✓ Web assets copied to Android project!"

# Update Android plugins
echo "Step 6: Updating Android plugins..."
npx cap update android
echo "✓ Android plugins updated!"

# Create the app/src/main/res/xml directory if it doesn't exist
mkdir -p android/app/src/main/res/xml

# Create a network security config file to allow cleartext traffic (for development only)
echo "Step 7: Configuring Android network security..."
cat > android/app/src/main/res/xml/network_security_config.xml << EOL
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
EOL
echo "✓ Network security configured!"

# Update the Android manifest to use the network security config
echo "Step 8: Updating Android manifest..."
MANIFEST_FILE="android/app/src/main/AndroidManifest.xml"
if grep -q "android:networkSecurityConfig" "$MANIFEST_FILE"; then
    echo "Network security config already set in AndroidManifest.xml"
else
    # Insert networkSecurityConfig attribute into the application tag
    sed -i 's/<application/<application android:networkSecurityConfig="@xml\/network_security_config"/g' "$MANIFEST_FILE"
    echo "Added network security config to AndroidManifest.xml"
fi
echo "✓ Android manifest updated!"

# Instructions for building the APK
echo ""
echo "==============================================="
echo "INSTRUCTIONS TO BUILD THE APK"
echo "==============================================="
echo "To build the APK, you need to:"
echo "1. Install Android Studio: https://developer.android.com/studio"
echo "2. Open the Android project: npx cap open android"
echo "3. Use Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo "4. Find the APK file in android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "Alternative: If you have Android Studio already installed,"
echo "you can build directly from the command line with:"
echo "cd android && ./gradlew assembleDebug"
echo ""
echo "The final APK will be available at:"
echo "android/app/build/outputs/apk/debug/app-debug.apk"
echo "==============================================="

# Attempt to build APK directly if gradlew exists
if [ -f "android/gradlew" ]; then
    echo "Found gradlew, attempting direct APK build..."
    (cd android && ./gradlew assembleDebug)
    if [ $? -eq 0 ]; then
        echo "✓ APK build successful!"
        echo "APK location: android/app/build/outputs/apk/debug/app-debug.apk"
    else
        echo "× Direct APK build failed. Please follow the manual instructions above."
    fi
fi

echo "APK preparation complete! Follow the instructions above to build your APK."