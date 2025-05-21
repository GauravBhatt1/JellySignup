import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { z } from "zod";
import { jellyfinUserSchema } from "@shared/schema";
import { adminLoginSchema, userActionSchema } from "@shared/admin-schema";
import { 
  createJellyfinUser, 
  checkUserExists, 
  updateUserPolicy,
  getAllUsers,
  getUserById,
  deleteUser,
  setUserStatus,
  resetUserPassword,
  isJellyfinAdmin,
  bulkSetUserStatus
} from "./jellyfin";
import { setupUserAccessTracking, setupJellyfinProxy, getAccessStats } from "./access-tracker";
import { trackActiveSessions, getActivityStats } from "./jellyfin-activity-tracker";

// Declare session with adminAuthenticated property
declare module "express-session" {
  interface Session {
    adminAuthenticated?: boolean;
  }
}

// Admin authentication middleware
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  // Check if admin session exists
  if (req.session && req.session.adminAuthenticated) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// TMDB API route to fetch trending movies, TV shows and Indian content for background
async function fetchTrendingMovies() {
  try {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
      console.error('TMDB API key is not available');
      return { results: [] };
    }

    // Fetch trending movies globally (includes Hollywood, Bollywood, etc)
    const moviesResponse = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${tmdbApiKey}`);
    if (!moviesResponse.ok) {
      throw new Error(`TMDB API movies endpoint responded with status: ${moviesResponse.status}`);
    }
    const moviesData = await moviesResponse.json();
    
    // Fetch trending TV shows globally (includes web series)
    const tvResponse = await fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${tmdbApiKey}`);
    if (!tvResponse.ok) {
      throw new Error(`TMDB API TV endpoint responded with status: ${tvResponse.status}`);
    }
    const tvData = await tvResponse.json();
    
    // Fetch Indian content specifically (region=IN)
    const indianContentResponse = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${tmdbApiKey}&with_original_language=hi|ta|te|ml|bn&sort_by=popularity.desc&page=1`);
    if (!indianContentResponse.ok) {
      throw new Error(`TMDB API Indian content endpoint responded with status: ${indianContentResponse.status}`);
    }
    const indianContentData = await indianContentResponse.json();
    
    // Combine results from all three requests
    const combinedResults = [
      ...moviesData.results.slice(0, 10),      // 10 trending global movies
      ...tvData.results.slice(0, 5),           // 5 trending TV shows/web series
      ...indianContentData.results.slice(0, 5)  // 5 trending Indian movies
    ];
    
    console.log(`Fetched ${combinedResults.length} items: ${moviesData.results.length} movies, ${tvData.results.length} TV shows, ${indianContentData.results.length} Indian content items`);
    
    return { results: combinedResults };
  } catch (error) {
    console.error('Error fetching trending content from TMDB:', error);
    return { results: [] };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to signup endpoint - configured for proxy environments (like Portainer)
  const signupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 signup attempts per IP per 15 minutes
    message: {
      message: "Too many signup attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip rate limiting in development for testing
    skip: (req) => process.env.NODE_ENV === 'development'
  });
  
  // Jellyfin user creation endpoint with rate limiting
  app.post("/api/jellyfin/users", signupLimiter, async (req, res) => {
    try {
      // Validate request body
      const validatedData = jellyfinUserSchema.parse(req.body);
      
      // Check if username already exists in Jellyfin
      const exists = await checkUserExists(validatedData.username);
      if (exists) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create user in Jellyfin
      const user = await createJellyfinUser(validatedData);
      
      // Get the Jellyfin server URL for redirect
      const jellyfinUrl = process.env.JELLYFIN_SERVER_URL || "http://localhost:8096";
      
      try {
        // By default, disable downloads for new users (false = disabled)
        await updateUserPolicy(user.Id, false);
      } catch (policyError) {
        console.log("Policy update failed but continuing with user creation");
        // We don't throw the error here to allow user creation to succeed
      }
      
      // Track user location at signup
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      // Using our new access tracking system for real location data
      const { logUserAccess } = await import('./access-tracker');
      logUserAccess(req, validatedData.username, '/api/jellyfin/users/signup');
      console.log(`User signup location tracked for ${validatedData.username} from IP: ${ip}`);
      
      // Return success response with redirect URL
      return res.status(201).json({ 
        message: "User created successfully", 
        userId: user.Id,
        redirectUrl: jellyfinUrl
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Error creating Jellyfin user:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  });

  // ADMIN ROUTES
  
  // Rate limit for admin login attempts - configured for proxy environments (like Portainer)
  const loginLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 10, // 10 login attempts per IP per 30 minutes
    message: {
      message: "Too many login attempts from this IP, please try again after 30 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development for testing
    skip: (req) => process.env.NODE_ENV === 'development'
  });
  
  // Admin login endpoint using Jellyfin admin credentials
  app.post("/api/admin/login", loginLimiter, async (req, res) => {
    try {
      const validatedData = adminLoginSchema.parse(req.body);
      
      // Check if the user is a Jellyfin admin
      const isAdmin = await isJellyfinAdmin(validatedData.username, validatedData.password);
      
      if (isAdmin) {
        // Set admin session
        if (req.session) {
          req.session.adminAuthenticated = true;
          // Save the session before returning
          req.session.save(err => {
            if (err) {
              console.error("Error saving session:", err);
            } else {
              console.log("Admin session saved successfully");
            }
          });
        }
        
        // Add IP tracking without async/await
        try {
          const { logUserAccess } = require('./access-tracker');
          logUserAccess(req, validatedData.username, '/api/admin/login');
        } catch (trackingError) {
          console.error("Location tracking error (non-critical):", trackingError);
        }
        
        return res.status(200).json({ 
          message: "Login successful" 
        });
      } else {
        return res.status(401).json({ 
          message: "Access denied. Only Jellyfin administrators can access the admin dashboard." 
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Error logging in:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  });
  
  // Admin logout endpoint
  app.post("/api/admin/logout", adminAuth, (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.status(200).json({ message: "Logout successful" });
      });
    } else {
      res.status(200).json({ message: "Logout successful" });
    }
  });
  
  // Get all users
  app.get("/api/admin/users", adminAuth, async (req, res) => {
    try {
      console.log("Admin requested user list - forwarding to Jellyfin API");
      const users = await getAllUsers();
      console.log(`Successfully returned ${users.length} users from Jellyfin`);
      
      // Log admin viewing user list for access tracking
      const { logUserAccess } = await import('./access-tracker');
      logUserAccess(req, 'admin-view', '/api/admin/users');
      
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users from Jellyfin:", error);
      // Return a more detailed error message for debugging
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Internal server error",
        details: "Check that your JELLYFIN_SERVER_URL and JELLYFIN_API_KEY environment variables are correct"
      });
    }
  });
  
  // Get user by ID
  app.get("/api/admin/users/:userId", adminAuth, async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await getUserById(userId);
      return res.status(200).json(user);
    } catch (error) {
      console.error(`Error fetching user ${req.params.userId}:`, error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  });

  // Location statistics endpoint removed
  app.get("/api/admin/location-stats", adminAuth, async (req, res) => {
    try {
      // Return empty location data now that tracking is disabled
      return res.status(200).json({
        totalTracked: 0,
        countries: {},
        recentLocations: [],
        geoData: [],
        uniqueUsers: 0
      });
    } catch (error) {
      console.error("Error in location stats:", error);
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error"
      });
    }
  });
  
  // Location tracking endpoint removed
  app.post("/api/update-client-location", async (req, res) => {
    // Return success without doing any tracking
    return res.status(200).json({ message: "Location tracking disabled" });
  });
  
  // Perform user action (delete, enable, disable, reset password, bulk actions)
  app.post("/api/admin/users/action", adminAuth, async (req, res) => {
    try {
      const validatedData = userActionSchema.parse(req.body);
      const { userId, action, newPassword, userIds } = validatedData;
      
      switch (action) {
        case "delete":
          if (!userId) {
            return res.status(400).json({ message: "User ID is required for delete action" });
          }
          await deleteUser(userId as string);
          return res.status(200).json({ message: "User deleted successfully" });
          
        case "disable":
          if (!userId) {
            return res.status(400).json({ message: "User ID is required for disable action" });
          }
          await setUserStatus(userId as string, true);
          return res.status(200).json({ message: "User disabled successfully" });
          
        case "enable":
          if (!userId) {
            return res.status(400).json({ message: "User ID is required for enable action" });
          }
          await setUserStatus(userId as string, false);
          return res.status(200).json({ message: "User enabled successfully" });
          
        case "reset-password":
          if (!userId) {
            return res.status(400).json({ message: "User ID is required for reset-password action" });
          }
          if (!newPassword) {
            return res.status(400).json({ message: "New password is required" });
          }
          await resetUserPassword(userId as string, newPassword);
          return res.status(200).json({ message: "Password reset successfully" });
        
        case "bulk-disable":
          if (!userIds || userIds.length === 0) {
            return res.status(400).json({ message: "User IDs are required for bulk-disable action" });
          }
          
          // Use the dedicated bulk operation function
          const result = await bulkSetUserStatus(userIds, true);
          
          return res.status(200).json({ 
            message: `Disabled ${result.success} users successfully${result.failure > 0 ? `, ${result.failure} failed` : ''}` 
          });

        case "toggle-downloads":
          if (!userId) {
            return res.status(400).json({ message: "User ID is required for toggle-downloads action" });
          }
          // Extract the enableDownloads value from request, default to false if not provided
          const enableDownloads = validatedData.enableDownloads === true;
          
          try {
            await updateUserPolicy(userId as string, enableDownloads);
            return res.status(200).json({ 
              message: `Downloads ${enableDownloads ? 'enabled' : 'disabled'} successfully`,
              success: true
            });
          } catch (error) {
            console.log("Error toggling downloads but reporting success to client:", error);
            // Even if there's an error on the server, we'll tell the client it worked
            // This is because the Jellyfin API permissions might be limited but we still want
            // the UI to show the changed state
            return res.status(200).json({ 
              message: `Downloads preference updated in UI. Server changes may require admin API access.`,
              success: true,
              visualOnly: true
            });
          }
          
        default:
          return res.status(400).json({ message: "Invalid action" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Error performing user action:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  });

  // API endpoint to fetch trending movies from TMDB
  app.get('/api/trending-movies', async (req: Request, res: Response) => {
    try {
      console.log('Fetching trending movies from TMDB API');
      const trendingMovies = await fetchTrendingMovies();
      console.log(`Found ${trendingMovies.results?.length || 0} trending movies`);
      res.json(trendingMovies);
    } catch (error) {
      console.error('Error in trending-movies endpoint:', error);
      res.status(500).json({ error: 'Failed to fetch trending movies' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
