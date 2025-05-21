import { useEffect, useState } from 'react';
import axios from 'axios';

interface Movie {
  backdrop_path: string;
  title: string;
  id: number;
}

export function DynamicBackground() {
  const [currentBackground, setCurrentBackground] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Pre-loaded static background that will definitely work on VPS
  const staticBackground = "https://image.tmdb.org/t/p/original/rMvPXy8PUjj1o8o1pzgQbdNCsvj.jpg"; // Deadpool

  // Load backgrounds only once on component mount
  useEffect(() => {
    const loadBackgrounds = async () => {
      // First set static background - guaranteed to work on VPS
      setCurrentBackground(staticBackground);
      setIsLoading(false);
      
      // Get fallback images ready as a backup
      const fallbackImages = getFallbackImages();
      
      try {
        // Try to get trending data from API
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
            
            // Set a random background from the fetched images
            const randomIndex = Math.floor(Math.random() * images.length);
            setCurrentBackground(images[randomIndex]);
            
            // Set up an interval to change the background periodically
            let imageIndex = randomIndex;
            
            const interval = setInterval(() => {
              imageIndex = (imageIndex + 1) % images.length;
              
              // Create a new image element to preload
              const img = new Image();
              img.onload = () => {
                // Only change background after image is loaded
                setCurrentBackground(images[imageIndex]);
              };
              img.onerror = () => {
                // On error, use a fallback image
                const fallbackIndex = Math.floor(Math.random() * fallbackImages.length);
                setCurrentBackground(fallbackImages[fallbackIndex]);
              };
              img.src = images[imageIndex];
            }, 15000); // Every 15 seconds
            
            return () => clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error fetching trending movies:', error);
        // Use a random fallback image on error
        const randomIndex = Math.floor(Math.random() * fallbackImages.length);
        setCurrentBackground(fallbackImages[randomIndex]);
      }
    };

    loadBackgrounds();
  }, []);
  
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
      
      {/* VPS-FRIENDLY VERSION: Simple single background image with no transitions */}
      {!isLoading && currentBackground && (
        <div 
          className="fixed inset-0 bg-cover bg-center -z-20"
          style={{ 
            backgroundImage: `url(${currentBackground})`,
            opacity: 0.55,
            backgroundPosition: 'center 20%',
          }}
        />
      )}
      
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0f1129]/40 to-[#0f1129]/80 backdrop-blur-[1px] -z-10"></div>
    </div>
  );
}