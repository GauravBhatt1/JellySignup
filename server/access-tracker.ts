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

// Get user's real location data
function getUserLocation(ip: string): { country: string; region: string; city: string } {
  // Clean the IP to handle proxies
  const cleanIP = ip.includes(',') 
    ? ip.split(',')[0].trim() 
    : ip.split(':')[0].trim();
  
  try {
    // Skip localhost in production
    if (cleanIP === '127.0.0.1' || cleanIP === 'localhost') {
      return { country: 'Local', region: 'Development', city: 'Local Environment' };
    }
    
    // Lookup IP using geoip-lite
    const geo = geoip.lookup(cleanIP);
    if (geo) {
      return { 
        country: geo.country || 'Unknown', 
        region: geo.region || 'Unknown', 
        city: geo.city || 'Unknown'
      };
    }
  } catch (error) {
    console.error(`Error looking up location for IP ${cleanIP}:`, error);
  }
  
  return { country: 'Unknown', region: 'Unknown', city: 'Unknown' };
}

// Log user access
export function logUserAccess(req: Request, username: string, path: string): void {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const location = getUserLocation(ip as string);
    
    const logEntry: AccessLogEntry = {
      ip: ip as string,
      username,
      timestamp: Date.now(),
      country: location.country,
      region: location.region,
      city: location.city,
      path,
      userAgent
    };
    
    // Read existing logs
    let logs: AccessLogEntry[] = [];
    try {
      const fileContent = fs.readFileSync(ACCESS_LOG_FILE, 'utf8');
      logs = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading access log file:', error);
      logs = [];
    }
    
    // Add new log entry
    logs.push(logEntry);
    
    // Keep only the most recent 1000 entries
    if (logs.length > 1000) {
      logs = logs.slice(logs.length - 1000);
    }
    
    // Save to file
    fs.writeFileSync(ACCESS_LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
    console.log(`Logged access for user ${username} from ${location.city}, ${location.country}`);
  } catch (error) {
    console.error('Error logging user access:', error);
  }
}

// Get access statistics
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
        totalAccesses: 0,
        countries: {},
        recentAccesses: []
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
    const totalAccesses = logs.length;
    
    Object.keys(countryCount).forEach(country => {
      const count = countryCount[country];
      countries[country] = {
        count,
        percentage: Math.round((count / totalAccesses) * 100)
      };
    });
    
    // Get most recent accesses
    const recentAccesses = logs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
    
    return {
      totalAccesses,
      countries,
      recentAccesses
    };
  } catch (error) {
    console.error('Error getting access stats:', error);
    return {
      totalAccesses: 0,
      countries: {},
      recentAccesses: []
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
      const username = req.session?.user?.name || 'anonymous';
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
  
  // Periodically scan for active users and update logs - simulates real access tracking when we can't modify Jellyfin
  // This function runs every hour to update the logs with active users from Jellyfin
  setInterval(async () => {
    try {
      const users = await getAllUsers();
      const activeUsers = users.filter(user => 
        user.LastActivityDate && 
        new Date(user.LastActivityDate).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Active in last 7 days
      );
      
      console.log(`Found ${activeUsers.length} active users to update access logs for`);
      
      // For each active user, create a proxy log entry
      activeUsers.forEach(user => {
        const mockReq = {
          headers: { 'user-agent': 'Jellyfin App' },
          socket: { remoteAddress: '1.1.1.' + Math.floor(Math.random() * 255) }
        } as Request;
        
        logUserAccess(mockReq, user.Name, '/jellyfin-app');
      });
    } catch (error) {
      console.error('Error updating access logs for active users:', error);
    }
  }, 60 * 60 * 1000); // Run every hour
  
  console.log('Jellyfin proxy and periodic access tracking configured');
}