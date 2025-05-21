import { useEffect, useState } from 'react';
import axios from 'axios';

interface Movie {
  backdrop_path: string;
  title: string;
  id: number;
}

export function DynamicBackground() {
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show fallback images immediately while real images load
    setBackgroundImages(getFallbackImages());
    
    // Fetch trending movies from TMDB API
    const fetchTrendingMovies = async () => {
      try {
        console.log("Fetching trending movies for background...");
        // Fetch trending movies from server proxy to avoid exposing API key
        const response = await axios.get('/api/trending-movies');
        
        if (response.data && response.data.results) {
          // Extract backdrop paths and form full URLs
          const images = response.data.results
            .filter((movie: Movie) => movie.backdrop_path)
            .map((movie: Movie) => 
              `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
            );
          
          if (images.length > 0) {
            console.log(`✅ Loaded ${images.length} trending movie backdrops`);
            setBackgroundImages(images);
          } else {
            console.log("No valid backdrop images found, using fallbacks");
          }
        } else {
          console.error('Invalid response format from trending movies API');
        }
      } catch (error) {
        console.error('Error fetching trending movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingMovies();
    
    // No need for fallback timer as we already set fallback images at the start
  }, []);

  // Rotate images periodically
  useEffect(() => {
    if (backgroundImages.length === 0) return;
    
    // Rotate background images every 8 seconds
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 8000);
    
    return () => clearInterval(interval);
  }, [backgroundImages]);
  
  // Fallback images if API fails - high-quality popular movie backdrops
  const getFallbackImages = () => [
    "https://image.tmdb.org/t/p/original/rMvPXy8PUjj1o8o1pzgQbdNCsvj.jpg", // Deadpool & Wolverine
    "https://image.tmdb.org/t/p/original/t5zCBSB5xMDKcDqe91qahCOUYVV.jpg", // Dune 2
    "https://image.tmdb.org/t/p/original/xgDj56UWyeWQcxAa0n5QJDhdeCs.jpg", // Godzilla x Kong
    "https://image.tmdb.org/t/p/original/4m1Au3YkjqsxF8iwQy0mfFr2KB7.jpg", // Inside Out 2
    "https://image.tmdb.org/t/p/original/kHlX3xIm4cFcM78NjOtd3P8WATD.jpg", // Sound of Freedom
    "https://image.tmdb.org/t/p/original/4woSOUD0equAYzvwhWBHIJDCM88.jpg", // Furiosa
    "https://image.tmdb.org/t/p/original/nTPFkLUARmo1bYHfkfdNpRKgEOs.jpg", // Bad Boys
    "https://image.tmdb.org/t/p/original/efNu0fNtQlnF6C6rZThEP4LX5En.jpg"  // Fall Guy
  ];
  
  // Show nothing while loading or if no images available
  if (isLoading && backgroundImages.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {backgroundImages.map((imageUrl, index) => (
        <div 
          key={imageUrl}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1500 ease-in-out"
          style={{ 
            backgroundImage: `url(${imageUrl})`,
            opacity: index === currentImageIndex ? 0.75 : 0, // Increased opacity to 0.75 for much better visibility
            zIndex: index === currentImageIndex ? -1 : -2
          }}
        />
      ))}
      {/* Dark overlay with reduced opacity for better image visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1129]/30 to-[#0f1129]/65 backdrop-blur-[1px] z-[-1]" />
    </div>
  );
}