import fetch from 'node-fetch';
import geoip from 'geoip-lite';
import ipapi from 'ipapi.co';

interface PreciseLocation {
  ip: string;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  org?: string;
  postal?: string;
  timezone?: string;
}

/**
 * Get precise location data from multiple services with fallbacks
 */
export async function getPreciseLocation(ip: string): Promise<PreciseLocation | null> {
  // Clean the IP to handle proxies
  const cleanIP = ip.includes(',') 
    ? ip.split(',')[0].trim() 
    : ip.split(':')[0].trim();

  // Skip localhost and private IPs
  if (cleanIP === '127.0.0.1' || cleanIP === 'localhost' || 
      cleanIP.startsWith('192.168.') || cleanIP.startsWith('10.')) {
    console.log(`Skipping private/local IP: ${cleanIP}`);
    return null;
  }

  try {
    console.log(`Finding precise location for IP: ${cleanIP}`);
    
    // Try IP-API.co first (more accurate)
    try {
      const response = await fetch(`https://ipapi.co/${cleanIP}/json/`);
      if (response.ok) {
        const data = await response.json() as any;
        if (data && !data.error && data.latitude && data.longitude) {
          console.log(`IP-API found location: ${data.city}, ${data.region}, ${data.country_name}`);
          return {
            ip: cleanIP,
            city: data.city || 'Unknown',
            region: data.region || 'Unknown',
            country: data.country || 'Unknown',
            latitude: data.latitude,
            longitude: data.longitude,
            org: data.org,
            postal: data.postal,
            timezone: data.timezone
          };
        }
      }
    } catch (ipApiError) {
      console.log(`IP-API lookup failed: ${(ipApiError as Error).message}`);
    }
    
    // Fallback to ipinfo.io
    try {
      const response = await fetch(`https://ipinfo.io/${cleanIP}/json`);
      if (response.ok) {
        const data = await response.json() as any;
        if (data && data.loc) {
          const [lat, lon] = data.loc.split(',').map(Number);
          console.log(`IPInfo found location: ${data.city}, ${data.region}, ${data.country}`);
          return {
            ip: cleanIP,
            city: data.city || 'Unknown',
            region: data.region || 'Unknown',
            country: data.country || 'Unknown',
            latitude: lat,
            longitude: lon,
            org: data.org,
            postal: data.postal,
            timezone: data.timezone
          };
        }
      }
    } catch (ipinfoError) {
      console.log(`IPInfo lookup failed: ${(ipinfoError as Error).message}`);
    }
    
    // Final fallback to geoip-lite
    const geo = geoip.lookup(cleanIP);
    if (geo && geo.ll) {
      console.log(`GeoIP-lite found location: ${geo.city}, ${geo.region}, ${geo.country}`);
      return {
        ip: cleanIP,
        city: geo.city || 'Unknown',
        region: geo.region || 'Unknown',
        country: geo.country || 'Unknown',
        latitude: geo.ll[0],
        longitude: geo.ll[1],
        timezone: geo.timezone
      };
    }
    
    console.log(`Could not determine location for IP: ${cleanIP}`);
    return null;
  } catch (error) {
    console.error(`Error in getPreciseLocation for ${cleanIP}:`, error);
    return null;
  }
}

/**
 * Get demo locations from around the world for map visualization testing
 */
export function getWorldwideDemoLocations(): PreciseLocation[] {
  return [
    {
      ip: "demo-new-york",
      city: "New York",
      region: "NY",
      country: "US",
      latitude: 40.7128,
      longitude: -74.0060
    },
    {
      ip: "demo-london",
      city: "London",
      region: "England",
      country: "GB",
      latitude: 51.5074,
      longitude: -0.1278
    },
    {
      ip: "demo-tokyo",
      city: "Tokyo",
      region: "Tokyo",
      country: "JP",
      latitude: 35.6762,
      longitude: 139.6503
    },
    {
      ip: "demo-sydney",
      city: "Sydney",
      region: "NSW",
      country: "AU",
      latitude: -33.8688,
      longitude: 151.2093
    },
    {
      ip: "demo-rio",
      city: "Rio de Janeiro",
      region: "RJ",
      country: "BR",
      latitude: -22.9068,
      longitude: -43.1729
    },
    {
      ip: "demo-delhi",
      city: "Delhi",
      region: "Delhi",
      country: "IN",
      latitude: 28.7041,
      longitude: 77.1025
    }
  ];
}