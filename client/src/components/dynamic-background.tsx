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
    // Fetch trending movies from TMDB API
    const fetchTrendingMovies = async () => {
      try {
        // Fetch trending movies from server proxy to avoid exposing API key
        const response = await axios.get('/api/trending-movies');
        
        if (response.data && response.data.results) {
          // Extract backdrop paths and form full URLs
          const images = response.data.results
            .filter((movie: Movie) => movie.backdrop_path)
            .map((movie: Movie) => 
              `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
            );
          
          console.log(`Loaded ${images.length} trending movie backdrops`);
          setBackgroundImages(images);
        } else {
          console.error('Invalid response format from trending movies API');
          setBackgroundImages(getFallbackImages());
        }
      } catch (error) {
        console.error('Error fetching trending movies:', error);
        setBackgroundImages(getFallbackImages());
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingMovies();
    
    // Fallback in case API doesn't respond in 3 seconds
    const fallbackTimer = setTimeout(() => {
      if (isLoading && backgroundImages.length === 0) {
        console.log('Falling back to default images due to timeout');
        setBackgroundImages(getFallbackImages());
        setIsLoading(false);
      }
    }, 3000);

    return () => clearTimeout(fallbackTimer);
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
  
  // Fallback images if API fails
  const getFallbackImages = () => [
    "https://image.tmdb.org/t/p/original/rMvPXy8PUjj1o8o1pzgQbdNCsvj.jpg", // Deadpool
    "https://image.tmdb.org/t/p/original/t5zCBSB5xMDKcDqe91qahCOUYVV.jpg", // Dune
    "https://image.tmdb.org/t/p/original/xgDj56UWyeWQcxAa0n5QJDhdeCs.jpg", // Godzilla
    "https://image.tmdb.org/t/p/original/4m1Au3YkjqsxF8iwQy0mfFr2KB7.jpg"  // Inside Out
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
            opacity: index === currentImageIndex ? 0.35 : 0, // Increased opacity to 0.35
            zIndex: index === currentImageIndex ? -1 : -2
          }}
        />
      ))}
      {/* Dark overlay for better text readability - reduced opacity for better visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1129]/50 to-[#0f1129]/80 backdrop-blur-sm z-[-1]" />
    </div>
  );
}