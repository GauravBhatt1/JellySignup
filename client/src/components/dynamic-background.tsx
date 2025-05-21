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
  
  // Fallback images if API fails - mix of Indian and Hollywood content
  const getFallbackImages = () => [
    // Bollywood & Indian content
    "https://image.tmdb.org/t/p/original/xtqZ3lWdYhBERG8kSiKQMgxXpE0.jpg", // Kalki 2898 AD
    "https://image.tmdb.org/t/p/original/fI9CYjJbapkSfEqfdztrH692Qq0.jpg", // Stree 2
    "https://image.tmdb.org/t/p/original/4j5AbP0AY3wFg99KcKDBQuYTPX6.jpg", // Mirzapur (Series) 
    "https://image.tmdb.org/t/p/original/2VnghWG9dsHwFfqlT2va2ewlOhS.jpg", // Panchayat (Series)
    // Hollywood & Global content
    "https://image.tmdb.org/t/p/original/rMvPXy8PUjj1o8o1pzgQbdNCsvj.jpg", // Deadpool & Wolverine
    "https://image.tmdb.org/t/p/original/t5zCBSB5xMDKcDqe91qahCOUYVV.jpg", // Dune 2
    "https://image.tmdb.org/t/p/original/4m1Au3YkjqsxF8iwQy0mfFr2KB7.jpg", // Inside Out 2
    "https://image.tmdb.org/t/p/original/d8j7JVb3iVvaJu0GjdA6pCqtIKH.jpg"  // Stranger Things (Series)
  ];
  
  // Show nothing while loading or if no images available
  if (isLoading && backgroundImages.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden">
      <div className="absolute inset-0 bg-[#0f1129] z-[-25]" /> {/* Solid background base layer */}
      
      {backgroundImages.map((imageUrl, index) => (
        <div 
          key={`bg-${index}-${imageUrl.slice(-20)}`}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1500 ease-in-out"
          style={{ 
            backgroundImage: `url(${imageUrl})`,
            opacity: index === currentImageIndex ? 0.8 : 0, // Increased opacity further to 0.8
            zIndex: index === currentImageIndex ? -22 : -23
          }}
        />
      ))}
      
      {/* Dark overlay with reduced opacity for much better image visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1129]/20 to-[#0f1129]/60 backdrop-blur-[1px] z-[-21]" />
      
      {/* Add a subtle animation to make background more noticeable */}
      <div className="absolute inset-0 z-[-20] opacity-30">
        <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent animate-pulse-slow" />
      </div>
    </div>
  );
}