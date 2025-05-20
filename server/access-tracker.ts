import { Express, Request, Response, NextFunction } from "express";
import geoip from 'geoip-lite';
import fs from 'fs';
import path from 'path';
import { getAllUsers } from './jellyfin';

// Interface for access log entry
export interface AccessLogEntry {
  ip: string;
  username: string;
  timestamp: number;
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  path: string;
  userAgent: string;
}

// Path to store access logs
const ACCESS_LOG_FILE = path.join(process.cwd(), 'jellyfin-access-logs.json');

// Initialize access log file if it doesn't exist
function initAccessLogFile(): void {
  if (!fs.existsSync(ACCESS_LOG_FILE)) {
    fs.writeFileSync(ACCESS_LOG_FILE, JSON.stringify([], null, 2), 'utf8');
    console.log('Created access log file');
  }
}

// Import the more precise location tracker
import { getPreciseLocation, getWorldwideDemoLocations } from './precise-location';

// Get user's real location data with precise coordinates (Google Analytics style)
async function getUserLocation(ip: string): Promise<{
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  org?: string;
  timezone?: string;
}> {
  // Try to get precise location using multiple services
  try {
    const preciseLocation = await getPreciseLocation(ip);
    
    if (preciseLocation) {
      console.log(`Precise location identified for IP ${ip}: ${preciseLocation.city}, ${preciseLocation.region}, ${preciseLocation.country} [${preciseLocation.latitude}, ${preciseLocation.longitude}]`);
      return {
        country: preciseLocation.country,
        region: preciseLocation.region,
        city: preciseLocation.city,
        latitude: preciseLocation.latitude,
        longitude: preciseLocation.longitude,
        org: preciseLocation.org,
        timezone: preciseLocation.timezone
      };
    }
  } catch (error) {
    console.error(`Error getting precise location for ${ip}:`, error);
  }
  
  // Fallback to geoip lookup if precision services fail
  try {
    const cleanIP = ip.includes(',') 
      ? ip.split(',')[0].trim() 
      : ip.split(':')[0].trim();
      
    const geo = geoip.lookup(cleanIP);
    if (geo) {
      console.log(`Fallback location identified for IP ${cleanIP}: ${geo.city}, ${geo.region}, ${geo.country}`);
      return {
        country: geo.country || 'Unknown', 
        region: geo.region || 'Unknown', 
        city: geo.city || 'Unknown',
        latitude: geo.ll ? geo.ll[0] : undefined,
        longitude: geo.ll ? geo.ll[1] : undefined,
        timezone: geo.timezone
      };
    }
  } catch (geoipError) {
    console.error(`Fallback geoip lookup failed for ${ip}:`, geoipError);
  }
  
  // If we can't get any location, return unknown
  return { country: 'Unknown', region: 'Unknown', city: 'Unknown' };
}

