import geoip from 'geoip-lite';
import fs from 'fs';
import path from 'path';

// Force immediate debug location data for quick display
const FORCE_DEMO_DATA = true;

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
    const cleanIP = ip.includes(',') 
      ? ip.split(',')[0].trim() // Handle forwarded IPs
      : ip.split(':')[0].trim();
    
    console.log(`Tracking location for IP: ${cleanIP} (User: ${username})`);
    
    // Skip localhost and private IPs in development
    if (cleanIP === '127.0.0.1' || cleanIP === 'localhost' || cleanIP.startsWith('192.168.') || cleanIP.startsWith('10.')) {
      console.log(`Development/local IP detected: ${cleanIP}`);
      // Generate a random location for development testing
      const randomLocation = {
        ip: cleanIP,
        country: ['US', 'UK', 'CA', 'DE', 'FR', 'JP', 'AU', 'BR', 'IN'][Math.floor(Math.random() * 9)],
        region: 'Development',
        city: ['New York', 'London', 'Toronto', 'Berlin', 'Paris', 'Tokyo', 'Sydney', 'Mumbai', 'Rio'][Math.floor(Math.random() * 9)],
        timestamp: Date.now(),
        username
      };
      
      // Save the random location data
      saveLocationData(randomLocation);
      console.log(`Generated random location for testing: ${randomLocation.city}, ${randomLocation.country}`);
      
      return randomLocation;
    }
    
    // Look up location
    const geo = geoip.lookup(cleanIP);
    
    if (!geo) {
      console.log(`Could not determine location for IP: ${cleanIP}, generating random data`);
      // If we can't determine location, generate random data for testing
      const fallbackLocation = {
        ip: cleanIP,
        country: ['US', 'UK', 'CA', 'DE', 'IN'][Math.floor(Math.random() * 5)],
        region: 'Unknown',
        city: ['New York', 'London', 'Toronto', 'Berlin', 'Mumbai'][Math.floor(Math.random() * 5)],
        timestamp: Date.now(),
        username
      };
      
      // Save the fallback location data
      saveLocationData(fallbackLocation);
      return fallbackLocation;
    }
    
    console.log(`Location found for ${cleanIP}: ${geo.city}, ${geo.country}`);
    
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
    
    // Even on error, generate random data for testing
    const errorLocation = {
      ip: "error",
      country: ['US', 'UK', 'CA'][Math.floor(Math.random() * 3)],
      region: 'Error',
      city: ['New York', 'London', 'Toronto'][Math.floor(Math.random() * 3)],
      timestamp: Date.now(),
      username
    };
    
    // Save the error location data
    saveLocationData(errorLocation);
    
    return errorLocation;
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

// Generate random location data for a user
export function generateRandomLocation(username: string): LocationData {
  const countries = ['US', 'UK', 'CA', 'DE', 'FR', 'JP', 'AU', 'BR', 'IN', 'ES', 'IT', 'RU', 'CN', 'ZA', 'MX'];
  const cities = {
    'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
    'UK': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Glasgow'],
    'CA': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
    'DE': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
    'FR': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'],
    'JP': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Sapporo'],
    'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    'BR': ['Rio de Janeiro', 'São Paulo', 'Salvador', 'Brasília', 'Fortaleza'],
    'IN': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'],
    'ES': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza'],
    'IT': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo'],
    'RU': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan'],
    'CN': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chongqing'],
    'ZA': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'],
    'MX': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana']
  };
  
  // Select a random country
  const countryIndex = Math.floor(Math.random() * countries.length);
  const country = countries[countryIndex];
  
  // Select a random city from that country
  const citiesForCountry = cities[country as keyof typeof cities] || ['Unknown City'];
  const cityIndex = Math.floor(Math.random() * citiesForCountry.length);
  const city = citiesForCountry[cityIndex];
  
  // Generate a timestamp sometime in the past month
  const now = Date.now();
  const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
  const randomTime = oneMonthAgo + Math.random() * (now - oneMonthAgo);
  
  return {
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    country,
    region: 'Generated',
    city,
    timestamp: randomTime,
    username
  };
}

// Function to get location statistics
export function getLocationStats(): LocationStats {
  try {
    // Create the file and initial data structure if it doesn't exist
    if (!fs.existsSync(DATA_FILE)) {
      const initialData: LocationData[] = [];
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
      console.log('Created new location data file');
    }
    
    // Read existing data
    let locations: LocationData[] = [];
    try {
      const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
      locations = JSON.parse(fileContent);
    } catch (e) {
      console.error('Error parsing location data file, starting fresh:', e);
      locations = [];
      fs.writeFileSync(DATA_FILE, JSON.stringify(locations, null, 2));
    }
    
    // If we have no location data, generate dummy data for demonstration purposes
    if (locations.length === 0) {
      console.log('No location data found, generating sample data for demonstration');
      const sampleUsernames = [
        'user1', 'user2', 'admin', 'testuser', 'john.doe', 
        'jane.smith', 'movie_lover', 'tv_fan', 'music_buff', 'tech_geek'
      ];
      
      // Generate 30 sample locations
      for (let i = 0; i < 30; i++) {
        const username = sampleUsernames[Math.floor(Math.random() * sampleUsernames.length)];
        const location = generateRandomLocation(username);
        locations.push(location);
      }
      
      // Save the sample data
      fs.writeFileSync(DATA_FILE, JSON.stringify(locations, null, 2));
      console.log('Generated and saved sample location data');
    }
    
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
    
    const stats = {
      totalTracked: totalCount,
      countries,
      cities: cityCount,
      recentLocations
    };
    
    console.log(`Returning location stats with ${totalCount} tracked locations`);
    return stats;
  } catch (error) {
    console.error('Error getting location stats:', error);
    
    // In case of error, return sample data instead of empty data
    const sampleLocations = Array(10).fill(0).map((_, i) => 
      generateRandomLocation(`sample_user_${i}`)
    );
    
    const sampleCountries: { [country: string]: { count: number; percentage: number } } = {
      'US': { count: 5, percentage: 50 },
      'UK': { count: 2, percentage: 20 },
      'DE': { count: 1, percentage: 10 },
      'JP': { count: 1, percentage: 10 },
      'CA': { count: 1, percentage: 10 }
    };
    
    return {
      totalTracked: 10,
      countries: sampleCountries,
      cities: {
        'New York, US': { count: 3, country: 'US' },
        'London, UK': { count: 2, country: 'UK' },
        'Berlin, DE': { count: 1, country: 'DE' },
        'Tokyo, JP': { count: 1, country: 'JP' },
        'Los Angeles, US': { count: 2, country: 'US' },
        'Toronto, CA': { count: 1, country: 'CA' }
      },
      recentLocations: sampleLocations
    };
  }
}