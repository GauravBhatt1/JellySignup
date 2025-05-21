// Exporting favicon version with Jellyfin official colors
export const JellyfinSvgIcon = () => (
  <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm-33.9 400V112l160 144-160 144z" 
      fill="#00A4DC"
    />
  </svg>
);

// Using the direct link to the official Jellyfin logo
export function JellyfinLogo() {
  return (
    <div className="flex flex-col items-center justify-center mb-8">
      <div className="relative h-32 mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00A4DC]/30 to-[#aa5cc3]/30 rounded-full opacity-30 blur-xl"></div>
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Using the exact official Jellyfin Logo from jellyfin.org */}
          <div className="w-full max-w-[320px] h-20 flex items-center justify-center">
            <img 
              src="https://jellyfin.org/images/logo.svg" 
              alt="Jellyfin Official Logo"
              className="h-16 w-auto"
            />
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-400 text-sm">Your media, your way</p>
      </div>
    </div>
  );
}
