package com.anonymous.app_lock

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import java.util.HashSet
import java.util.concurrent.atomic.AtomicBoolean

class OverlayService : Service() {
    companion object {
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "OverlayServiceChannel"
        private const val TAG = "OverlayService"
        private const val OVERLAY_REMOVAL_DELAY_MS: Long = 0 // No delay for removal - instant
        
        // Use a separate static set to store locked packages
        private val lockedPackages = HashSet<String>()
        private val overlayVisible = AtomicBoolean(false)
        
        fun isPackageLocked(packageName: String): Boolean {
            val isLocked = lockedPackages.contains(packageName)
            Log.d(TAG, "Checking if package is locked: $packageName, result: $isLocked")
            return isLocked
        }
        
        fun updateLockedPackages(packages: List<String>) {
            synchronized(lockedPackages) {
                lockedPackages.clear()
                lockedPackages.addAll(packages)
                Log.d(TAG, "Updated locked packages: ${lockedPackages.joinToString()}")
            }
        }
    }
    
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private val hideRunnable = Runnable {
        removeOverlayView()
    }
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service onCreate called")
        try {
            createNotificationChannel()
            startForegroundWithNotification()
            windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        } catch (e: Exception) {
            Log.e(TAG, "Error in onCreate: ${e.message}")
            e.printStackTrace()
        }
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val serviceChannel = NotificationChannel(
                    CHANNEL_ID,
                    "Overlay Service Channel",
                    NotificationManager.IMPORTANCE_LOW
                )
                serviceChannel.description = "Used to keep the app lock service running"
                val manager = getSystemService(NotificationManager::class.java)
                manager.createNotificationChannel(serviceChannel)
                Log.d(TAG, "Notification channel created")
            } catch (e: Exception) {
                Log.e(TAG, "Error creating notification channel: ${e.message}")
                e.printStackTrace()
            }
        }
    }
    
    private fun startForegroundWithNotification() {
        try {
            val notification = NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Jail It")
                .setContentText("Your apps are locked")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build()
            
            startForeground(NOTIFICATION_ID, notification)
            Log.d(TAG, "Started as foreground service")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting foreground: ${e.message}")
            e.printStackTrace()
        }
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand called with intent: ${intent?.action}, extras: ${intent?.extras}")
        
        try {
            intent?.let {
                if (it.hasExtra("showOverlay") && it.getBooleanExtra("showOverlay", false)) {
                    Log.d(TAG, "Received show overlay command")
                    showOverlay()
                } else if (it.hasExtra("hideOverlay") && it.getBooleanExtra("hideOverlay", false)) {
                    Log.d(TAG, "Received hide overlay command")
                    hideOverlay()
                }
                
                if (it.hasExtra("lockedPackages")) {
                    try {
                        val packages = it.getStringArrayExtra("lockedPackages")
                        if (packages != null) {
                            val packagesList = packages.toList()
                            Log.d(TAG, "Updating locked packages: ${packagesList.joinToString()}")
                            updateLockedPackages(packagesList)
                        } else {
                            Log.d(TAG, "Received null packages array")
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error processing lockedPackages: ${e.message}")
                        e.printStackTrace()
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in onStartCommand: ${e.message}")
            e.printStackTrace()
        }
        
        return START_STICKY
    }
    
    fun showOverlay() {
        Log.d(TAG, "showOverlay called, current state: ${overlayVisible.get()}")
        if (overlayVisible.get()) {
            Log.d(TAG, "Overlay already visible, skipping")
            return
        }
        
        try {
            // Cancel any pending hide operations
            mainHandler.removeCallbacks(hideRunnable)
            
            // Create new overlay view if needed
            if (overlayView == null) {
                Log.d(TAG, "Creating new overlay view")
                overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_layout, null)
            }
            
            // Set up the layout parameters for the overlay
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) 
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY 
                else 
                    WindowManager.LayoutParams.TYPE_SYSTEM_ALERT,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                        or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                        or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            )
            params.gravity = Gravity.CENTER
            
            // Add the view to window manager if it's not already added
            if (!overlayVisible.get() && overlayView != null) {
                try {
                    Log.d(TAG, "Adding overlay view to window manager")
                    windowManager?.addView(overlayView, params)
                    overlayVisible.set(true)
                    Log.d(TAG, "View added successfully")
                } catch (e: Exception) {
                    // Check if it's a "View already added" exception
                    if (e.message?.contains("already added") == true) {
                        Log.w(TAG, "View was already added, removing first")
                        try {
                            removeOverlayView()
                            windowManager?.addView(overlayView, params)
                            overlayVisible.set(true)
                            Log.d(TAG, "View added after removing old one")
                        } catch (e2: Exception) {
                            Log.e(TAG, "Failed to add view after removing: ${e2.message}")
                            e2.printStackTrace()
                        }
                    } else {
                        Log.e(TAG, "Error adding view: ${e.message}")
                        e.printStackTrace()
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error showing overlay: ${e.message}")
            e.printStackTrace()
        }
    }
    
    fun hideOverlay() {
        Log.d(TAG, "hideOverlay called, current state: ${overlayVisible.get()}")
        // Remove immediately for snappier response
        removeOverlayView()
    }
    
    private fun removeOverlayView() {
        Log.d(TAG, "removeOverlayView called, overlay visible: ${overlayVisible.get()}")
        try {
            if (overlayVisible.get() && overlayView != null) {
                Log.d(TAG, "Removing overlay view")
                try {
                    windowManager?.removeView(overlayView)
                    overlayVisible.set(false)
                    Log.d(TAG, "Overlay view removed")
                } catch (e: Exception) {
                    Log.e(TAG, "Error removing view: ${e.message}")
                    
                    // Special handling for "not attached to window" exceptions
                    if (e.message?.contains("not attached") == true) {
                        Log.w(TAG, "View was not attached, resetting state")
                        overlayVisible.set(false)
                    }
                    e.printStackTrace()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in removeOverlayView: ${e.message}")
            e.printStackTrace()
        }
    }
    
    override fun onDestroy() {
        Log.d(TAG, "onDestroy called")
        try {
            removeOverlayView()
        } catch (e: Exception) {
            Log.e(TAG, "Error in onDestroy: ${e.message}")
            e.printStackTrace()
        }
        super.onDestroy()
    }
    
    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}