import { JellyfinLogo } from "@/components/logo";
import { SignupForm } from "@/components/signup-form";
import { DynamicBackground } from "@/components/dynamic-background";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Dynamic background with movie posters */}
      <DynamicBackground />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-64 bg-purple-600/5 blur-3xl rounded-full -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-full h-64 bg-indigo-600/5 blur-3xl rounded-full translate-y-1/2"></div>
      </div>
      
      <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        {/* Jellyfin Logo and Title */}
        <div className="mb-8 text-center">
          <JellyfinLogo />
        </div>

        {/* Signup Form */}
        <SignupForm />
      </div>

      <footer className="py-6 mt-auto relative z-10 border-t border-gray-800/30">
        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">© {new Date().getFullYear()} Jellyfin. The Free Software Media System.</p>
          <div className="inline-block">
            <a 
              href="/admin/login" 
              className="text-gray-400 hover:text-primary transition-colors text-xs no-underline"
            >
              Admin Dashboard
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
