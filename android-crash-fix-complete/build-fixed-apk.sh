#!/bin/bash

# Build script for creating debug APK with fixed Android implementation
# This script builds the APK with the fixed Android implementation to avoid crashes

# Function to display error and exit
error_exit() {
  echo "ERROR: $1" >&2
  exit 1
}

# Set color variables for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Mantra Chanting App build process...${NC}"

# Check if the script is run from the correct directory
if [ ! -f "build.gradle" ]; then
  error_exit "This script must be run from the android-crash-fix-complete directory. Please cd to the correct directory."
fi

# Make the script executable
chmod +x gradlew || error_exit "Failed to make gradlew executable"

# Clean up previous builds
echo -e "${YELLOW}Cleaning previous builds...${NC}"
./gradlew clean || error_exit "Failed to clean project"

# Build debug APK (faster for testing)
echo -e "${YELLOW}Building debug APK...${NC}"
./gradlew assembleDebug || error_exit "Failed to build debug APK"

# Check if the APK was generated
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  echo -e "${GREEN}Build successful! APK generated at:${NC}"
  echo -e "${GREEN}$APK_PATH${NC}"
  
  # Copy APK to a more accessible location in parent directory
  cp "$APK_PATH" "../mantra-chanting-fixed.apk" || error_exit "Failed to copy APK to parent directory"
  echo -e "${GREEN}APK also copied to:${NC}"
  echo -e "${GREEN}../mantra-chanting-fixed.apk${NC}"
  
  echo -e "${YELLOW}=========================================================${NC}"
  echo -e "${YELLOW}INSTRUCTIONS TO INSTALL:${NC}"
  echo -e "${YELLOW}1. Download the APK to your phone${NC}"
  echo -e "${YELLOW}2. Enable 'Install from Unknown Sources' in settings${NC}"
  echo -e "${YELLOW}3. Open the APK file on your device to install${NC}"
  echo -e "${YELLOW}=========================================================${NC}"
else
  error_exit "APK not found at expected location: $APK_PATH"
fi

echo -e "${GREEN}Build process completed!${NC}"