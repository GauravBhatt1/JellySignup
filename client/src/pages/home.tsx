import { JellyfinLogo } from "@/components/logo";
import { SignupForm } from "@/components/signup-form";
import { Film, Tv, Music, Book, Users, Server } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#0a0d14] to-[#121725]">
      {/* Enhanced decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-64 bg-purple-600/10 blur-3xl rounded-full -translate-y-1/2"></div>
        <div className="absolute top-0 right-0 w-full h-64 bg-blue-600/10 blur-3xl rounded-full -translate-y-1/3"></div>
        <div className="absolute bottom-0 right-0 w-full h-64 bg-indigo-600/10 blur-3xl rounded-full translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-full h-64 bg-violet-600/10 blur-3xl rounded-full translate-y-1/3"></div>
        
        {/* Animated particles */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i}
              className="animate-floating absolute rounded-full"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                background: `rgba(${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, 255, 0.5)`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 10 + 15}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>
      </div>
      
      <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        {/* Enhanced Jellyfin Logo and Title */}
        <div className="mb-8 text-center">
          <JellyfinLogo className="mb-4 transform hover:scale-105 transition-transform" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent mb-3">
            Jellyfin
          </h1>
          <p className="text-gray-300 text-lg mt-2 max-w-md mx-auto">
            Your media, your server, your way
          </p>
        </div>

        {/* Features highlight */}
        <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
          <div className="bg-black/20 backdrop-blur-sm border border-gray-800/30 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/30 transition">
            <Film className="text-blue-400 mb-2 h-7 w-7" />
            <h3 className="text-white text-sm font-medium">Movies</h3>
          </div>
          <div className="bg-black/20 backdrop-blur-sm border border-gray-800/30 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/30 transition">
            <Tv className="text-purple-400 mb-2 h-7 w-7" />
            <h3 className="text-white text-sm font-medium">TV Shows</h3>
          </div>
          <div className="bg-black/20 backdrop-blur-sm border border-gray-800/30 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/30 transition">
            <Music className="text-green-400 mb-2 h-7 w-7" />
            <h3 className="text-white text-sm font-medium">Music</h3>
          </div>
          <div className="bg-black/20 backdrop-blur-sm border border-gray-800/30 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/30 transition">
            <Book className="text-amber-400 mb-2 h-7 w-7" />
            <h3 className="text-white text-sm font-medium">Books</h3>
          </div>
          <div className="bg-black/20 backdrop-blur-sm border border-gray-800/30 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/30 transition">
            <Users className="text-pink-400 mb-2 h-7 w-7" />
            <h3 className="text-white text-sm font-medium">Family Sharing</h3>
          </div>
          <div className="bg-black/20 backdrop-blur-sm border border-gray-800/30 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/30 transition">
            <Server className="text-cyan-400 mb-2 h-7 w-7" />
            <h3 className="text-white text-sm font-medium">Self-hosted</h3>
          </div>
        </div>

        {/* Signup Form */}
        <SignupForm />
      </div>

      <footer className="py-6 mt-auto relative z-10 border-t border-gray-800/30">
        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">© {new Date().getFullYear()} Jellyfin. The Free Software Media System.</p>
          <div className="flex justify-center gap-4 my-3">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">About</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
            <a 
              href="/admin/login" 
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Admin Dashboard
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
