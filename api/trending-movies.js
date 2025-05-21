// Vercel Serverless Function for Trending Movies API
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache

let cachedData = null;
let lastFetchTime = 0;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // Check if we have cached data that's still fresh
    const now = Date.now();
    if (cachedData && (now - lastFetchTime < CACHE_TTL)) {
      console.log(`Serving cached trending content, age: ${Math.floor((now - lastFetchTime) / 60000)} minutes`);
      return res.status(200).json(cachedData);
    }

    // Cache expired or doesn't exist, fetch new data
    if (!TMDB_API_KEY) {
      // Return friendly error if API key is missing
      return res.status(500).json({ 
        error: "Configuration Error", 
        message: "TMDB API key not configured" 
      });
    }

    // Fetch trending movies
    const response = await axios.get(
      `https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}&language=en-US&region=IN&with_original_language=hi|ta|te|ml|bn&page=1`
    );

    // Filter for movies with backdrop images
    const movies = response.data;
    
    // Update cache
    cachedData = movies;
    lastFetchTime = now;
    
    console.log(`Fetched ${movies.results?.length || 0} trending movies from TMDB`);
    return res.status(200).json(movies);
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    
    return res.status(500).json({ 
      error: "API Error", 
      message: "Failed to fetch trending movies",
      details: error.message 
    });
  }
}