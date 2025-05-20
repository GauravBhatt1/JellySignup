import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define tour step interface
interface TourStep {
  target: string;  // CSS selector for the element to highlight
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

// Styles for the various tour elements
const styles = {
  overlay: "fixed inset-0 bg-black/70 z-50 transition-opacity duration-300",
  spotlight: "absolute rounded-lg transition-all duration-300 ease-in-out pointer-events-none box-content",
  spotlightBorder: "absolute rounded-lg transition-all duration-300 ease-in-out pointer-events-none box-content border-2 border-primary animate-pulse",
  tooltipContainer: "absolute z-50 w-80 max-w-[calc(100vw-40px)] bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl p-4 transition-opacity duration-200",
  tooltipTitle: "text-lg font-semibold text-white mb-2",
  tooltipContent: "text-gray-300 mb-4",
  navigationButtons: "flex justify-between items-center mt-2",
  closeButton: "absolute top-2 right-2 text-gray-400 hover:text-white cursor-pointer",
};

// Calculate position for tooltip based on element and placement
const calculateTooltipPosition = (
  elementRect: DOMRect, 
  placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom',
  tooltipWidth: number = 320,
  tooltipHeight: number = 150,
) => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  let top: number;
  let left: number;
  
  switch (placement) {
    case 'top':
      top = elementRect.top - tooltipHeight - 12;
      left = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
      // Adjust if off screen
      if (top < 10) placement = 'bottom';
      break;
    case 'bottom':
      top = elementRect.bottom + 12;
      left = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
      // Adjust if off screen
      if (top + tooltipHeight > windowHeight - 10) placement = 'top';
      break;
    case 'left':
      top = elementRect.top + (elementRect.height / 2) - (tooltipHeight / 2);
      left = elementRect.left - tooltipWidth - 12;
      // Adjust if off screen
      if (left < 10) placement = 'right';
      break;
    case 'right':
      top = elementRect.top + (elementRect.height / 2) - (tooltipHeight / 2);
      left = elementRect.right + 12;
      // Adjust if off screen
      if (left + tooltipWidth > windowWidth - 10) placement = 'left';
      break;
    default:
      top = elementRect.bottom + 12;
      left = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
  }
  
  // Final adjustments to keep tooltip on screen
  top = Math.max(10, Math.min(windowHeight - tooltipHeight - 10, top));
  left = Math.max(10, Math.min(windowWidth - tooltipWidth - 10, left));

  return { top, left, placement };
};

interface TourGuideProps {
  steps: TourStep[];
  onComplete: () => void;
  isOpen: boolean; 
  tourKey?: string; // Key to save in localStorage
}

export function TourGuide({ 
  steps, 
  onComplete, 
  isOpen, 
  tourKey = "jellyfin-signup-tour-completed" 
}: TourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, placement: 'bottom' as 'top' | 'bottom' | 'left' | 'right' });
  const [spotlightStyle, setSpotlightStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    opacity: 0
  });
  
  // Check if tour has been completed before
  useEffect(() => {
    if (!isOpen) return;
    
    const tourCompleted = localStorage.getItem(tourKey) === 'true';
    if (tourCompleted) {
      setIsVisible(false);
      return;
    }
    
    setIsVisible(true);
    updateSpotlight();
    
    // Add window resize listener
    window.addEventListener('resize', updateSpotlight);
    return () => {
      window.removeEventListener('resize', updateSpotlight);
    };
  }, [isOpen, tourKey]);
  
  // Update spotlight when step changes
  useEffect(() => {
    if (!isVisible) return;
    updateSpotlight();
  }, [currentStep, isVisible]);
  
  // Update spotlight position based on current step
  const updateSpotlight = () => {
    if (!isVisible || currentStep >= steps.length) return;
    
    const step = steps[currentStep];
    const element = document.querySelector(step.target);
    
    if (!element) {
      console.error(`Tour guide target not found: ${step.target}`);
      return;
    }
    
    const rect = element.getBoundingClientRect();
    const padding = 8; // Padding around the spotlight element
    
    setSpotlightStyle({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + (padding * 2),
      height: rect.height + (padding * 2),
      opacity: 1
    });
    
    // Position the tooltip
    const tooltipSize = { width: 320, height: 150 };
    const position = calculateTooltipPosition(
      rect, 
      step.placement || 'bottom', 
      tooltipSize.width, 
      tooltipSize.height
    );
    setTooltipPosition(position);
  };
  
  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Complete the tour
  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem(tourKey, 'true');
    onComplete();
  };
  
  // Skip the tour
  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem(tourKey, 'true');
    onComplete();
  };
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <>
      {/* Dark overlay */}
      <div className={styles.overlay}>
        {/* Spotlight */}
        <div 
          className={styles.spotlight} 
          style={{
            top: spotlightStyle.top,
            left: spotlightStyle.left,
            width: spotlightStyle.width,
            height: spotlightStyle.height,
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.75)`,
          }}
        />
        
        {/* Animated border around spotlight */}
        <div
          className={styles.spotlightBorder}
          style={{
            top: spotlightStyle.top - 4,
            left: spotlightStyle.left - 4, 
            width: spotlightStyle.width + 8,
            height: spotlightStyle.height + 8,
          }}
        />
        
        {/* Tooltip */}
        <div 
          className={styles.tooltipContainer}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {/* Close button */}
          <button 
            onClick={handleSkip} 
            className={styles.closeButton}
            aria-label="Close tour"
          >
            <X size={18} />
          </button>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-1 mb-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentStep 
                    ? "w-4 bg-primary" 
                    : "w-2 bg-gray-600"
                }`}
              />
            ))}
          </div>
          
          <h3 className={styles.tooltipTitle}>
            {currentStep + 1}. {steps[currentStep]?.title}
          </h3>
          <p className={styles.tooltipContent}>
            {steps[currentStep]?.content}
          </p>
          
          <div className={styles.navigationButtons}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              className="border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/70"
            >
              Skip Tour
            </Button>
            
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  className="border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/70"
                >
                  Previous
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}