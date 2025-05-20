import geoip from 'geoip-lite';
import fs from 'fs';
import path from 'path';

// Interface for location data
export interface LocationData {
  ip: string;
  country: string;
  region: string;
  city: string;
  timestamp: number;
  username: string;
}

// Interface for location stats
export interface LocationStats {
  totalTracked: number;
  countries: {
    [country: string]: {
      count: number;
      percentage: number;
    };
  };
  cities: {
    [city: string]: {
      count: number;
      country: string;
    };
  };
  recentLocations: LocationData[];
}

// File path for storing location data
const DATA_FILE = path.join(process.cwd(), 'user-locations.json');

// Function to track user location
export function trackUserLocation(ip: string, username: string): LocationData | null {
  try {
    // Clean the IP address (remove port if present)
    const cleanIP = ip.split(':')[0];
    
    // Skip localhost and private IPs in development
    if (cleanIP === '127.0.0.1' || cleanIP === 'localhost' || cleanIP.startsWith('192.168.') || cleanIP.startsWith('10.')) {
      if (process.env.NODE_ENV === 'development') {
        // Generate a random location for development testing
        return {
          ip: cleanIP,
          country: ['US', 'UK', 'CA', 'DE', 'FR'][Math.floor(Math.random() * 5)],
          region: 'Development',
          city: ['New York', 'London', 'Toronto', 'Berlin', 'Paris'][Math.floor(Math.random() * 5)],
          timestamp: Date.now(),
          username
        };
      }
    }
    
    // Look up location
    const geo = geoip.lookup(cleanIP);
    
    if (!geo) {
      console.log(`Could not determine location for IP: ${cleanIP}`);
      return null;
    }
    
    const locationData: LocationData = {
      ip: cleanIP,
      country: geo.country || 'Unknown',
      region: geo.region || 'Unknown',
      city: geo.city || 'Unknown',
      timestamp: Date.now(),
      username
    };
    
    // Save the location data
    saveLocationData(locationData);
    
    return locationData;
  } catch (error) {
    console.error('Error tracking location:', error);
    return null;
  }
}

// Function to save location data to file
function saveLocationData(data: LocationData): void {
  try {
    let locations: LocationData[] = [];
    
    // Read existing data if file exists
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
      try {
        locations = JSON.parse(fileContent);
      } catch (e) {
        console.error('Error parsing location data file:', e);
        // If file is corrupted, start fresh
        locations = [];
      }
    }
    
    // Add new location data
    locations.push(data);
    
    // Keep only the most recent 1000 entries to prevent file from growing too large
    if (locations.length > 1000) {
      locations = locations.slice(locations.length - 1000);
    }
    
    // Write data back to file
    fs.writeFileSync(DATA_FILE, JSON.stringify(locations, null, 2));
  } catch (error) {
    console.error('Error saving location data:', error);
  }
}

// Function to get location statistics
export function getLocationStats(): LocationStats {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return {
        totalTracked: 0,
        countries: {},
        cities: {},
        recentLocations: []
      };
    }
    
    const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
    const locations: LocationData[] = JSON.parse(fileContent);
    
    const countryCount: { [country: string]: number } = {};
    const cityCount: { [city: string]: { count: number; country: string } } = {};
    
    // Count occurrences of each country and city
    locations.forEach(loc => {
      // Count countries
      if (countryCount[loc.country]) {
        countryCount[loc.country]++;
      } else {
        countryCount[loc.country] = 1;
      }
      
      // Count cities
      const cityKey = `${loc.city}, ${loc.country}`;
      if (cityCount[cityKey]) {
        cityCount[cityKey].count++;
      } else {
        cityCount[cityKey] = { count: 1, country: loc.country };
      }
    });
    
    // Calculate percentages for countries
    const totalCount = locations.length;
    const countries: { [country: string]: { count: number; percentage: number } } = {};
    
    Object.keys(countryCount).forEach(country => {
      const count = countryCount[country];
      countries[country] = {
        count,
        percentage: Math.round((count / totalCount) * 100)
      };
    });
    
    // Get most recent locations (last 20)
    const recentLocations = locations
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
    
    return {
      totalTracked: totalCount,
      countries,
      cities: cityCount,
      recentLocations
    };
  } catch (error) {
    console.error('Error getting location stats:', error);
    return {
      totalTracked: 0,
      countries: {},
      cities: {},
      recentLocations: []
    };
  }
}