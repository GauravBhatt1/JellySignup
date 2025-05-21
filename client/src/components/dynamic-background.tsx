import { useEffect, useState } from 'react';
import { JELLYFIN_API_BASE_URL } from '@/lib/jellyfin';

interface Movie {
  Id: string;
  Name: string;
  BackdropImageTags?: string[];
  ImageTags?: {
    Primary?: string;
  };
}

export function DynamicBackground() {
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const apiKey = import.meta.env.VITE_JELLYFIN_API_KEY;

  useEffect(() => {
    const fetchTrendingMedia = async () => {
      try {
        if (!JELLYFIN_API_BASE_URL) return;
        
        // Fetch trending movies
        const response = await fetch(`${JELLYFIN_API_BASE_URL}/Items?IncludeItemTypes=Movie&Limit=10&Recursive=true&SortBy=DateCreated&SortOrder=Descending&ImageTypeLimit=1&EnableImageTypes=Backdrop,Primary&api_key=${apiKey}`);
        
        if (!response.ok) {
          console.error('Failed to fetch trending media');
          return;
        }
        
        const data = await response.json();
        const items: Movie[] = data.Items || [];
        
        // Filter items that have backdrop images
        const itemsWithImages = items.filter(item => 
          (item.BackdropImageTags && item.BackdropImageTags.length > 0) || 
          (item.ImageTags && item.ImageTags.Primary)
        );
        
        if (itemsWithImages.length === 0) {
          // Fallback to default images if no media with images found
          setBackgroundImages(getDefaultBackgroundImages());
          return;
        }
        
        // Create image URLs for items with backdrop images
        const imageUrls = itemsWithImages.map(item => {
          if (item.BackdropImageTags && item.BackdropImageTags.length > 0) {
            return `${JELLYFIN_API_BASE_URL}/Items/${item.Id}/Images/Backdrop?tag=${item.BackdropImageTags[0]}&quality=90&api_key=${apiKey}`;
          } else if (item.ImageTags && item.ImageTags.Primary) {
            return `${JELLYFIN_API_BASE_URL}/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&quality=90&api_key=${apiKey}`;
          }
          return '';
        }).filter(url => url !== '');
        
        setBackgroundImages(imageUrls.length > 0 ? imageUrls : getDefaultBackgroundImages());
      } catch (error) {
        console.error('Error fetching trending media:', error);
        // Fallback to default images on error
        setBackgroundImages(getDefaultBackgroundImages());
      }
    };
    
    fetchTrendingMedia();
    
    // Rotate background images every 10 seconds
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 10000);
    
    return () => clearInterval(interval);
  }, [backgroundImages.length]);
  
  // Fallback background images with cinematic themes
  const getDefaultBackgroundImages = () => {
    return [
      'https://img.wallpapersafari.com/desktop/1920/1080/95/51/LEyZTk.jpg',
      'https://c4.wallpaperflare.com/wallpaper/332/915/598/movies-film-reels-wallpaper-preview.jpg',
      'https://wallpaperaccess.com/full/329698.jpg',
      'https://wallpaperaccess.com/full/177120.jpg',
      'https://wallpapercave.com/wp/wp1945897.jpg'
    ];
  };
  
  if (backgroundImages.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {backgroundImages.map((imageUrl, index) => (
        <div 
          key={imageUrl}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
          style={{ 
            backgroundImage: `url(${imageUrl})`,
            opacity: index === currentImageIndex ? 0.15 : 0,
            zIndex: index === currentImageIndex ? -1 : -2
          }}
        />
      ))}
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1129]/80 to-[#0f1129]/95 backdrop-blur-sm z-[-1]" />
    </div>
  );
}