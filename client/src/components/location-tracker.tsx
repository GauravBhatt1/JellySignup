import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCcw } from 'lucide-react';
import axios from 'axios';

// Component to handle browser-based geolocation
export function LocationTracker() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Function to get the user's exact location using browser Geolocation API
  const getExactLocation = () => {
    // Reset states
    setStatus('loading');
    setError(null);
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    // Get current position with high accuracy
    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setLocation(newLocation);
        setStatus('success');
        
        // Send the exact location to the server
        axios.post('/api/update-client-location', {
          ...newLocation,
          source: 'browser-gps'
        })
        .then(() => {
          console.log('Exact location sent to server successfully');
        })
        .catch((err) => {
          console.error('Failed to send exact location to server:', err);
        });
      },
      // Error callback
      (err) => {
        setStatus('error');
        setError(`Error getting location: ${err.message}`);
      },
      // Options
      {
        enableHighAccuracy: true, // Use GPS if available
        timeout: 10000,           // Time to wait for a position
        maximumAge: 0             // Always get a fresh position
      }
    );
  };
  
  // Automatically try to get location on component mount
  useEffect(() => {
    getExactLocation();
  }, []);
  
  return (
    <div className="mb-4">
      {/* Status indicator */}
      {status === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-yellow-500">
          <div className="animate-spin h-4 w-4 border-2 border-yellow-500 rounded-full border-t-transparent"></div>
          Getting your exact location...
        </div>
      )}
      
      {/* Success state */}
      {status === 'success' && location && (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2 text-emerald-500">
            <MapPin className="h-4 w-4" />
            <span>Precise location detected!</span>
          </div>
          
          <div className="text-xs text-gray-400">
            Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            <br />
            Accuracy: ±{Math.round(location.accuracy)}m
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 text-xs h-7 px-2"
            onClick={getExactLocation}
          >
            <RefreshCcw className="h-3 w-3 mr-1" />
            Update Location
          </Button>
        </div>
      )}
      
      {/* Error state */}
      {status === 'error' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-red-500">
            <span>Location access failed: {error}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 text-xs h-7 px-2"
            onClick={getExactLocation}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

// Hook to trigger location tracking once on app mount
export function useLocationTracking() {
  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser');
      return;
    }
    
    // Try to get the user's location once on component mount
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Send the exact location to the server
        axios.post('/api/update-client-location', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'browser-gps'
        })
        .then(() => {
          console.log('Exact location tracked successfully');
        })
        .catch((err) => {
          console.error('Failed to track exact location:', err);
        });
      },
      (error) => {
        console.log('Error getting location:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);
}