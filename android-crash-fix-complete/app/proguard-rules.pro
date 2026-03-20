# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep JavaScript interfaces to prevent minification
-keepclassmembers class com.getcapacitor.** {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep capacitor plugins 
-keep class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin

# Keep WebView JavaScript interfaces 
-keepattributes *Annotation*
-keepattributes JavascriptInterface

# Keep Kotlin serialization
-keepattributes *Annotation*, InnerClasses
-keep class kotlin.** { *; }
-keep class org.jetbrains.** { *; }

# Common rules to keep for all apps
-keep class androidx.** { *; }
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-keep class org.jetbrains.** { *; }
-keep class com.google.android.** { *; }

# Cordova-related classes
-keep class org.apache.cordova.** { *; }
-keep public class * extends org.apache.cordova.CordovaPlugin

# JSR 305 annotations are for embedding nullability information.
-dontwarn javax.annotation.**