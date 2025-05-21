// Debug endpoint for Vercel deployment
export default function handler(req, res) {
  const deploymentInfo = {
    status: "running",
    environment: process.env.NODE_ENV || 'unknown',
    platform: process.env.VERCEL ? 'Vercel' : 'Unknown',
    region: process.env.VERCEL_REGION || 'unknown',
    nodeVersion: process.version,
    envVars: {
      jellyfin: process.env.JELLYFIN_API_KEY ? 'Set ✓' : 'Not set ✗',
      jellyfinServer: process.env.JELLYFIN_SERVER_URL ? 'Set ✓' : 'Not set ✗',
      tmdb: process.env.TMDB_API_KEY ? 'Set ✓' : 'Not set ✗'
    },
    timestamp: new Date().toISOString()
  };
  
  res.status(200).json(deploymentInfo);
}