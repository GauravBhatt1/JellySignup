// Vercel Serverless Function for handling API requests
import express from 'express';
import cors from 'cors';
import { JELLYFIN_API_KEY, JELLYFIN_SERVER_URL } from '../server/jellyfin';

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'Jellyfin Signup API is running' });
});

// Echo environment check
app.get('/api/check-env', (req, res) => {
  res.json({
    jellyfin_url_set: !!JELLYFIN_SERVER_URL,
    jellyfin_api_key_set: !!JELLYFIN_API_KEY,
    env: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
  });
});

// Handle all other API routes
app.all('/api/*', (req, res) => {
  // This will be replaced with proper API routing later
  res.status(501).json({ message: 'API endpoint not yet implemented' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

export default app;