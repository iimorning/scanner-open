package com.example.fitnesstracker;

import android.Manifest;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.firebase.analytics.FirebaseAnalytics;

public class MainActivity extends AppCompatActivity {
    
    private FusedLocationProviderClient fusedLocationClient;
    private FirebaseAnalytics firebaseAnalytics;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        firebaseAnalytics = FirebaseAnalytics.getInstance(this);
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        
        requestPermissions();
    }
    
    private void requestPermissions() {
        String[] permissions = {
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.CAMERA,
            Manifest.permission.READ_CONTACTS
        };
        
        ActivityCompat.requestPermissions(this, permissions, 1001);
    }
}

