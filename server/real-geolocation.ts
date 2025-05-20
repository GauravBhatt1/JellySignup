import fetch from 'node-fetch';

interface PreciseLocationData {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
  accuracy?: number;
}

/**
 * Specialized geolocation services that provide more accurate coordinates
 * Uses multiple services to get the most accurate data available
 */
export async function getPreciseLocation(ip: string): Promise<PreciseLocationData | null> {
  // Clean IP address
  const cleanIP = ip.includes(',') ? ip.split(',')[0].trim() : ip;
  
  // For development/testing, remove private IPs
  if (cleanIP === '127.0.0.1' || cleanIP === 'localhost' || 
      cleanIP.startsWith('192.168.') || cleanIP.startsWith('10.')) {
    console.log(`Skipping private/local IP: ${cleanIP}`);
    return null;
  }
  
  try {
    // First try: ipwhois.app (very precise coordinates)
    try {
      const response = await fetch(`https://ipwho.is/${cleanIP}`);
      if (response.ok) {
        const data = await response.json() as any;
        if (data.success && data.latitude && data.longitude) {
          console.log(`IPWHOIS found precise location: ${data.city}, ${data.region}, ${data.country} [${data.latitude}, ${data.longitude}]`);
          return {
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.city || 'Unknown',
            region: data.region || 'Unknown',
            country: data.country_code || 'Unknown',
            accuracy: 1 // High accuracy
          };
        }
      }
    } catch (error) {
      console.log('IPWHOIS service failed:', error);
    }
    
    // Second try: ipapi.co (good accuracy)
    try {
      const response = await fetch(`https://ipapi.co/${cleanIP}/json/`);
      if (response.ok) {
        const data = await response.json() as any;
        if (!data.error && data.latitude && data.longitude) {
          console.log(`IPAPI found precise location: ${data.city}, ${data.region}, ${data.country_name} [${data.latitude}, ${data.longitude}]`);
          return {
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.city || 'Unknown',
            region: data.region || 'Unknown',
            country: data.country || 'Unknown',
            accuracy: 2 // Medium-high accuracy
          };
        }
      }
    } catch (error) {
      console.log('IPAPI service failed:', error);
    }
    
    // Third try: ipinfo.io
    try {
      const response = await fetch(`https://ipinfo.io/${cleanIP}/json`);
      if (response.ok) {
        const data = await response.json() as any;
        if (data.loc) {
          const [lat, lon] = data.loc.split(',').map(Number);
          console.log(`IPINFO found precise location: ${data.city}, ${data.region}, ${data.country} [${lat}, ${lon}]`);
          return {
            latitude: lat,
            longitude: lon,
            city: data.city || 'Unknown',
            region: data.region || 'Unknown',
            country: data.country || 'Unknown',
            accuracy: 3 // Medium accuracy
          };
        }
      }
    } catch (error) {
      console.log('IPINFO service failed:', error);
    }
    
    // Last resort: geolocation-db.com
    try {
      const response = await fetch(`https://geolocation-db.com/json/${cleanIP}`);
      if (response.ok) {
        const data = await response.json() as any;
        if (data.latitude && data.longitude) {
          console.log(`GeolocationDB found location: ${data.city}, ${data.state}, ${data.country_name} [${data.latitude}, ${data.longitude}]`);
          return {
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.city || 'Unknown',
            region: data.state || 'Unknown',
            country: data.country_code || 'Unknown',
            accuracy: 4 // Lower accuracy
          };
        }
      }
    } catch (error) {
      console.log('GeolocationDB service failed:', error);
    }
    
    console.log(`Could not determine precise location for IP: ${cleanIP}`);
    return null;
  } catch (error) {
    console.error(`Error in getPreciseLocation:`, error);
    return null;
  }
}

/**
 * Generate a browser script that gets the user's actual GPS location if they permit it
 * This provides the most accurate location tracking possible (device level)
 */
export function getClientSideLocationScript(): string {
  return `
    // This script attempts to get the user's exact GPS location from their device
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          // We have the exact GPS coordinates!
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          
          // Send this to our server
          fetch('/api/update-client-location', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              latitude,
              longitude,
              accuracy,
              source: 'browser-gps'
            })
          });
          
          console.log('Precise GPS location sent to server:', latitude, longitude);
        },
        function(error) {
          console.log('Could not get precise GPS location:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  `;
}

/**
 * For testing: Generate worldwide locations for visualization testing
 */
export function getDemoLocations(): PreciseLocationData[] {
  return [
    { 
      latitude: 40.7128, 
      longitude: -74.0060,
      city: "New York City",
      region: "New York",
      country: "US"
    },
    { 
      latitude: 28.6139, 
      longitude: 77.2090,
      city: "New Delhi",
      region: "Delhi",
      country: "IN"
    },
    { 
      latitude: 35.6762, 
      longitude: 139.6503,
      city: "Tokyo",
      region: "Tokyo",
      country: "JP"
    },
    { 
      latitude: 51.5074, 
      longitude: -0.1278,
      city: "London",
      region: "England",
      country: "GB"
    },
    { 
      latitude: -33.8688, 
      longitude: 151.2093,
      city: "Sydney",
      region: "New South Wales",
      country: "AU"
    }
  ];
}