# Android Build Instructions for Mantra Chanting App

This document provides instructions for building the Mantra Chanting app with crash-resistant Android configuration.

## Prerequisites

- Android Studio Arctic Fox (2020.3.1) or newer
- JDK 11 or newer
- Android SDK 30 or newer
- Gradle 8.13 or newer

## Setup Process

1. **Import Android Project**
   - Open Android Studio
   - Select "Open an existing Android Studio project"
   - Navigate to and select the `android-crash-fix` directory

2. **Gradle Sync**
   - Wait for the Gradle sync to complete
   - If any dependency resolution errors appear, click on "Fix" option provided by Android Studio

3. **Build Configuration**
   - The project uses the following configuration:
     - minSdkVersion: 25
     - targetSdkVersion: 33
     - compileSdkVersion: 33

4. **Build APK**
   - Select Build > Build Bundle(s) / APK(s) > Build APK(s)
   - The APK will be generated in `app/build/outputs/apk/debug/`

## Special Notes

### Kotlin Resolution

This project explicitly forces Kotlin 1.8.10 across all dependencies to prevent version conflicts. The following settings ensure compatibility:

```groovy
// In root build.gradle
configurations.all {
    resolutionStrategy {
        force 'org.jetbrains.kotlin:kotlin-stdlib:1.8.10'
        force 'org.jetbrains.kotlin:kotlin-stdlib-common:1.8.10'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.10'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.10'
    }
}
```

### Memory Management

To prevent out-of-memory errors:

1. In `gradle.properties`:
```
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=1024m
```

2. In `app/build.gradle`:
```groovy
android {
    dexOptions {
        javaMaxHeapSize "4g"
    }
    
    defaultConfig {
        multiDexEnabled true
    }
}
```

### WebView Configuration

For optimal WebView performance, the following settings are applied:

1. WebView debugging is enabled for development builds
2. Content Security Policy is configured to allow necessary resources
3. Network security config allows cleartext traffic for development

## Troubleshooting

### App Crashes on Startup

1. Check logcat for detailed error messages
2. Verify the WebView is properly initialized
3. Ensure all required permissions are declared in AndroidManifest.xml
4. Verify the correct paths are set for assets and resources

### Build Failures

1. Verify Gradle version compatibility
2. Ensure all dependencies are compatible
3. Check for Kotlin version conflicts
4. Make sure the Android SDK is properly installed and configured