import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Create a memory store for sessions
import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

const app = express();

// Enable trust proxy for running behind reverse proxies in Portainer/Docker
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware with settings for reverse proxy
app.use(session({
  secret: process.env.SESSION_SECRET || 'jellyfin-admin-secret',
  resave: true,
  saveUninitialized: true,
  proxy: true, // Trust the reverse proxy
  cookie: { 
    // Don't set secure flag as we're behind a reverse proxy
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    sameSite: 'lax'
  },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
}));

// Trust proxy headers for correct handling of client IP/protocol when behind proxy
app.set('trust proxy', 1);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log(`Jellyfin API Configuration: 
  Server URL: ${process.env.JELLYFIN_SERVER_URL}
  API Key Set: ${process.env.JELLYFIN_API_KEY ? 'Yes' : 'No'}`);

  console.log('Location tracking features disabled as requested');

  // Database configuration logging for VPS debugging
  if (process.env.DATABASE_URL) {
    const dbType = process.env.DATABASE_URL.includes('mongodb') ? 'MongoDB' : 'PostgreSQL';
    console.log(`Database Configuration: ${dbType} detected`);
    if (dbType === 'MongoDB') {
      console.log('Testing MongoDB connection...');
      try {
        const { MongoStorage } = await import('./mongo-storage');
        const mongoStorage = new MongoStorage();
        await mongoStorage.getTrialSettings();
        console.log('✅ MongoDB connection test successful');
      } catch (error) {
        console.error('❌ MongoDB connection test failed:', error instanceof Error ? error.message : error);
      }
    }
  } else {
    console.log('⚠️ No DATABASE_URL configured - using in-memory storage');
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
