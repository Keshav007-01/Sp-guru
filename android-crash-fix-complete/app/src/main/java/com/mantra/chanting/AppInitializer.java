package com.mantra.chanting;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.startup.Initializer;

import java.util.Collections;
import java.util.List;

/**
 * AppInitializer handles proper initialization of app components
 * using the Jetpack Startup library.
 * This ensures components are initialized in the correct order.
 */
public class AppInitializer implements Initializer<Boolean> {
    private static final String TAG = "AppInitializer";

    @NonNull
    @Override
    public Boolean create(@NonNull Context context) {
        try {
            Log.i(TAG, "Initializing app components");
            
            // Initialize WebView data directories
            initializeWebViewDirectories(context);
            
            // Initialize other components as needed
            
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error initializing app components", e);
            return false;
        }
    }

    @NonNull
    @Override
    public List<Class<? extends Initializer<?>>> dependencies() {
        // This initializer has no dependencies
        return Collections.emptyList();
    }
    
    /**
     * Ensures WebView directories exist and have proper permissions
     */
    private void initializeWebViewDirectories(Context context) {
        try {
            // Create WebView data directories if they don't exist
            context.getDir("webview", Context.MODE_PRIVATE);
            context.getDir("cache", Context.MODE_PRIVATE);
        } catch (Exception e) {
            Log.e(TAG, "Error initializing WebView directories", e);
        }
    }
}