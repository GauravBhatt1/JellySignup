// Netlify serverless function for API endpoints
exports.handler = async function(event, context) {
  // Basic health check endpoint
  if (event.path.includes('/api/health')) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "ok",
        message: "Jellyfin Signup API is running on Netlify Functions",
        env: {
          jellyfin: process.env.JELLYFIN_API_KEY ? "Set ✓" : "Not set ✗",
          jellyfinServer: process.env.JELLYFIN_SERVER_URL ? "Set ✓" : "Not set ✗",
          tmdb: process.env.TMDB_API_KEY ? "Set ✓" : "Not set ✗"
        }
      })
    };
  }

  // Default response
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Jellyfin Signup API function is running. Use /api/health for status."
    })
  };
};