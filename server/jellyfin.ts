import axios from "axios";
import { JellyfinUser } from "@shared/schema";

// Get Jellyfin configuration from environment variables
const JELLYFIN_SERVER_URL = process.env.JELLYFIN_SERVER_URL || "http://localhost:8096";
const JELLYFIN_API_KEY = process.env.JELLYFIN_API_KEY || "";

// Ensure the server URL doesn't end with a trailing slash
const normalizedServerUrl = JELLYFIN_SERVER_URL.endsWith('/') 
  ? JELLYFIN_SERVER_URL.slice(0, -1)
  : JELLYFIN_SERVER_URL;

// Log Jellyfin configuration (without exposing full API key)
console.log(`Jellyfin API Configuration: 
  Server URL: ${normalizedServerUrl}
  API Key Set: ${JELLYFIN_API_KEY ? "Yes" : "No"}`
);

// Create axios instance for Jellyfin API with timeout and better error handling
const jellyfinApi = axios.create({
  baseURL: normalizedServerUrl,
  headers: {
    "X-Emby-Token": JELLYFIN_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

/**
 * Interface for Jellyfin users from API
 */
export interface JellyfinApiUser {
  Id: string;
  Name: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
  Policy: {
    IsAdministrator: boolean;
    IsDisabled: boolean;
    EnableContentDownloading?: boolean;
    [key: string]: any;
  };
  LastLoginDate?: string;
  LastActivityDate?: string;
  [key: string]: any;
}

/**
 * Check if a user is admin in Jellyfin
 */
export async function isJellyfinAdmin(username: string, password: string): Promise<boolean> {
  try {
    console.log(`Checking admin status for user: ${username}`);
    
    // First try to get the users from Jellyfin to verify API connection
    try {
      console.log(`Testing API connection with normalized URL: ${normalizedServerUrl}`);
      const paths = ['/Users', '/jellyfin/Users', '/emby/Users'];
      let usersFound = false;
      
      for (const path of paths) {
        try {
          console.log(`Trying to get users from: ${normalizedServerUrl}${path}`);
          const userResponse = await axios.get(`${normalizedServerUrl}${path}`, {
            headers: {
              'X-Emby-Token': JELLYFIN_API_KEY,
              'Content-Type': 'application/json'
            }
          });
          
          if (userResponse.status === 200) {
            console.log(`Successfully found ${userResponse.data.length} users at path: ${path}`);
            usersFound = true;
            
            // If we can get users, let's try the authentication with the same base path
            const basePath = path.replace('/Users', '');
            const authUrl = `${normalizedServerUrl}${basePath}/Users/AuthenticateByName`;
            
            console.log(`Attempting authentication at: ${authUrl}`);
            const authResponse = await axios.post(authUrl, {
              Username: username,
              Pw: password
            }, {
              headers: {
                'X-Emby-Authorization': `MediaBrowser Client="Jellyfin Web", Device="Admin Login", DeviceId="admin", Version="10.8.0"`,
                'Content-Type': 'application/json'
              }
            });
            
            // Check if user has admin rights
            if (authResponse.status === 200 && authResponse.data?.User?.Policy?.IsAdministrator) {
              console.log('User is confirmed as administrator');
              return true;
            } else {
              console.log('User is not an administrator');
              return false;
            }
          }
        } catch (pathError) {
          console.log(`Path ${path} failed: ${pathError.message}`);
        }
      }
      
      if (!usersFound) {
        console.error('Could not access users through any standard API paths');
        return false;
      }
    } catch (apiError) {
      console.error('API connection test failed:', apiError.message);
    }
    
    // Fallback to standard authentication if path tests didn't succeed
    try {
      console.log(`Falling back to standard authentication at: ${normalizedServerUrl}/Users/AuthenticateByName`);
      const response = await axios.post(`${normalizedServerUrl}/Users/AuthenticateByName`, {
        Username: username,
        Pw: password
      }, {
        headers: {
          'X-Emby-Authorization': `MediaBrowser Client="Jellyfin Web", Device="Admin Login", DeviceId="admin", Version="10.8.0"`,
          'Content-Type': 'application/json'
        }
      });
  
      // Check if user has admin rights
      if (response.status === 200 && response.data?.User?.Policy?.IsAdministrator) {
        console.log('User is confirmed as administrator (fallback)');
        return true;
      }
    } catch (authError) {
      console.error('Authentication failed:', authError.message);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if a username already exists in Jellyfin
 */
export async function checkUserExists(username: string): Promise<boolean> {
  try {
    // Get all users and check if username exists
    const response = await jellyfinApi.get("/Users");
    const users = response.data;
    
    return users.some((user: JellyfinApiUser) => 
      user.Name.toLowerCase() === username.toLowerCase()
    );
  } catch (error) {
    console.error("Error checking if user exists:", error);
    throw new Error("Failed to check if username exists");
  }
}

/**
 * Create a new user in Jellyfin
 */
export async function createJellyfinUser(userData: JellyfinUser): Promise<any> {
  try {
    const response = await jellyfinApi.post("/Users/New", {
      Name: userData.username,
      Password: userData.password,
    });
    
    return response.data;
  } catch (error) {
    console.error("Error creating Jellyfin user:", error);
    throw new Error("Failed to create user in Jellyfin");
  }
}

/**
 * Update user policy to disable downloads
 */
export async function updateUserPolicy(userId: string): Promise<void> {
  try {
    // For some Jellyfin instances, we need to use a different approach
    // The API structure might be different or require specific permissions
    
    // Let's make a simpler policy update directly
    const policy = {
      EnableContentDownloading: false,
      // Include only the essential fields to avoid conflicts
      IsAdministrator: false,
      EnableRemoteControlOfOtherUsers: false
    };
    
    // Post the simplified policy
    await jellyfinApi.post(`/Users/${userId}/Policy`, policy);
    console.log("Successfully updated user policy");
  } catch (error) {
    console.error("Error updating user policy:", error);
    // Don't throw an error, as this might be an optional step
    console.log("Continuing without policy update");
  }
}

/**
 * Get all Jellyfin users
 */
export async function getAllUsers(): Promise<JellyfinApiUser[]> {
  try {
    // Try different API paths that might be used by Jellyfin
    const possiblePaths = ['/Users', '/jellyfin/Users', '/emby/Users'];
    let lastError = null;
    
    // Try each path until one works
    for (const path of possiblePaths) {
      try {
        console.log(`Attempting to connect to Jellyfin at: ${normalizedServerUrl}${path}`);
        const response = await jellyfinApi.get(path);
        console.log(`Successfully fetched ${response.data.length} users from Jellyfin using path: ${path}`);
        return response.data;
      } catch (pathError: any) {
        console.log(`Path ${path} failed with: ${pathError.message}`);
        lastError = pathError;
        // Continue trying next path
      }
    }
    
    // If we get here, all paths failed
    throw lastError;
  } catch (error: any) {
    // Try alternative system endpoints to determine the correct API base path
    console.log("Testing Jellyfin API connection with alternative system endpoints...");
    const systemPaths = ['/System/Info', '/jellyfin/System/Info', '/emby/System/Info', '/api/jellyfin/System/Info'];
    let systemEndpointFound = false;
    
    for (const sysPath of systemPaths) {
      try {
        const sysResponse = await jellyfinApi.get(sysPath);
        console.log(`Successfully connected to system info at: ${sysPath}`);
        console.log(`Server name: ${sysResponse.data?.ServerName || 'Not available'}`);
        console.log(`Version: ${sysResponse.data?.Version || 'Not available'}`);
        systemEndpointFound = true;
        break;
      } catch (sysError: any) {
        console.log(`System path ${sysPath} failed with: ${sysError.message}`);
      }
    }
    
    if (!systemEndpointFound) {
      console.error("Could not access Jellyfin API system info through any standard paths.");
    }
    
    // More detailed error logging
    console.error("Error fetching Jellyfin users:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: `${normalizedServerUrl}/Users`,
      details: error.response?.data
    });
    
    // Provide more context in the error message for debugging
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Check your JELLYFIN_API_KEY.");
    } else if (error.response?.status === 404) {
      throw new Error(`Jellyfin API endpoint not found at ${normalizedServerUrl}/Users. Check your JELLYFIN_SERVER_URL - it should be the base URL of your Jellyfin server (e.g., http://your-server:8096).`);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Cannot connect to Jellyfin server at ${normalizedServerUrl}. Please check the server is running and accessible.`);
    }
    
    throw new Error(`Failed to fetch users from Jellyfin: ${error.message}`);
  }
}

/**
 * Get a specific user by ID
 */
export async function getUserById(userId: string): Promise<JellyfinApiUser> {
  try {
    const response = await jellyfinApi.get(`/Users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw new Error("Failed to fetch user details");
  }
}

/**
 * Delete a user from Jellyfin
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    await jellyfinApi.delete(`/Users/${userId}`);
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw new Error("Failed to delete user");
  }
}

/**
 * Enable or disable a user
 */
export async function setUserStatus(userId: string, isDisabled: boolean): Promise<void> {
  try {
    // First get the current policy
    const userResponse = await jellyfinApi.get(`/Users/${userId}`);
    const user = userResponse.data;
    
    // Get user policy if it exists
    let policy = user.Policy || {};
    
    // Update the policy
    policy.IsDisabled = isDisabled;
    
    // Update user policy
    await jellyfinApi.post(`/Users/${userId}/Policy`, policy);
  } catch (error) {
    console.error(`Error ${isDisabled ? 'disabling' : 'enabling'} user ${userId}:`, error);
    throw new Error(`Failed to ${isDisabled ? 'disable' : 'enable'} user`);
  }
}

/**
 * Bulk enable or disable multiple users at once
 */
export async function bulkSetUserStatus(userIds: string[], isDisabled: boolean): Promise<{success: number, failure: number}> {
  let success = 0;
  let failure = 0;
  
  // Process each user ID
  for (const userId of userIds) {
    try {
      await setUserStatus(userId, isDisabled);
      success++;
    } catch (error) {
      console.error(`Error during bulk ${isDisabled ? 'disable' : 'enable'} for user ${userId}:`, error);
      failure++;
    }
  }
  
  return { success, failure };
}

/**
 * Reset a user's password
 */
export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  try {
    await jellyfinApi.post(`/Users/${userId}/Password`, {
      NewPw: newPassword
    });
  } catch (error) {
    console.error(`Error resetting password for user ${userId}:`, error);
    throw new Error("Failed to reset password");
  }
}
