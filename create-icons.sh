#!/bin/bash

# Make this script executable
chmod +x ./create-icons.sh

# Create directory for temporary icons
mkdir -p temp_icons

# Create a simple SVG icon for the app
cat > temp_icons/app_icon.svg << EOL
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#F6754D" rx="128" ry="128"/>
  <circle cx="256" cy="256" r="160" fill="#FFF8E7"/>
  <path d="M256 116 C 236 116, 220 130, 220 148 C 220 166, 236 180, 256 180 C 276 180, 292 166, 292 148 C 292 130, 276 116, 256 116 Z" fill="#F6754D"/>
  <path d="M256 396 C 236 396, 220 382, 220 364 C 220 346, 236 332, 256 332 C 276 332, 292 346, 292 364 C 292 382, 276 396, 256 396 Z" fill="#F6754D"/>
  <path d="M116 256 C 116 236, 130 220, 148 220 C 166 220, 180 236, 180 256 C 180 276, 166 292, 148 292 C 130 292, 116 276, 116 256 Z" fill="#F6754D"/>
  <path d="M396 256 C 396 236, 382 220, 364 220 C 346 220, 332 236, 332 256 C 332 276, 346 292, 364 292 C 382 292, 396 276, 396 256 Z" fill="#F6754D"/>
  <text x="256" y="266" font-family="Arial" font-size="48" text-anchor="middle" fill="#F6754D">ॐ</text>
</svg>
EOL

echo "Created temporary app icon"

# Create a splash screen image
cat > temp_icons/splash.svg << EOL
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#FFF8E7"/>
  <circle cx="512" cy="512" r="240" fill="#F6754D" opacity="0.2"/>
  <circle cx="512" cy="512" r="200" fill="#F6754D" opacity="0.3"/>
  <circle cx="512" cy="512" r="160" fill="#F6754D" opacity="0.5"/>
  <text x="512" y="532" font-family="Arial" font-size="120" text-anchor="middle" fill="#F6754D">ॐ</text>
  <text x="512" y="650" font-family="Arial" font-size="48" text-anchor="middle" fill="#F6754D">Hindu Mantra Chanting</text>
</svg>
EOL

echo "Created temporary splash screen"

echo "Note: To generate actual Android icons from these SVGs, you would need to convert them to PNG format"
echo "at various sizes and place them in the appropriate Android resource directories."
echo "You may want to use Android Studio's Asset Studio to create proper icon assets."

echo "Instructions for Android Studio:"
echo "1. Open your Android project in Android Studio"
echo "2. Right-click on res folder -> New -> Image Asset"
echo "3. Choose 'Icon Type' -> 'Launcher Icons (Adaptive and Legacy)'"
echo "4. Select 'Asset Type' -> 'Image' and browse to select your SVG file"
echo "5. Adjust the settings as needed and click 'Next' then 'Finish'"