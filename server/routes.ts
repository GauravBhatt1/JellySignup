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
    skip: (req) => process.env.NODE_ENV === 'development',
    // For Docker/Portainer deployment
    trustProxy: true
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
        // Try to update user policy to disable downloads
        // This is optional and will not break the flow if it fails
        await updateUserPolicy(user.Id);
      } catch (policyError) {
        console.log("Policy update failed but continuing with user creation");
        // We don't throw the error here to allow user creation to succeed
      }
      
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
    skip: (req) => process.env.NODE_ENV === 'development',
    // For Docker/Portainer deployment
    trustProxy: true
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
      const users = await getAllUsers();
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Internal server error" 
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

  const httpServer = createServer(app);
  return httpServer;
}