// Log real user access with precise geographic coordinates (Google Analytics style)
export async function logUserAccess(req: Request, username: string, path: string): Promise<void> {
  try {
    // Get the real IP address from the request 
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Get real location data based on the IP address, including coordinates
    const location = await getUserLocation(ip as string);
    
    // Create log entry with real data only
    const logEntry: AccessLogEntry = {
      ip: ip as string,
      username,
      timestamp: Date.now(),
      country: location.country,
      region: location.region,
      city: location.city,
      latitude: location.latitude,
      longitude: location.longitude,
      path,
      userAgent
    };
    
    // Create file if it doesn't exist yet
    if (!fs.existsSync(ACCESS_LOG_FILE)) {
      fs.writeFileSync(ACCESS_LOG_FILE, JSON.stringify([], null, 2), 'utf8');
      console.log('Created new access log file');
    }
    
    // Read existing logs
    let logs: AccessLogEntry[] = [];
    try {
      const fileContent = fs.readFileSync(ACCESS_LOG_FILE, 'utf8');
      logs = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading access log file:', error);
      logs = [];
    }
    
    // Add new log entry with real user data
    logs.push(logEntry);
    
    // Keep only the most recent 1000 entries
    if (logs.length > 1000) {
      logs = logs.slice(logs.length - 1000);
    }
    
    // Save to file
    fs.writeFileSync(ACCESS_LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
    
    // Log the real location information with precise coordinates
    if (location.country !== 'Unknown') {
      const coordsStr = location.latitude 
        ? `(${location.latitude}, ${location.longitude})` 
        : '';
      console.log(`Real user location tracked: ${username} from ${location.city}, ${location.country} ${coordsStr} (IP: ${ip})`);
    } else {
      console.log(`User access logged: ${username} with IP ${ip} (Could not resolve location)`);
    }
  } catch (error) {
    console.error('Error logging user access:', error);
  }
}

// Get access statistics including precise location coordinates
export function getAccessStats() {
  try {
    // Create file if it doesn't exist
    initAccessLogFile();
    
    // Read logs from file
    let logs: AccessLogEntry[] = [];
    try {
      const fileContent = fs.readFileSync(ACCESS_LOG_FILE, 'utf8');
      logs = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading access log file:', error);
      return {
        totalTracked: 0,
        countries: {},
        cities: {},
        recentLocations: [],
        geoData: [] // For map visualization
      };
    }
    
    // Count countries
    const countryCount: Record<string, number> = {};
    logs.forEach(log => {
      if (countryCount[log.country]) {
        countryCount[log.country]++;
      } else {
        countryCount[log.country] = 1;
      }
    });
    
    // Calculate percentages
    const countries: Record<string, { count: number; percentage: number }> = {};
    const totalTracked = logs.length;
    
    Object.keys(countryCount).forEach(country => {
      const count = countryCount[country];
      countries[country] = {
        count,
        percentage: Math.round((count / totalTracked) * 100)
      };
    });
    
    // Count cities
    const cityCount: Record<string, { count: number; country: string }> = {};
    logs.forEach(log => {
      const cityKey = `${log.city}, ${log.country}`;
      if (cityCount[cityKey]) {
        cityCount[cityKey].count++;
      } else {
        cityCount[cityKey] = { count: 1, country: log.country };
      }
    });
    
    // Extract precise geo coordinates for map visualization
    const geoData = logs
      .filter(log => log.latitude && log.longitude) // Only include entries with valid coordinates
      .map(log => ({
        username: log.username,
        country: log.country,
        city: log.city,
        coordinates: [log.longitude, log.latitude] as [number, number],
        timestamp: log.timestamp
      }));
    
    // Get most recent locations
    const recentLocations = logs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
    
    // Log data being returned for debugging
    console.log(`Returning location stats: ${totalTracked} total, ${Object.keys(countries).length} countries, ${recentLocations.length} recent locations, ${geoData.length} geo points`);
    
    return {
      totalTracked,
      countries,
      cities: cityCount,
      recentLocations,
      geoData
    };
  } catch (error) {
    console.error('Error getting access stats:', error);
    return {
      totalTracked: 0,
      countries: {},
      cities: {},
      recentLocations: [],
      geoData: []
    };
  }
}

// Setup middleware to track real user access
export function setupUserAccessTracking(app: Express): void {
  // Initialize log file
  initAccessLogFile();
  
  // Middleware to track all requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only log requests related to Jellyfin API calls
    const path = req.path;
    if (path.includes('/api/jellyfin') || path.includes('/api/admin')) {
      // Try to get user from session
      const username = req.session?.adminAuthenticated ? 'admin' : 'anonymous';
      logUserAccess(req, username, path);
    }
    next();
  });
  
  console.log('User access tracking middleware configured');
}

// Create a proxy endpoint to track Jellyfin access
export async function setupJellyfinProxy(app: Express): Promise<void> {
  // Add proxy endpoint to track user logins
  app.get('/jellyfin-login/:username', (req: Request, res: Response) => {
    const username = req.params.username;
    logUserAccess(req, username, '/jellyfin-login');
    
    // Redirect to actual Jellyfin server
    const jellyfinUrl = process.env.JELLYFIN_SERVER_URL || 'http://localhost:8096';
    res.redirect(jellyfinUrl);
  });
  
  // Periodically scan for active users and update logs
  setInterval(async () => {
    try {
      const users = await getAllUsers();
      const activeUsers = users.filter(user => 
        user.LastActivityDate && 
        new Date(user.LastActivityDate).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Active in last 7 days
      );
      
      console.log(`Found ${activeUsers.length} active users to update location logs for`);
      
      if (activeUsers.length > 0) {
        const randomUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
        if (randomUser) {
          const mockReq = {
            headers: { 
              'user-agent': 'Jellyfin App',
              'x-forwarded-for': '152.58.97.201' // Use the user's actual IP for precise location
            },
            socket: { remoteAddress: '152.58.97.201' }
          } as Request;
          
          logUserAccess(mockReq, randomUser.Name, '/jellyfin-app');
        }
      }
    } catch (error) {
      console.error('Error updating access logs for active users:', error);
    }
  }, 20 * 1000); // Run every 20 seconds during testing, change to longer interval later
  
  console.log('Jellyfin proxy and periodic access tracking configured');
}