// Vercel serverless function entry point
export default function handler(req, res) {
  // Simple redirect to root for deployment verification
  if (req.url === '/api/health') {
    return res.status(200).json({ status: "ok", message: "Jellyfin Signup API is running" });
  }
  
  // Redirect to the frontend app
  res.status(200).json({ 
    message: "Jellyfin Signup API is running. Please access the frontend application." 
  });
}