import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { jellyfinUserSchema } from "@shared/schema";
import { createJellyfinUser, checkUserExists, updateUserPolicy } from "./jellyfin";

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

  const httpServer = createServer(app);
  return httpServer;
}
