import { useState, useEffect } from "react";

export function useTourGuide(tourKey = "jellyfin-signup-tour-completed") {
  const [showTour, setShowTour] = useState(false);
  
  useEffect(() => {
    // Check if this is the first visit
    const tourCompleted = localStorage.getItem(tourKey) === 'true';
    
    // Only show the tour if it hasn't been completed before
    if (!tourCompleted) {
      // Slight delay to ensure page has fully loaded
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [tourKey]);
  
  // Function to manually show the tour
  const startTour = () => {
    // Remove the completed flag to allow the tour to run again
    localStorage.removeItem(tourKey);
    setShowTour(true);
  };
  
  // Function to end the tour
  const endTour = () => {
    localStorage.setItem(tourKey, 'true');
    setShowTour(false);
  };
  
  // Function to reset tour (remove from localStorage)
  const resetTour = () => {
    localStorage.removeItem(tourKey);
  };
  
  return {
    showTour,
    startTour,
    endTour,
    resetTour
  };
}