import { useEffect, useState } from 'react';

// Latest trending movie posters that will be used for the background
const trendingMovieBackdrops = [
  "https://image.tmdb.org/t/p/original/rMvPXy8PUjj1o8o1pzgQbdNCsvj.jpg", // Deadpool & Wolverine
  "https://image.tmdb.org/t/p/original/xvk5AhfhgQcTuaCQyq1XqChQOBt.jpg", // Kingdom of the Planet of the Apes
  "https://image.tmdb.org/t/p/original/t5zCBSB5xMDKcDqe91qahCOUYVV.jpg", // Dune: Part Two
  "https://image.tmdb.org/t/p/original/cIHFBGgbvyLtQPfEKlU27TQ35GT.jpg", // A Quiet Place: Day One
  "https://image.tmdb.org/t/p/original/xgDj56UWyeWQcxAa0n5QJDhdeCs.jpg", // Godzilla x Kong
  "https://image.tmdb.org/t/p/original/nTPFkLUARmo1bYHfkfdNpRKgEOs.jpg", // Bad Boys: Ride or Die
  "https://image.tmdb.org/t/p/original/4woSOUD0equAYzvwhWBHIJDCM88.jpg", // Furiosa: A Mad Max Saga
  "https://image.tmdb.org/t/p/original/efNu0fNtQlnF6C6rZThEP4LX5En.jpg", // Fall Guy
  "https://image.tmdb.org/t/p/original/4m1Au3YkjqsxF8iwQy0mfFr2KB7.jpg", // Inside Out 2
  "https://image.tmdb.org/t/p/original/kHlX3xIm4cFcM78NjOtd3P8WATD.jpg"  // Sound of Freedom
];

export function DynamicBackground() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Rotate background images every 8 seconds
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex => 
        prevIndex === trendingMovieBackdrops.length - 1 ? 0 : prevIndex + 1
      );
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {trendingMovieBackdrops.map((imageUrl, index) => (
        <div 
          key={imageUrl}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1500 ease-in-out"
          style={{ 
            backgroundImage: `url(${imageUrl})`,
            opacity: index === currentImageIndex ? 0.2 : 0,
            zIndex: index === currentImageIndex ? -1 : -2
          }}
        />
      ))}
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1129]/70 to-[#0f1129]/95 backdrop-blur-sm z-[-1]" />
    </div>
  );
}