// Exporting SVG for favicon use
export const JellyfinSvgIcon = () => (
  <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm-33.9 400V112l160 144-160 144z" 
      fill="#ffffff"
    />
  </svg>
);

export function JellyfinLogo() {
  return (
    <div className="flex flex-col items-center justify-center mb-8">
      <div className="relative w-24 h-24 mb-2">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full opacity-30 blur-xl"></div>
        <div className="relative flex items-center justify-center w-full h-full bg-[#1c1c4e]/60 backdrop-blur-sm rounded-full border border-indigo-800/40">
          <svg width="60" height="60" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm-33.9 400V112l160 144-160 144z" 
              className="fill-white"
            />
          </svg>
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Jellyfin</h1>
        <p className="text-gray-400 text-sm">Your media, your way</p>
      </div>
    </div>
  );
}
