package com.anonymous.app_lock

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = OverlayModule.NAME)
class OverlayModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "OverlayModule"
        private const val OVERLAY_PERMISSION_REQUEST_CODE = 1234
        private const val ACCESSIBILITY_PERMISSION_REQUEST_CODE = 5678
        private const val TAG = "OverlayModule"
    }
    
    private var permissionPromise: Promise? = null

    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
            if (requestCode == OVERLAY_PERMISSION_REQUEST_CODE) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (Settings.canDrawOverlays(activity)) {
                        permissionPromise?.resolve(true)
                    } else {
                        permissionPromise?.resolve(false)
                    }
                    permissionPromise = null
                }
            }
        }
    }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val hasPermission = Settings.canDrawOverlays(reactContext)
                Log.d(TAG, "Checking overlay permission: $hasPermission")
                promise.resolve(hasPermission)
            } else {
                Log.d(TAG, "Device API < 23, no need to check permission")
                promise.resolve(true)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error checking overlay permission: ${e.message}")
            e.printStackTrace()
            promise.reject("ERROR_CHECK_PERMISSION", e.message, e)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            val currentActivity = currentActivity
            if (currentActivity == null) {
                Log.e(TAG, "Activity doesn't exist")
                promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist")
                return
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(currentActivity)) {
                    Log.d(TAG, "Requesting overlay permission")
                    permissionPromise = promise
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:${currentActivity.packageName}")
                    )
                    currentActivity.startActivityForResult(intent, OVERLAY_PERMISSION_REQUEST_CODE)
                } else {
                    Log.d(TAG, "Already have overlay permission")
                    promise.resolve(true)
                }
            } else {
                Log.d(TAG, "Device API < 23, no need to request permission")
                promise.resolve(true)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error requesting overlay permission: ${e.message}")
            e.printStackTrace()
            promise.reject("ERROR_REQUEST_PERMISSION", e.message, e)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val currentActivity = currentActivity
            if (currentActivity == null) {
                Log.e(TAG, "Activity doesn't exist")
                promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist")
                return
            }

            Log.d(TAG, "Opening accessibility settings")
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            currentActivity.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error opening accessibility settings: ${e.message}")
            e.printStackTrace()
            promise.reject("ERROR_OPEN_SETTINGS", e.message, e)
        }
    }

    @ReactMethod
    fun setLockedPackages(packages: ReadableArray, promise: Promise) {
        try {
            Log.d(TAG, "Setting locked packages, size: ${packages.size()}")
            
            // Convert ReadableArray to List<String> safely
            val packageList = ArrayList<String>()
            for (i in 0 until packages.size()) {
                try {
                    val packageName = packages.getString(i)
                    Log.d(TAG, "Adding package to list: $packageName")
                    packageList.add(packageName)
                } catch (e: Exception) {
                    Log.e(TAG, "Error adding package at index $i: ${e.message}")
                    e.printStackTrace()
                }
            }
            
            // Update the static list in OverlayService directly
            OverlayService.updateLockedPackages(packageList)
            Log.d(TAG, "Updated locked packages list")
            
            // Resolve the promise immediately after updating the static list
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error setting locked packages: ${e.message}")
            e.printStackTrace()
            promise.reject("E_SET_LOCKED_PACKAGES", e.message, e)
        }
    }

    @ReactMethod
    fun startOverlayService(promise: Promise) {
        try {
            Log.d(TAG, "Starting overlay service")
            val intent = Intent(reactContext, OverlayService::class.java)
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Log.d(TAG, "Using startForegroundService for API 26+")
                reactContext.startForegroundService(intent)
            } else {
                Log.d(TAG, "Using startService for API < 26")
                reactContext.startService(intent)
            }
            
            Log.d(TAG, "Overlay service started successfully")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error starting overlay service: ${e.message}")
            e.printStackTrace()
            promise.reject("E_START_SERVICE", e.message, e)
        }
    }

    @ReactMethod
    fun stopOverlayService(promise: Promise) {
        try {
            Log.d(TAG, "Stopping overlay service")
            val intent = Intent(reactContext, OverlayService::class.java)
            reactContext.stopService(intent)
            Log.d(TAG, "Overlay service stopped successfully")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping overlay service: ${e.message}")
            e.printStackTrace()
            promise.reject("E_STOP_SERVICE", e.message, e)
        }
    }
}