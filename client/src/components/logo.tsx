export function JellyfinLogo() {
  // Official Jellyfin logo with correct colors
  return (
    <div className="flex flex-col items-center justify-center mb-6">
      <svg width="120" height="120" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm-33.9 400V112l160 144-160 144z" 
          fill="#00a4dc" 
        />
      </svg>
      <div className="text-center mt-4">
        <h1 className="text-3xl font-bold text-[#00a4dc]">Jellyfin</h1>
        <p className="text-gray-400 text-sm">Your media, your way</p>
      </div>
    </div>
  );
}
