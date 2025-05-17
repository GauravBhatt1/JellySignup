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
 * Check if a username already exists in Jellyfin
 */
export async function checkUserExists(username: string): Promise<boolean> {
  try {
    // Get all users and check if username exists
    const response = await jellyfinApi.get("/Users");
    const users = response.data;
    
    return users.some((user: any) => 
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
    // First get the current policy
    const policyResponse = await jellyfinApi.get(`/Users/${userId}/Policy`);
    const policy = policyResponse.data;
    
    // Update policy to disable downloads
    policy.EnableContentDownloading = false;
    
    // Update user policy
    await jellyfinApi.post(`/Users/${userId}/Policy`, policy);
  } catch (error) {
    console.error("Error updating user policy:", error);
    throw new Error("Failed to update user policy");
  }
}
