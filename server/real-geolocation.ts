import fetch from 'node-fetch';
import ipinfo from 'ipinfo';
import ipapi from 'ipapi.co';

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
  try {
    // First try IPInfo which has good accuracy
    try {
      // Remove "::ffff:" prefix from IPv4-mapped IPv6 addresses
      const cleanIp = ip.replace(/^::ffff:/, '');
      
      const response = await new Promise<any>((resolve, reject) => {
        ipinfo(cleanIp, (err: any, data: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      
      if (response && response.loc) {
        const [lat, lon] = response.loc.split(',').map(Number);
        console.log(`IPInfo found location: ${response.city}, ${response.region}, ${response.country}`);
        
        return {
          latitude: lat,
          longitude: lon,
          city: response.city || 'Unknown',
          region: response.region || 'Unknown',
          country: response.country || 'Unknown'
        };
      }
    } catch (ipinfoError) {
      console.log('IPInfo lookup failed, trying next service');
    }
    
    // Try IP-API as fallback
    try {
      const cleanIp = ip.replace(/^::ffff:/, '');
      const response = await fetch(`http://ip-api.com/json/${cleanIp}`);
      const data = await response.json() as any;
      
      if (data && data.status === 'success') {
        console.log(`IP-API found location: ${data.city}, ${data.regionName}, ${data.country}`);
        
        return {
          latitude: data.lat,
          longitude: data.lon,
          city: data.city || 'Unknown',
          region: data.regionName || 'Unknown',
          country: data.countryCode || 'Unknown'
        };
      }
    } catch (ipapiError) {
      console.log('IP-API lookup failed, trying next service');
    }
    
    // Try ipapi.co as another fallback
    try {
      const cleanIp = ip.replace(/^::ffff:/, '');
      
      return new Promise((resolve, reject) => {
        ipapi.location((res: any) => {
          if (res && res.latitude && res.longitude) {
            console.log(`IPAPI.co found location: ${res.city}, ${res.region}, ${res.country_code}`);
            
            resolve({
              latitude: res.latitude,
              longitude: res.longitude,
              city: res.city || 'Unknown',
              region: res.region || 'Unknown',
              country: res.country_code || 'Unknown'
            });
          } else {
            reject(new Error('IPAPI.co returned invalid data'));
          }
        }, cleanIp, '', 'json');
      });
    } catch (ipapiCoError) {
      console.log('IPAPI.co lookup failed');
    }
    
    return null;
  } catch (error) {
    console.error('All geolocation services failed:', error);
    return null;
  }
}

/**
 * Generate a browser script that gets the user's actual GPS location if they permit it
 * This provides the most accurate location tracking possible (device level)
 */
export function getClientSideLocationScript(): string {
  return `
    // Request precise location from the browser
    function trackPreciseLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function(position) {
            // Send the coordinates to the server
            fetch('/api/update-client-location', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: Date.now()
              })
            })
            .then(response => response.json())
            .then(data => console.log('Location tracked successfully'))
            .catch(error => console.error('Error tracking location:', error));
          },
          function(error) {
            console.log('Error getting precise location:', error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      }
    }
    
    // Track location when allowed
    trackPreciseLocation();
  `;
}

/**
 * For testing: Generate worldwide locations for visualization testing
 */
export function getDemoLocations(): PreciseLocationData[] {
  return [
    { latitude: 28.6139, longitude: 77.2090, city: 'New Delhi', region: 'Delhi', country: 'IN' },
    { latitude: 19.0760, longitude: 72.8777, city: 'Mumbai', region: 'Maharashtra', country: 'IN' },
    { latitude: 13.0827, longitude: 80.2707, city: 'Chennai', region: 'Tamil Nadu', country: 'IN' },
    { latitude: 22.5726, longitude: 88.3639, city: 'Kolkata', region: 'West Bengal', country: 'IN' },
    { latitude: 17.3850, longitude: 78.4867, city: 'Hyderabad', region: 'Telangana', country: 'IN' },
    { latitude: 12.9716, longitude: 77.5946, city: 'Bangalore', region: 'Karnataka', country: 'IN' },
    { latitude: 23.0225, longitude: 72.5714, city: 'Ahmedabad', region: 'Gujarat', country: 'IN' },
    { latitude: 26.9124, longitude: 75.7873, city: 'Jaipur', region: 'Rajasthan', country: 'IN' },
    { latitude: 28.9845, longitude: 77.7064, city: 'Meerut', region: 'Uttar Pradesh', country: 'IN' },
    { latitude: 25.5941, longitude: 85.1376, city: 'Patna', region: 'Bihar', country: 'IN' },
    { latitude: 40.7128, longitude: -74.0060, city: 'New York', region: 'New York', country: 'US' },
    { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles', region: 'California', country: 'US' },
    { latitude: 51.5074, longitude: -0.1278, city: 'London', region: 'England', country: 'GB' },
    { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', region: 'Tokyo', country: 'JP' },
    { latitude: 48.8566, longitude: 2.3522, city: 'Paris', region: 'Île-de-France', country: 'FR' },
    { latitude: 55.7558, longitude: 37.6173, city: 'Moscow', region: 'Moscow', country: 'RU' },
    { latitude: -33.8688, longitude: 151.2093, city: 'Sydney', region: 'New South Wales', country: 'AU' },
    { latitude: -22.9068, longitude: -43.1729, city: 'Rio de Janeiro', region: 'Rio de Janeiro', country: 'BR' },
    { latitude: 31.2304, longitude: 121.4737, city: 'Shanghai', region: 'Shanghai', country: 'CN' },
    { latitude: -33.9249, longitude: 18.4241, city: 'Cape Town', region: 'Western Cape', country: 'ZA' }
  ];
}