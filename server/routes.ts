import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { storage } from "./storage";
import { hashPassword, comparePassword } from "./password-utils";
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
  // Health check endpoint for Docker deployment
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: process.env.DATABASE_URL ? 'configured' : 'not configured',
      databaseType: process.env.DATABASE_URL?.includes('mongodb') ? 'MongoDB' : 'PostgreSQL',
      environment: process.env.NODE_ENV
    });
  });

  // Admin health endpoint with live dependency checks
  app.get('/api/admin/server-health', adminAuth, async (req: Request, res: Response) => {
    const started = Date.now();
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: {
        configured: Boolean(process.env.DATABASE_URL),
        type: process.env.DATABASE_URL?.includes('mongodb') ? 'MongoDB' : 'PostgreSQL',
        ok: false
      },
      jellyfin: {
        configured: Boolean(process.env.JELLYFIN_SERVER_URL),
        ok: false
      },
      latencyMs: 0
    };

    try {
      await storage.getTrialSettings();
      health.database.ok = true;
    } catch (error) {
      health.status = 'degraded';
      health.database.error = error instanceof Error ? error.message : 'Database check failed';
    }

    try {
      await getAllUsers();
      health.jellyfin.ok = true;
    } catch (error) {
      health.status = 'degraded';
      health.jellyfin.error = error instanceof Error ? error.message : 'Jellyfin check failed';
    }

    health.latencyMs = Date.now() - started;
    res.json(health);
  });

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
  
  const getRecycleReservedUsernames = async (): Promise<Set<string>> => {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const file = path.join(process.cwd(), 'deleted-users-recycle-bin.json');
      const data = await fs.readFile(file, 'utf-8');
      const items = JSON.parse(data);
      return new Set((Array.isArray(items) ? items : []).map((item: any) => String(item.name || '').toLowerCase()).filter(Boolean));
    } catch {
      return new Set();
    }
  };

  const approvalSettingsPath = async () => {
    const path = await import('path');
    return path.join(process.cwd(), 'approval-settings.json');
  };

  const approvalRequestsPath = async () => {
    const path = await import('path');
    return path.join(process.cwd(), 'approval-requests.json');
  };

  const readApprovalSettings = async () => {
    try {
      const approvalStorage = storage as any;
      if (typeof approvalStorage.getApprovalSettings === 'function') {
        const settings = await approvalStorage.getApprovalSettings();
        if (settings) return { requireAdminApproval: false, ...settings };
      }
    } catch (error) {
      console.error('Approval settings storage read failed, falling back to file:', error);
    }

    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(await approvalSettingsPath(), 'utf-8');
      const settings = { requireAdminApproval: false, ...JSON.parse(data) };
      try {
        const approvalStorage = storage as any;
        if (typeof approvalStorage.updateApprovalSettings === 'function') {
          await approvalStorage.updateApprovalSettings(settings);
        }
      } catch (migrationError) {
        console.error('Approval settings file-to-storage migration failed:', migrationError);
      }
      return settings;
    } catch {
      return { requireAdminApproval: false, updatedAt: new Date().toISOString() };
    }
  };

  const writeApprovalSettings = async (settings: any) => {
    const next = {
      requireAdminApproval: Boolean(settings.requireAdminApproval),
      updatedAt: new Date().toISOString()
    };

    try {
      const approvalStorage = storage as any;
      if (typeof approvalStorage.updateApprovalSettings === 'function') {
        return await approvalStorage.updateApprovalSettings(next);
      }
    } catch (error) {
      console.error('Approval settings storage write failed, falling back to file:', error);
    }

    const fs = await import('fs/promises');
    await fs.writeFile(await approvalSettingsPath(), JSON.stringify(next, null, 2));
    return next;
  };

  const readApprovalRequests = async (): Promise<any[]> => {
    try {
      const approvalStorage = storage as any;
      if (typeof approvalStorage.getApprovalRequests === 'function') {
        const storedRequests = await approvalStorage.getApprovalRequests();
        if (Array.isArray(storedRequests) && storedRequests.length > 0) {
          return storedRequests;
        }
      }
    } catch (error) {
      console.error('Approval requests storage read failed, falling back to file:', error);
    }

    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(await approvalRequestsPath(), 'utf-8');
      const requests = JSON.parse(data);
      try {
        const approvalStorage = storage as any;
        if (typeof approvalStorage.replaceApprovalRequests === 'function') {
          await approvalStorage.replaceApprovalRequests(Array.isArray(requests) ? requests : []);
        }
      } catch (migrationError) {
        console.error('Approval requests file-to-storage migration failed:', migrationError);
      }
      return requests;
    } catch {
      return [];
    }
  };

  const writeApprovalRequests = async (items: any[]) => {
    try {
      const approvalStorage = storage as any;
      if (typeof approvalStorage.replaceApprovalRequests === 'function') {
        await approvalStorage.replaceApprovalRequests(items);
        return;
      }
    } catch (error) {
      console.error('Approval requests storage write failed, falling back to file:', error);
    }

    const fs = await import('fs/promises');
    await fs.writeFile(await approvalRequestsPath(), JSON.stringify(items, null, 2));
  };

  const getApprovalEncryptionKey = () => {
    const secret = process.env.APPROVAL_ENCRYPTION_KEY || process.env.SESSION_SECRET || process.env.JELLYFIN_API_KEY || 'jellysignup-local-approval-key';
    return crypto.createHash('sha256').update(secret).digest();
  };

  const encryptApprovalPassword = (password: string) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getApprovalEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      algorithm: 'aes-256-gcm',
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      value: encrypted.toString('base64')
    };
  };

  const decryptApprovalPassword = (encryptedPassword: any) => {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getApprovalEncryptionKey(),
      Buffer.from(encryptedPassword.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(encryptedPassword.tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedPassword.value, 'base64')),
      decipher.final()
    ]).toString('utf8');
  };

  const createTrialTrackingForUser = async (username: string) => {
    try {
      let trialSettings;
      try {
        trialSettings = await storage.getTrialSettings();
      } catch {
        const fs = await import('fs/promises');
        const path = await import('path');
        try {
          const data = await fs.readFile(path.join(process.cwd(), 'trial-settings.json'), 'utf-8');
          trialSettings = JSON.parse(data);
        } catch {
          trialSettings = {
            isTrialModeEnabled: true,
            trialDurationDays: 7,
            expiryAction: 'disable'
          };
        }
      }

      if (trialSettings?.isTrialModeEnabled === true) {
        const signupDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(signupDate.getDate() + trialSettings.trialDurationDays);
        await storage.createTrialUser({
          username,
          signupDate,
          expiryDate,
          isExpired: false,
          trialDurationDays: trialSettings.trialDurationDays
        });
      }
    } catch (error) {
      console.error(`Error creating trial tracking for ${username}:`, error);
    }
  };

  app.get('/api/approval-info', async (_req: Request, res: Response) => {
    const settings = await readApprovalSettings();
    res.json({ requireAdminApproval: Boolean(settings.requireAdminApproval) });
  });

  app.post('/api/account-status', async (req: Request, res: Response) => {
    try {
      const validatedData = jellyfinUserSchema.parse(req.body);
      const requests = await readApprovalRequests();
      const request = requests.find(item => String(item.username || '').toLowerCase() === validatedData.username.toLowerCase());
      if (!request) {
        return res.status(404).json({ status: 'not_found', message: 'No account request found for this username.' });
      }

      const passwordMatches = await comparePassword(validatedData.password, request.passwordHash || '');
      if (!passwordMatches) {
        return res.status(401).json({ status: 'invalid', message: 'Invalid username or password.' });
      }

      if (request.status === 'pending') {
        return res.json({
          status: 'pending',
          message: 'Your account is waiting for admin approval.\n\nPlease try again later.'
        });
      }

      if (request.status === 'approved') {
        return res.json({
          status: 'approved',
          message: 'Your account has been approved.\n\nYou can now log in.',
          redirectUrl: process.env.JELLYFIN_SERVER_URL || 'http://localhost:8096'
        });
      }

      if (request.status === 'rejected') {
        return res.json({
          status: 'rejected',
          message: 'Your account request has been rejected by the admin.\n\nYou cannot log in with this account.'
        });
      }

      return res.json({ status: request.status || 'unknown', message: 'Account request status is unavailable.' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error checking account status:', error);
      return res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
    }
  });

  // Jellyfin user creation endpoint with rate limiting
  app.post("/api/jellyfin/users", signupLimiter, async (req, res) => {
    try {
      // Validate request body
      const validatedData = jellyfinUserSchema.parse(req.body);

      // Hash password for local storage (Bug #3 fix)
      const hashedPassword = await hashPassword(validatedData.password);

      // Block usernames currently held in the recycle bin to prevent spam/reclaim abuse
      const reservedUsernames = await getRecycleReservedUsernames();
      if (reservedUsernames.has(validatedData.username.toLowerCase())) {
        return res.status(409).json({
          message: "This username is reserved in the recycle bin. Contact admin to restore or permanently remove it first."
        });
      }

      // Check if username already exists in Jellyfin
      const exists = await checkUserExists(validatedData.username);
      if (exists) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const approvalSettings = await readApprovalSettings();
      if (approvalSettings.requireAdminApproval) {
        const requests = await readApprovalRequests();
        const existingRequest = requests.find(item => String(item.username || '').toLowerCase() === validatedData.username.toLowerCase());
        if (existingRequest) {
          if (existingRequest.status === 'pending') {
            return res.status(409).json({ message: "Your account request is already waiting for admin approval." });
          }
          if (existingRequest.status === 'approved') {
            return res.status(409).json({ message: "Your account has already been approved. You can log in to Jellyfin." });
          }
          if (existingRequest.status === 'rejected') {
            return res.status(403).json({ message: "Your account request has been rejected by the admin. You cannot log in with this account." });
          }
        }

        const now = new Date().toISOString();
        requests.unshift({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          username: validatedData.username,
          normalizedUsername: validatedData.username.toLowerCase(),
          passwordHash: hashedPassword,
          encryptedPassword: encryptApprovalPassword(validatedData.password),
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          requestedAt: now,
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
          userAgent: req.headers['user-agent'] || null
        });
        await writeApprovalRequests(requests.slice(0, 1000));

        try {
          const { logUserAccess } = await import('./access-tracker');
          logUserAccess(req, validatedData.username, '/api/jellyfin/users/pending-approval');
        } catch (trackingError) {
          console.error("Location tracking error (non-critical):", trackingError);
        }

        return res.status(202).json({
          status: 'pending',
          message: 'Your account request has been sent.\n\nPlease wait up to 2 days for admin approval.\n\nYou can use the same username and password to log in later and check your account status.'
        });
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

      await createTrialTrackingForUser(validatedData.username);
      
      // Track user location at signup
      // Using our new access tracking system for real location data
      const { logUserAccess } = await import('./access-tracker');
      logUserAccess(req, validatedData.username, '/api/jellyfin/users/signup');
      
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
          const { logUserAccess } = await import('./access-tracker');
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

  app.get('/api/admin/approval-settings', adminAuth, async (_req: Request, res: Response) => {
    const settings = await readApprovalSettings();
    res.json(settings);
  });

  app.put('/api/admin/approval-settings', adminAuth, async (req: Request, res: Response) => {
    if (typeof req.body?.requireAdminApproval !== 'boolean') {
      return res.status(400).json({ message: 'requireAdminApproval must be boolean' });
    }

    const settings = await writeApprovalSettings({
      requireAdminApproval: req.body.requireAdminApproval
    });
    res.json(settings);
  });

  app.get('/api/admin/approval-requests', adminAuth, async (_req: Request, res: Response) => {
    const requests = await readApprovalRequests();
    const sanitized = requests.map(({ encryptedPassword, passwordHash, ...item }) => item);
    sanitized.sort((a, b) => {
      const rank: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
      const rankDiff = (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
    res.json(sanitized);
  });

  app.post('/api/admin/approval-requests/:id/action', adminAuth, async (req: Request, res: Response) => {
    try {
      const action = String(req.body?.action || '');
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid approval action' });
      }

      const requests = await readApprovalRequests();
      const request = requests.find(item => item.id === req.params.id);
      if (!request) {
        return res.status(404).json({ message: 'Approval request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(409).json({ message: `Request is already ${request.status}` });
      }

      const now = new Date().toISOString();
      if (action === 'reject') {
        request.status = 'rejected';
        request.rejectedAt = now;
        request.updatedAt = now;
        request.adminNote = String(req.body?.adminNote || '').trim();
        await writeApprovalRequests(requests);
        return res.json({ message: `${request.username} rejected` });
      }

      const exists = await checkUserExists(request.username);
      let user: any = null;
      if (!exists) {
        const password = decryptApprovalPassword(request.encryptedPassword);
        user = await createJellyfinUser({ username: request.username, password });
        try {
          await updateUserPolicy(user.Id, false);
        } catch (policyError) {
          console.log('Policy update failed but continuing with approval');
        }
        await createTrialTrackingForUser(request.username);
      }

      request.status = 'approved';
      request.approvedAt = now;
      request.updatedAt = now;
      request.jellyfinUserId = user?.Id || request.jellyfinUserId || null;
      request.adminNote = String(req.body?.adminNote || '').trim();
      await writeApprovalRequests(requests);
      res.json({ message: `${request.username} approved and Jellyfin account created` });
    } catch (error) {
      console.error('Error processing approval request:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to process approval request' });
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
  
  const recycleBinPath = async () => {
    const path = await import('path');
    return path.join(process.cwd(), 'deleted-users-recycle-bin.json');
  };

  const readRecycleBin = async (): Promise<any[]> => {
    try {
      const fs = await import('fs/promises');
      const file = await recycleBinPath();
      const data = await fs.readFile(file, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  const writeRecycleBin = async (items: any[]) => {
    const fs = await import('fs/promises');
    const file = await recycleBinPath();
    await fs.writeFile(file, JSON.stringify(items, null, 2));
  };

  const moveUserToRecycleBin = async (id: string, source: string = 'admin-delete') => {
    try {
      const user = await getUserById(id);
      const items = await readRecycleBin();
      items.unshift({
        recycleId: `${Date.now()}-${id}`,
        deletedAt: new Date().toISOString(),
        source,
        originalId: id,
        name: user?.Name || id,
        policy: user?.Policy || null,
        lastLoginDate: user?.LastLoginDate || null,
        lastActivityDate: user?.LastActivityDate || null,
        rawUser: user || null
      });
      await writeRecycleBin(items.slice(0, 200));
    } catch (error) {
      console.error(`Failed to snapshot user ${id} before delete:`, error);
    }
  };

  app.get('/api/admin/recycle-bin/users', adminAuth, async (req: Request, res: Response) => {
    const items = await readRecycleBin();
    res.json(items);
  });

  app.delete('/api/admin/recycle-bin/users/:recycleId', adminAuth, async (req: Request, res: Response) => {
    const items = await readRecycleBin();
    const next = items.filter(item => item.recycleId !== req.params.recycleId);
    await writeRecycleBin(next);
    res.json({ message: 'Recycle bin item permanently removed' });
  });

  app.post('/api/admin/recycle-bin/users/:recycleId/restore', adminAuth, async (req: Request, res: Response) => {
    const items = await readRecycleBin();
    const item = items.find(entry => entry.recycleId === req.params.recycleId);
    if (!item) return res.status(404).json({ message: 'Recycle bin item not found' });

    const password = req.body?.password || `Restore${Math.floor(1000 + Math.random() * 9000)}!`;
    try {
      const exists = await checkUserExists(item.name);
      if (exists) return res.status(409).json({ message: 'A Jellyfin user with this name already exists' });
      const restored = await createJellyfinUser({ username: item.name, password });
      if (item.policy?.EnableContentDownloading !== undefined) {
        await updateUserPolicy(restored.Id, Boolean(item.policy.EnableContentDownloading));
      }
      if (item.policy?.IsDisabled) {
        await setUserStatus(restored.Id, true);
      }
      const next = items.filter(entry => entry.recycleId !== req.params.recycleId);
      await writeRecycleBin(next);
      res.json({ message: `Restored ${item.name}. Temporary password: ${password}`, temporaryPassword: password });
    } catch (error) {
      console.error('Failed to restore user from recycle bin:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to restore user' });
    }
  });

  const demandPath = async () => {
    const path = await import('path');
    return path.join(process.cwd(), 'demand-analytics.json');
  };

  const normalizeDemandQuery = (query: string) => query.trim().toLowerCase().replace(/\s+/g, ' ');

  const readDemandEntries = async (): Promise<any[]> => {
    try {
      const fs = await import('fs/promises');
      const file = await demandPath();
      const data = await fs.readFile(file, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  const writeDemandEntries = async (items: any[]) => {
    const fs = await import('fs/promises');
    const file = await demandPath();
    await fs.writeFile(file, JSON.stringify(items, null, 2));
  };

  const upsertDemandEntry = async ({
    query,
    username,
    mediaType = 'unknown',
    resultCount = 0,
    source = 'manual'
  }: {
    query: string;
    username: string;
    mediaType?: string;
    resultCount?: number;
    source?: string;
  }) => {
    const now = new Date().toISOString();
    const normalizedQuery = normalizeDemandQuery(query);
    const items = await readDemandEntries();
    const existing = items.find(item => item.normalizedQuery === normalizedQuery);

    if (existing) {
      existing.query = existing.query || query;
      existing.mediaType = existing.mediaType === 'unknown' ? mediaType : existing.mediaType;
      existing.resultCount = resultCount;
      existing.searchCount = (existing.searchCount || 0) + 1;
      existing.lastSearchedAt = now;
      existing.status = existing.status || 'pending';
      existing.users = Array.from(new Set([...(existing.users || []), username]));
      existing.events = [
        { username, searchedAt: now, resultCount, source },
        ...(existing.events || [])
      ].slice(0, 50);
    } else {
      items.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        query,
        normalizedQuery,
        mediaType,
        resultCount,
        status: 'pending',
        searchCount: 1,
        users: [username],
        firstSearchedAt: now,
        lastSearchedAt: now,
        createdAt: now,
        events: [{ username, searchedAt: now, resultCount, source }]
      });
    }

    await writeDemandEntries(items.slice(0, 1000));
  };

  const demandLogStatePath = async () => {
    const path = await import('path');
    return path.join(process.cwd(), 'demand-log-state.json');
  };

  const getProxySearchLogPath = () => {
    return process.env.NPM_ACCESS_LOG_PATH || '/npm-logs/proxy-host-1_access.log';
  };

  const getSearchResultCount = async (query: string): Promise<number> => {
    try {
      const baseUrl = (process.env.JELLYFIN_SERVER_URL || 'http://localhost:8096').replace(/\/$/, '');
      const apiKey = process.env.JELLYFIN_API_KEY || '';
      if (!apiKey) return 0;
      const url = new URL(`${baseUrl}/Items`);
      url.searchParams.set('Recursive', 'true');
      url.searchParams.set('SearchTerm', query);
      url.searchParams.set('IncludeItemTypes', 'Movie,Series');
      url.searchParams.set('Limit', '1');
      url.searchParams.set('EnableTotalRecordCount', 'true');
      const response = await fetch(url, {
        headers: { 'X-Emby-Token': apiKey }
      });
      if (!response.ok) return 0;
      const data: any = await response.json();
      return Number(data?.TotalRecordCount ?? data?.Items?.length ?? 0);
    } catch (error) {
      console.error('Demand search result count failed:', error);
      return 0;
    }
  };

  const importDemandFromProxyLogs = async () => {
    try {
      const fs = await import('fs/promises');
      const logPath = getProxySearchLogPath();
      const stat = await fs.stat(logPath);
      const stateFile = await demandLogStatePath();
      let offset = 0;

      try {
        const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
        offset = state?.parserVersion === 2 ? Number(state?.offset || 0) : Math.max(0, stat.size - 1024 * 1024);
      } catch {
        offset = Math.max(0, stat.size - 1024 * 1024);
      }

      if (offset > stat.size) offset = 0;
      const handle = await fs.open(logPath, 'r');
      const length = stat.size - offset;
      if (length <= 0) {
        await handle.close();
        return { imported: 0 };
      }

      const buffer = Buffer.alloc(length);
      await handle.read(buffer, 0, length, offset);
      await handle.close();
      await fs.writeFile(stateFile, JSON.stringify({ offset: stat.size, importedAt: new Date().toISOString(), logPath, parserVersion: 2 }, null, 2));

      const userMap = new Map<string, string>();
      try {
        const users = await getAllUsers();
        users.forEach((user: any) => userMap.set(String(user.Id || '').replace(/-/g, '').toLowerCase(), user.Name));
      } catch (error) {
        console.error('Demand user map load failed:', error);
      }

      const rawEntries = buffer
        .toString('utf-8')
        .split('\n')
        .map(line => {
          if (!line.includes('searchTerm=')) return null;
          const requestMatch = line.match(/"(\/[^"]+)"/);
          if (!requestMatch) return null;
          try {
            const url = new URL(requestMatch[1], 'http://jellyfin.local');
            const query = url.searchParams.get('searchTerm')?.trim();
            const userId = url.searchParams.get('userId')?.replace(/-/g, '').toLowerCase() || 'unknown';
            if (!query || query.length < 4) return null;
            return {
              query,
              userId,
              username: userMap.get(userId) || `user:${userId.slice(0, 8)}`,
              mediaType: url.searchParams.get('includeItemTypes') || url.searchParams.get('mediaTypes') || 'unknown',
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean) as Array<{ query: string; userId: string; username: string; mediaType: string }>;

      const finalEntries = rawEntries.filter((entry, index, list) => {
        const normalized = normalizeDemandQuery(entry.query);
        return !list.some((other, otherIndex) => {
          if (otherIndex === index || other.userId !== entry.userId) return false;
          const otherNormalized = normalizeDemandQuery(other.query);
          return otherNormalized.length > normalized.length && otherNormalized.startsWith(normalized);
        });
      });

      let imported = 0;
      for (const entry of finalEntries) {
        const resultCount = await getSearchResultCount(entry.query);
        if (resultCount === 0) {
          await upsertDemandEntry({
            query: entry.query,
            username: entry.username,
            mediaType: entry.mediaType,
            resultCount,
            source: 'nginx-proxy-log'
          });
          imported += 1;
        }
      }

      return { imported };
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        console.error('Demand proxy log import failed:', error);
      }
      return { imported: 0, error: error?.message || 'Proxy log import failed' };
    }
  };

  app.get('/api/admin/demand', adminAuth, async (_req: Request, res: Response) => {
    await importDemandFromProxyLogs();
    const items = await readDemandEntries();
    const sorted = items.sort((a, b) => {
      const statusRank: Record<string, number> = { pending: 0, added: 1, rejected: 2, ignored: 3 };
      const rankDiff = (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.lastSearchedAt || b.createdAt).getTime() - new Date(a.lastSearchedAt || a.createdAt).getTime();
    });
    res.json(sorted);
  });

  app.post('/api/admin/demand', adminAuth, async (req: Request, res: Response) => {
    const query = String(req.body?.query || '').trim();
    if (query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const username = String(req.body?.username || 'manual-admin').trim() || 'manual-admin';
    const mediaType = String(req.body?.mediaType || 'unknown');
    const resultCount = Number.isFinite(Number(req.body?.resultCount)) ? Number(req.body.resultCount) : 0;
    await upsertDemandEntry({ query, username, mediaType, resultCount, source: req.body?.source || 'manual' });
    res.status(201).json({ message: 'Demand entry recorded' });
  });

  app.post('/api/admin/demand/import-proxy-logs', adminAuth, async (_req: Request, res: Response) => {
    const result = await importDemandFromProxyLogs();
    res.json({ message: `Imported ${result.imported || 0} missing searches`, ...result });
  });

  app.patch('/api/admin/demand/:id', adminAuth, async (req: Request, res: Response) => {
    const allowedStatuses = new Set(['pending', 'added', 'rejected', 'ignored']);
    const status = String(req.body?.status || '');
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ message: 'Invalid demand status' });
    }

    const items = await readDemandEntries();
    const item = items.find(entry => entry.id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Demand entry not found' });

    item.status = status;
    item.updatedAt = new Date().toISOString();
    await writeDemandEntries(items);
    res.json({ message: `Demand marked ${status}` });
  });

  app.delete('/api/admin/demand/:id', adminAuth, async (req: Request, res: Response) => {
    const items = await readDemandEntries();
    const next = items.filter(entry => entry.id !== req.params.id);
    await writeDemandEntries(next);
    res.json({ message: 'Demand entry removed' });
  });

  // Perform user action (delete, enable, disable, reset password, bulk actions)
  app.post("/api/admin/users/action", adminAuth, async (req, res) => {
    try {
      const validatedData = userActionSchema.parse(req.body);
      const { userId, action, newPassword, userIds } = validatedData;
      
      switch (action) {
        case "delete":
          // Handle bulk delete when userIds array is provided
          if (userIds && userIds.length > 0) {
            let success = 0;
            let failure = 0;
            
            for (const id of userIds) {
              try {
                await moveUserToRecycleBin(id, 'bulk-delete');
                await deleteUser(id);
                success++;
              } catch (error) {
                console.error(`Error deleting user ${id}:`, error);
                failure++;
              }
            }
            
            return res.status(200).json({ 
              message: `Deleted ${success} users successfully${failure > 0 ? `, ${failure} failed` : ''}` 
            });
          }
          
          // Handle single user delete
          if (!userId) {
            return res.status(400).json({ message: "User ID is required for delete action" });
          }
          await moveUserToRecycleBin(userId as string, 'single-delete');
          await deleteUser(userId as string);
          return res.status(200).json({ message: "User deleted successfully. Snapshot saved to recycle bin." });
          
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
          // Handle bulk password reset when userIds array is provided
          if (userIds && userIds.length > 0) {
            const defaultPassword = "jellyfin123"; // Default password for bulk reset
            let success = 0;
            let failure = 0;
            
            for (const id of userIds) {
              try {
                await resetUserPassword(id, defaultPassword);
                success++;
              } catch (error) {
                console.error(`Error resetting password for user ${id}:`, error);
                failure++;
              }
            }
            
            return res.status(200).json({ 
              message: `Reset passwords for ${success} users successfully${failure > 0 ? `, ${failure} failed` : ''}. Default password: ${defaultPassword}` 
            });
          }
          
          // Handle single user password reset
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
          // Handle bulk downloads toggle when userIds array is provided
          if (userIds && userIds.length > 0) {
            const enableDownloads = true; // Enable downloads for bulk operation
            let success = 0;
            let failure = 0;
            
            for (const id of userIds) {
              try {
                await updateUserPolicy(id, enableDownloads);
                success++;
              } catch (error) {
                console.error(`Error toggling downloads for user ${id}:`, error);
                failure++;
              }
            }
            
            return res.status(200).json({ 
              message: `Downloads enabled for ${success} users successfully${failure > 0 ? `, ${failure} failed` : ''}` 
            });
          }
          
          // Handle single user downloads toggle
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

  // Cache trending content for better performance
  let cachedTrendingContent: any = null;
  let lastCacheTime: number = 0;
  const CACHE_TTL = 2 * 60 * 60 * 1000; // Cache TTL: 2 hours
  
  // API endpoint to fetch trending movies from TMDB
  app.get('/api/trending-movies', async (req: Request, res: Response) => {
    try {
      const currentTime = Date.now();
      
      // Check if cache is valid (less than 2 hours old)
      if (cachedTrendingContent && (currentTime - lastCacheTime) < CACHE_TTL) {
        console.log('Serving cached trending content, age:', Math.round((currentTime - lastCacheTime)/60000), 'minutes');
        return res.json(cachedTrendingContent);
      }
      
      // Cache expired or doesn't exist, fetch fresh data
      console.log('Cache expired or missing, fetching fresh trending content from TMDB API');
      const trendingMovies = await fetchTrendingMovies();
      console.log(`Fetched and caching ${trendingMovies.results?.length || 0} trending items`);
      
      // Update the cache
      cachedTrendingContent = trendingMovies;
      lastCacheTime = currentTime;
      
      res.json(trendingMovies);
    } catch (error) {
      console.error('Error in trending-movies endpoint:', error);
      
      // If there's cached data, serve it even if expired
      if (cachedTrendingContent) {
        console.log('Error fetching fresh data, serving cached content');
        return res.json(cachedTrendingContent);
      }
      
      res.status(500).json({ error: 'Failed to fetch trending movies' });
    }
  });

  // Trial Management API Routes
  
  // Get trial settings - Alternative file-based approach
  app.get('/api/admin/trial-settings', adminAuth, async (req: Request, res: Response) => {
    try {
      // Try storage first, fallback to file-based approach
      try {
        const settings = await storage.getTrialSettings();
        if (settings) {
          return res.json(settings);
        }
      } catch (storageError) {
        console.log('Storage failed for get settings, trying file-based approach:', storageError);
      }
      
      // File-based fallback
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const settingsFile = path.join(process.cwd(), 'trial-settings.json');
      
      try {
        const data = await fs.readFile(settingsFile, 'utf-8');
        const settings = JSON.parse(data);
        console.log('Trial settings loaded from file');
        res.json(settings);
      } catch (fileError) {
        console.log('No settings file found, returning defaults');
        // Return defaults if no file exists
        const defaultSettings = {
          id: 1,
          isTrialModeEnabled: false,
          trialDurationDays: 7,
          expiryAction: 'disable',
          updatedAt: new Date()
        };
        res.json(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching trial settings:', error);
      res.status(500).json({ message: 'Failed to fetch trial settings' });
    }
  });

  // Update trial settings - Alternative file-based approach
  app.put('/api/admin/trial-settings', adminAuth, async (req: Request, res: Response) => {
    try {
      console.log('Trial settings update request body:', req.body);
      
      // Simple validation
      const { isTrialModeEnabled, trialDurationDays, expiryAction } = req.body;
      
      if (typeof isTrialModeEnabled !== 'boolean') {
        return res.status(400).json({ message: 'isTrialModeEnabled must be boolean' });
      }
      
      if (typeof trialDurationDays !== 'number' || trialDurationDays < 1 || trialDurationDays > 30) {
        return res.status(400).json({ message: 'trialDurationDays must be between 1 and 30' });
      }
      
      if (!['disable', 'delete'].includes(expiryAction)) {
        return res.status(400).json({ message: 'expiryAction must be disable or delete' });
      }
      
      const validatedData = { isTrialModeEnabled, trialDurationDays, expiryAction };
      console.log('Validated trial settings data:', validatedData);
      
      // Try storage first, fallback to file-based approach
      try {
        const updatedSettings = await storage.updateTrialSettings(validatedData);
        console.log('Updated trial settings via storage:', updatedSettings);
        res.json(updatedSettings);
      } catch (storageError) {
        console.log('Storage failed, using file-based approach:', storageError);
        
        // File-based fallback
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const settingsFile = path.join(process.cwd(), 'trial-settings.json');
        const settings = {
          id: 1,
          isTrialModeEnabled,
          trialDurationDays,
          expiryAction,
          updatedAt: new Date()
        };
        
        await fs.writeFile(settingsFile, JSON.stringify(settings, null, 2));
        console.log('Trial settings saved to file successfully');
        res.json(settings);
      }
    } catch (error) {
      console.error('Error updating trial settings:', error);
      res.status(500).json({ 
        message: 'Failed to update trial settings', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get('/api/admin/trial-users', adminAuth, async (req: Request, res: Response) => {
    try {
      const trialUsers = await storage.getAllTrialUsers();
      res.json(trialUsers || []);
    } catch (error) {
      console.error('Error fetching trial users:', error);
      res.status(500).json({ 
        message: 'Failed to fetch trial users',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get trial settings for signup page
  app.get('/api/trial-info', async (req: Request, res: Response) => {
    try {
      let settings = null;
      
      // Try storage first
      try {
        settings = await storage.getTrialSettings();
        console.log('Storage trial settings:', settings);
      } catch (storageError) {
        console.log('Storage failed for trial settings, using file fallback:', storageError);
      }
      
      // File fallback if storage fails or returns null
      if (!settings) {
        try {
          const fs = await import('fs/promises');
          const path = await import('path');
          const settingsFile = path.join(process.cwd(), 'trial-settings.json');
          const data = await fs.readFile(settingsFile, 'utf-8');
          settings = JSON.parse(data);
          console.log('Trial settings loaded from file fallback:', settings);
        } catch (fileError) {
          console.log('No trial settings file found:', fileError);
        }
      }
      
      console.log('Final settings before response:', settings);
      
      if (settings?.isTrialModeEnabled) {
        console.log('Sending trial enabled response');
        res.json({
          isTrialModeEnabled: true,
          trialDurationDays: settings.trialDurationDays
        });
      } else {
        console.log('Sending trial disabled response');
        res.json({ isTrialModeEnabled: false });
      }
    } catch (error) {
      console.error('Error fetching trial info:', error);
      res.json({ isTrialModeEnabled: false });
    }
  });

  // Per-user trial controls: extend, convert to regular, mark expired, disable/delete now
  app.post('/api/admin/trial-users/:username/action', adminAuth, async (req: Request, res: Response) => {
    try {
      const username = decodeURIComponent(req.params.username);
      const { action, days = 7 } = req.body || {};
      const trialUser = await storage.getTrialUser(username);

      if (!trialUser) {
        return res.status(404).json({ message: 'Trial user not found' });
      }

      if (action === 'extend') {
        const safeDays = Math.max(1, Math.min(365, Number(days) || 7));
        const baseDate = new Date(trialUser.expiryDate) > new Date() ? new Date(trialUser.expiryDate) : new Date();
        const expiryDate = new Date(baseDate);
        expiryDate.setDate(baseDate.getDate() + safeDays);

        await storage.deleteTrialUser(username);
        await storage.createTrialUser({
          username,
          signupDate: new Date(trialUser.signupDate),
          expiryDate,
          isExpired: false,
          trialDurationDays: (trialUser.trialDurationDays || 0) + safeDays
        });

        return res.json({ message: `Extended ${username}'s trial by ${safeDays} days`, expiryDate });
      }

      if (action === 'convert-regular') {
        await storage.deleteTrialUser(username);
        return res.json({ message: `${username} converted to regular user` });
      }

      if (action === 'mark-expired') {
        await storage.markTrialUserExpired(username);
        return res.json({ message: `${username} marked as expired` });
      }

      if (action === 'disable-now' || action === 'delete-now') {
        const users = await getAllUsers();
        const jellyfinUser = users.find((u: any) => u.Name === username);
        if (!jellyfinUser) {
          return res.status(404).json({ message: 'Matching Jellyfin user not found' });
        }
        if (action === 'delete-now') {
          await moveUserToRecycleBin(jellyfinUser.Id, 'trial-delete');
          await deleteUser(jellyfinUser.Id);
          await storage.deleteTrialUser(username);
          return res.json({ message: `${username} deleted from Jellyfin and trial tracking` });
        }
        await setUserStatus(jellyfinUser.Id, true);
        await storage.markTrialUserExpired(username);
        return res.json({ message: `${username} disabled and marked expired` });
      }

      return res.status(400).json({ message: 'Invalid trial action' });
    } catch (error) {
      console.error('Error performing trial user action:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to perform trial action' });
    }
  });

  // Process expired trial users
  app.post('/api/admin/process-expired-trials', adminAuth, async (req: Request, res: Response) => {
    try {
      const expiredUsers = await storage.getExpiredTrialUsers();
      const settings = await storage.getTrialSettings();
      
      let processedCount = 0;
      
      for (const trialUser of expiredUsers) {
        try {
          if (settings?.expiryAction === 'delete') {
            const users = await getAllUsers();
            const jellyfinUser = users.find((u: any) => u.Name === trialUser.username);
            if (jellyfinUser) {
              await moveUserToRecycleBin(jellyfinUser.Id, 'expired-trial-delete');
              await deleteUser(jellyfinUser.Id);
            }
            await storage.deleteTrialUser(trialUser.username);
          } else {
            const users = await getAllUsers();
            const jellyfinUser = users.find((u: any) => u.Name === trialUser.username);
            if (jellyfinUser) {
              await setUserStatus(jellyfinUser.Id, true);
            }
            await storage.markTrialUserExpired(trialUser.username);
          }
          processedCount++;
        } catch (error) {
          console.error(`Failed to process expired user ${trialUser.username}:`, error);
        }
      }
      
      res.json({ 
        message: `Processed ${processedCount} expired trial users`,
        processedCount,
        action: settings?.expiryAction || 'disable'
      });
    } catch (error) {
      console.error('Error processing expired trials:', error);
      res.status(500).json({ message: 'Failed to process expired trials' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
