import axios from "axios";
import { JellyfinUser } from "@shared/schema";

// Get Jellyfin configuration from environment variables
const JELLYFIN_SERVER_URL = process.env.JELLYFIN_SERVER_URL || "http://localhost:8096";
const JELLYFIN_API_KEY = process.env.JELLYFIN_API_KEY || "";

// Create axios instance for Jellyfin API
const jellyfinApi = axios.create({
  baseURL: JELLYFIN_SERVER_URL,
  headers: {
    "X-Emby-Token": JELLYFIN_API_KEY,
    "Content-Type": "application/json",
  },
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
    // First, check if user exists
    const exists = await checkUserExists(username);
    if (!exists) {
      return false;
    }

    const JELLYFIN_SERVER_URL = process.env.JELLYFIN_SERVER_URL || "";
    
    // Authenticate and check admin status
    const response = await axios.post(`${JELLYFIN_SERVER_URL}/Users/AuthenticateByName`, {
      Username: username,
      Pw: password
    }, {
      headers: {
        'X-Emby-Authorization': `MediaBrowser Client="Jellyfin Web", Device="Admin Login", DeviceId="admin", Version="10.8.0"`,
        'Content-Type': 'application/json'
      }
    });

    // Check if user has admin rights
    if (response.status === 200 && response.data && response.data.User && response.data.User.Policy) {
      return response.data.User.Policy.IsAdministrator === true;
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
    const response = await jellyfinApi.get("/Users");
    return response.data;
  } catch (error) {
    console.error("Error fetching Jellyfin users:", error);
    throw new Error("Failed to fetch users from Jellyfin");
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
