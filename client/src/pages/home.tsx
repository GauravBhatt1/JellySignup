import { JellyfinLogo } from "@/components/logo";
import { SignupForm } from "@/components/signup-form";

export default function Home() {
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

        {/* Login link */}
        <div className="mt-6 text-center text-sm text-gray-300">
          Already have an account?{" "}
          <a 
            href="#" 
            className="text-primary hover:text-primary/80 font-medium ml-1 transition-colors"
          >
            Sign in
          </a>
        </div>
      </div>

      <footer className="py-6 mt-auto relative z-10 border-t border-gray-800/30">
        <div className="text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Jellyfin. The Free Software Media System.</p>
        </div>
      </footer>
    </div>
  );
}
