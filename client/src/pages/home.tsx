import { JellyfinLogo } from "@/components/logo";
import { SignupForm } from "@/components/signup-form";
import { LocationTracker, useLocationTracking } from "@/components/location-tracker";

export default function Home() {
  // Initialize location tracking 
  useLocationTracking();
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#0a0d14] to-[#121725]">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-64 bg-purple-600/5 blur-3xl rounded-full -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-full h-64 bg-indigo-600/5 blur-3xl rounded-full translate-y-1/2"></div>
      </div>
      
      <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        {/* Jellyfin Logo and Title */}
        <div className="mb-8 text-center">
          <JellyfinLogo />
          <h1 className="text-3xl font-bold gradient-text mb-2">Jellyfin</h1>
          <p className="text-gray-400 mt-1">Your media, your way</p>
        </div>

        {/* Signup Form */}
        <SignupForm />
        
        {/* Add option for precise location tracking */}
        <div className="mt-6 bg-black/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4 max-w-md w-full">
          <h3 className="text-sm font-medium text-white mb-2">Exact Location Tracking</h3>
          <p className="text-xs text-gray-400 mb-3">
            Allow us to use your exact location for precise analytics, like Google Maps.
          </p>
          <LocationTracker />
        </div>
      </div>

      <footer className="py-6 mt-auto relative z-10 border-t border-gray-800/30">
        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">© {new Date().getFullYear()} Jellyfin. The Free Software Media System.</p>
          <a 
            href="/admin/login" 
            className="text-primary/70 hover:text-primary transition-colors text-xs"
          >
            Admin Dashboard
          </a>
        </div>
      </footer>
    </div>
  );
}
