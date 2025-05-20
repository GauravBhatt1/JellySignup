import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { getPreciseLocation } from './real-geolocation';
import fs from 'fs';
import path from 'path';

// Interface for activity log entries
interface ActivityEntry {
  username: string;
  ip: string;
  timestamp: number;
  activity: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  country?: string;
  deviceInfo?: string;
}

// File path to store activity data
const ACTIVITY_LOG_PATH = path.join(process.cwd(), 'jellyfin-user-activity.json');

// Initialize the activity log file if it doesn't exist
function initActivityLogFile(): void {
  if (!fs.existsSync(ACTIVITY_LOG_PATH)) {
    fs.writeFileSync(ACTIVITY_LOG_PATH, JSON.stringify([], null, 2), 'utf8');
    console.log('Created Jellyfin activity log file');
  }
}

// Get all user activity logs
export function getAllUserActivity(): ActivityEntry[] {
  try {
    initActivityLogFile();
    const fileContent = fs.readFileSync(ACTIVITY_LOG_PATH, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading activity log file:', error);
    return [];
  }
}

// Save activity logs
function saveActivityLogs(logs: ActivityEntry[]): void {
  try {
    fs.writeFileSync(ACTIVITY_LOG_PATH, JSON.stringify(logs, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving activity logs:', error);
  }
}

// Log user activity with precise location
export async function logUserActivity(
  username: string, 
  ip: string, 
  activity: string, 
  deviceInfo?: string
): Promise<void> {
  try {
    // Get precise location for the IP address
    const locationData = await getPreciseLocation(ip);
    
    // Create the activity log entry
    const activityEntry: ActivityEntry = {
      username,
      ip,
      timestamp: Date.now(),
      activity,
      deviceInfo
    };
    
    // Add location data if available
    if (locationData) {
      activityEntry.latitude = locationData.latitude;
      activityEntry.longitude = locationData.longitude;
      activityEntry.city = locationData.city;
      activityEntry.region = locationData.region;
      activityEntry.country = locationData.country;
      
      console.log(`Tracked user activity: ${username} (${activity}) from ${locationData.city}, ${locationData.country} [${locationData.latitude}, ${locationData.longitude}]`);
    } else {
      console.log(`Tracked user activity: ${username} (${activity}) from unknown location`);
    }
    
    // Get existing logs
    const logs = getAllUserActivity();
    
    // Add new entry
    logs.push(activityEntry);
    
    // Keep only the most recent 5000 entries
    const recentLogs = logs.length > 5000 ? logs.slice(logs.length - 5000) : logs;
    
    // Save updated logs
    saveActivityLogs(recentLogs);
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
}

// Fetch active sessions from Jellyfin and log them
export async function trackActiveSessions(): Promise<void> {
  try {
    const JELLYFIN_API_KEY = process.env.JELLYFIN_API_KEY;
    const JELLYFIN_SERVER_URL = process.env.JELLYFIN_SERVER_URL;
    
    if (!JELLYFIN_API_KEY || !JELLYFIN_SERVER_URL) {
      console.error('Missing Jellyfin API key or server URL');
      return;
    }
    
    // Fetch active sessions from Jellyfin API
    const response = await fetch(`${JELLYFIN_SERVER_URL}/Sessions`, {
      headers: {
        'X-Emby-Token': JELLYFIN_API_KEY
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch active sessions: ${response.status} ${response.statusText}`);
      return;
    }
    
    const sessions = await response.json() as any[];
    
    console.log(`Found ${sessions.length} active Jellyfin sessions`);
    
    // Process each session
    for (const session of sessions) {
      if (session.UserId && session.UserName && session.RemoteEndPoint) {
        const ip = session.RemoteEndPoint;
        const username = session.UserName;
        const deviceInfo = `${session.Client || 'Unknown'} on ${session.DeviceName || 'Unknown Device'}`;
        const activity = session.NowPlayingItem 
          ? `Watching: ${session.NowPlayingItem.Name}`
          : 'Browsing';
          
        // Log this activity with precise location
        await logUserActivity(username, ip, activity, deviceInfo);
      }
    }
  } catch (error) {
    console.error('Error tracking active sessions:', error);
  }
}

// Get activity statistics with precise location data for map visualization
export function getActivityStats() {
  try {
    const logs = getAllUserActivity();
    
    // Group by username
    const userActivities = logs.reduce((acc, log) => {
      if (!acc[log.username]) {
        acc[log.username] = [];
      }
      acc[log.username].push(log);
      return acc;
    }, {} as Record<string, ActivityEntry[]>);
    
    // Count activities by country
    const countryStats: Record<string, { count: number; percentage: number }> = {};
    let totalWithLocation = 0;
    
    logs.forEach(log => {
      if (log.country) {
        totalWithLocation++;
        if (!countryStats[log.country]) {
          countryStats[log.country] = { count: 0, percentage: 0 };
        }
        countryStats[log.country].count++;
      }
    });
    
    // Calculate percentages
    Object.keys(countryStats).forEach(country => {
      countryStats[country].percentage = Math.round((countryStats[country].count / totalWithLocation) * 100);
    });
    
    // Format location data for map visualization
    const geoData = logs
      .filter(log => log.latitude !== undefined && log.longitude !== undefined)
      .map(log => ({
        username: log.username,
        coordinates: [log.longitude as number, log.latitude as number] as [number, number],
        city: log.city || 'Unknown',
        country: log.country || 'Unknown',
        timestamp: log.timestamp,
        activity: log.activity
      }));
    
    // Get recent activities
    const recentActivities = [...logs]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
    
    return {
      totalActivities: logs.length,
      uniqueUsers: Object.keys(userActivities).length,
      countries: countryStats,
      geoData,
      recentActivities
    };
  } catch (error) {
    console.error('Error getting activity stats:', error);
    return {
      totalActivities: 0,
      uniqueUsers: 0,
      countries: {},
      geoData: [],
      recentActivities: []
    };
  }
}