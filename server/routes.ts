import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
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
  resetUserPassword
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
  // Jellyfin user creation endpoint
  app.post("/api/jellyfin/users", async (req, res) => {
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
  
  // Admin login endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const validatedData = adminLoginSchema.parse(req.body);
      
      // Check admin credentials against environment variables
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin";
      
      if (validatedData.username === adminUsername && validatedData.password === adminPassword) {
        // Set admin session
        if (req.session) {
          req.session.adminAuthenticated = true;
        }
        
        return res.status(200).json({ 
          message: "Login successful" 
        });
      } else {
        return res.status(401).json({ 
          message: "Invalid credentials" 
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
  
  // Perform user action (delete, enable, disable, reset password)
  app.post("/api/admin/users/action", adminAuth, async (req, res) => {
    try {
      const validatedData = userActionSchema.parse(req.body);
      const { userId, action, newPassword } = validatedData;
      
      switch (action) {
        case "delete":
          await deleteUser(userId);
          return res.status(200).json({ message: "User deleted successfully" });
          
        case "disable":
          await setUserStatus(userId, true);
          return res.status(200).json({ message: "User disabled successfully" });
          
        case "enable":
          await setUserStatus(userId, false);
          return res.status(200).json({ message: "User enabled successfully" });
          
        case "reset-password":
          if (!newPassword) {
            return res.status(400).json({ message: "New password is required" });
          }
          await resetUserPassword(userId, newPassword);
          return res.status(200).json({ message: "Password reset successfully" });
          
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
