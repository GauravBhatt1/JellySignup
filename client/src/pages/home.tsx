import { useState, useEffect } from "react";
import { JellyfinLogo } from "@/components/logo";
import { SignupForm } from "@/components/signup-form";
import { TourGuide } from "@/components/tour-guide";
import { useTourGuide } from "@/hooks/use-tour-guide";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export default function Home() {
  const { showTour, startTour, endTour } = useTourGuide("jellyfin-signup-tour");
  const [signupFormRef, setSignupFormRef] = useState<HTMLDivElement | null>(null);

  // Tour steps
  const tourSteps = [
    {
      target: '[data-tour="logo"]',
      title: "Welcome to Jellyfin",
      content: "This is your Jellyfin signup portal. Create an account to access your media library anywhere.",
      placement: "bottom" as const,
    },
    {
      target: '[data-tour="username"]',
      title: "Choose a Username",
      content: "Enter a unique username that you'll use to log in to your Jellyfin account.",
      placement: "right" as const,
    },
    {
      target: '[data-tour="password"]',
      title: "Create a Strong Password",
      content: "Your password should be secure. The strength indicator will help you create a strong one.",
      placement: "right" as const,
    },
    {
      target: '[data-tour="password-strength"]',
      title: "Password Strength",
      content: "This indicates how secure your password is. Aim for at least medium strength for better security.",
      placement: "top" as const,
    },
    {
      target: '[data-tour="submit-button"]',
      title: "Create Your Account",
      content: "Click here when you're ready to create your Jellyfin account and start enjoying your media.",
      placement: "top" as const,
    },
    {
      target: '[data-tour="admin-link"]',
      title: "Admin Access",
      content: "Jellyfin administrators can access the admin dashboard from this link using their Jellyfin admin credentials.",
      placement: "top" as const,
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#0a0d14] to-[#121725]">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-64 bg-purple-600/5 blur-3xl rounded-full -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-full h-64 bg-indigo-600/5 blur-3xl rounded-full translate-y-1/2"></div>
      </div>
      
      <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        {/* Help Button */}
        <div className="absolute top-4 right-4">
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8 bg-gray-900/50 border border-gray-700/50 hover:bg-gray-800/70"
            onClick={startTour}
            title="Show help tour"
          >
            <HelpCircle className="h-4 w-4 text-primary/70" />
          </Button>
        </div>
        
        {/* Jellyfin Logo and Title */}
        <div className="mb-8 text-center" data-tour="logo">
          <JellyfinLogo />
          <h1 className="text-3xl font-bold gradient-text mb-2">Jellyfin</h1>
          <p className="text-gray-400 mt-1">Your media, your way</p>
        </div>

        {/* Signup Form */}
        <div ref={setSignupFormRef}>
          <SignupForm />
        </div>
      </div>

      <footer className="py-6 mt-auto relative z-10 border-t border-gray-800/30">
        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">© {new Date().getFullYear()} Jellyfin. The Free Software Media System.</p>
          <a 
            href="/admin/login" 
            className="text-primary/70 hover:text-primary transition-colors text-xs"
            data-tour="admin-link"
          >
            Admin Dashboard
          </a>
        </div>
      </footer>

      {/* Tour Guide */}
      <TourGuide 
        steps={tourSteps}
        isOpen={showTour}
        onComplete={endTour}
      />
    </div>
  );
}
