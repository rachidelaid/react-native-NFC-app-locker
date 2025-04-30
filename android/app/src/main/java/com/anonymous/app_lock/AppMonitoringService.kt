package com.anonymous.app_lock

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class AppMonitoringService : AccessibilityService() {
    companion object {
        private const val TAG = "AppMonitoringService"
        private const val APP_SWITCH_DEBOUNCE_MS: Long = 150 // Reduced debounce time for faster response
        private const val SPECIAL_APPS_LONGER_DELAY_MS: Long = 500 // Longer delay for special apps like Chrome
        
        // List of package names that need special handling
        private val SPECIAL_APPS = listOf(
            "com.android.chrome", 
            "com.google.android.youtube", 
            "org.mozilla.firefox",
            "com.brave.browser"
        )
    }
    
    private var currentPackage: String = ""
    private val mainHandler = Handler(Looper.getMainLooper())
    private var pendingShowOverlay = false
    private var pendingHideOverlay = false
    
    // Debounce runnables
    private val showOverlayRunnable = Runnable {
        if (pendingShowOverlay) {
            sendShowOverlayIntent()
            pendingShowOverlay = false
        }
    }
    
    private val hideOverlayRunnable = Runnable {
        if (pendingHideOverlay) {
            sendHideOverlayIntent()
            pendingHideOverlay = false
        }
    }
    
    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            try {
                event.packageName?.let { packageName ->
                    val packageNameStr = packageName.toString()
                    
                    // Skip if it's the same package to prevent redundant actions
                    if (packageNameStr == currentPackage) {
                        return
                    }
                    
                    Log.d(TAG, "App changed from $currentPackage to $packageNameStr")
                    
                    // Store the previous package before updating current
                    val previousPackage = currentPackage
                    currentPackage = packageNameStr
                    
                    // Cancel any pending operations
                    mainHandler.removeCallbacks(showOverlayRunnable)
                    mainHandler.removeCallbacks(hideOverlayRunnable)
                    pendingShowOverlay = false
                    pendingHideOverlay = false
                    
                    // Check if this package should be locked
                    val shouldLock = OverlayService.isPackageLocked(packageNameStr) && 
                            packageNameStr != this.packageName
                            
                    // Determine if coming from a special app that needs quick handling
                    val comingFromSpecialApp = SPECIAL_APPS.contains(previousPackage)
                    // Determine if going to a special app that needs longer delays
                    val goingToSpecialApp = SPECIAL_APPS.contains(packageNameStr)
                    
                    if (shouldLock) {
                        Log.d(TAG, "App $packageNameStr should be locked, scheduling overlay show")
                        pendingShowOverlay = true
                        
                        // Use longer delay for special apps that might need more time to initialize
                        val delayMs = if (goingToSpecialApp) SPECIAL_APPS_LONGER_DELAY_MS else APP_SWITCH_DEBOUNCE_MS
                        Log.d(TAG, "Using delay of $delayMs ms for showing overlay")
                        
                        // For Chrome and similar browsers, attempt multiple show commands with staggered timing
                        if (goingToSpecialApp) {
                            // Show immediately 
                            sendShowOverlayIntent()
                            
                            // And schedule additional show commands at staggered intervals
                            for (i in 1..5) {
                                mainHandler.postDelayed({
                                    if (currentPackage == packageNameStr) { // Only if still on this app
                                        Log.d(TAG, "Sending additional show overlay intent for $packageNameStr")
                                        sendShowOverlayIntent()
                                    }
                                }, delayMs * i)
                            }
                        } else {
                            // Normal apps just need one delayed show
                            mainHandler.postDelayed(showOverlayRunnable, delayMs)
                        }
                    } else {
                        Log.d(TAG, "App $packageNameStr should not be locked, scheduling overlay hide")
                        pendingHideOverlay = true
                        
                        // Hide more quickly when coming from a special app
                        val delayMs = if (comingFromSpecialApp) 10L else APP_SWITCH_DEBOUNCE_MS
                        Log.d(TAG, "Using delay of $delayMs ms for hiding overlay")
                        mainHandler.postDelayed(hideOverlayRunnable, delayMs)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in accessibility event: ${e.message}")
                e.printStackTrace()
            }
        }
    }
    
    private fun sendShowOverlayIntent() {
        try {
            Log.d(TAG, "Sending intent to show overlay")
            val intent = Intent(this, OverlayService::class.java)
            intent.putExtra("showOverlay", true)
            startService(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error sending show overlay intent: ${e.message}")
            e.printStackTrace()
        }
    }
    
    private fun sendHideOverlayIntent() {
        try {
            Log.d(TAG, "Sending intent to hide overlay")
            val intent = Intent(this, OverlayService::class.java)
            intent.putExtra("hideOverlay", true)
            startService(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error sending hide overlay intent: ${e.message}")
            e.printStackTrace()
        }
    }
    
    override fun onInterrupt() {
        Log.d(TAG, "Accessibility service interrupted")
    }
    
    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(TAG, "Accessibility service connected")
        
        // Force a hide overlay when service starts
        sendHideOverlayIntent()
    }
}