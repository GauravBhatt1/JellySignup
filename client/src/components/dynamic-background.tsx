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

  useEffect(() => {
    // Set fallback images first
    setBackgroundImages(getFallbackImages());
    
    // Then try to fetch trending movies
    async function fetchTrendingMovies() {
      try {
        console.log("Fetching trending movies for background...");
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
          }
        }
      } catch (error) {
        console.error('Error fetching trending movies:', error);
      }
    }

    fetchTrendingMovies();
  }, []);

  // Rotate images every 8 seconds
  useEffect(() => {
    if (backgroundImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 10000); // Longer duration (10s) for smoother experience
    
    return () => clearInterval(interval);
  }, [backgroundImages]);
  
  // Mix of Hollywood, Bollywood and TV Series backdrops
  const getFallbackImages = () => [
    // Indian films
    "https://image.tmdb.org/t/p/original/xtqZ3lWdYhBERG8kSiKQMgxXpE0.jpg", // Kalki 2898 AD
    "https://image.tmdb.org/t/p/original/fI9CYjJbapkSfEqfdztrH692Qq0.jpg", // Stree 2
    // Indian web series  
    "https://image.tmdb.org/t/p/original/4j5AbP0AY3wFg99KcKDBQuYTPX6.jpg", // Mirzapur
    "https://image.tmdb.org/t/p/original/2VnghWG9dsHwFfqlT2va2ewlOhS.jpg", // Panchayat
    // Hollywood films
    "https://image.tmdb.org/t/p/original/rMvPXy8PUjj1o8o1pzgQbdNCsvj.jpg", // Deadpool
    "https://image.tmdb.org/t/p/original/t5zCBSB5xMDKcDqe91qahCOUYVV.jpg", // Dune 2
    "https://image.tmdb.org/t/p/original/4m1Au3YkjqsxF8iwQy0mfFr2KB7.jpg", // Inside Out 2
    // Global web series
    "https://image.tmdb.org/t/p/original/d8j7JVb3iVvaJu0GjdA6pCqtIKH.jpg"  // Stranger Things
  ];
  
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Base background to prevent white flashes during scroll */}
      <div className="fixed inset-0 bg-[#0f1129] -z-30"></div>
      
      {/* Current visible background image */}
      {backgroundImages.length > 0 && (
        <div 
          className="fixed inset-0 bg-cover bg-center -z-20"
          style={{ 
            backgroundImage: `url(${backgroundImages[currentImageIndex]})`,
            opacity: 0.55,
            backgroundPosition: 'center 20%'
          }}
        />
      )}
      
      {/* Preload next image for smoother transition on VPS */}
      {backgroundImages.length > 1 && (
        <div 
          className="fixed inset-0 bg-cover bg-center -z-29 hidden"
          style={{ 
            backgroundImage: `url(${backgroundImages[(currentImageIndex + 1) % backgroundImages.length]})`,
            backgroundPosition: 'center 20%'
          }}
        />
      )}
      
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0f1129]/40 to-[#0f1129]/80 backdrop-blur-[1px] -z-10"></div>
    </div>
  );
}