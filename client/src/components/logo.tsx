// Exporting official Jellyfin SVG for favicon use
export const JellyfinSvgIcon = () => (
  <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M358.87,511.3H153.13a34.56,34.56,0,0,1-34.52-34.52V34.52A34.56,34.56,0,0,1,153.13,0H358.87a34.56,34.56,0,0,1,34.52,34.52V476.78A34.56,34.56,0,0,1,358.87,511.3ZM256,374.09a118.08,118.08,0,0,0,118-118h0V137.22A118.08,118.08,0,0,0,256,19.13h0a118.08,118.08,0,0,0-118,118.09H138V256.09A118.08,118.08,0,0,0,256,374.09ZM202.33,256a53.67,53.67,0,1,0,53.67-53.67A53.72,53.72,0,0,0,202.33,256Z" 
      fill="#00A4DC"
    />
  </svg>
);

export function JellyfinLogo() {
  return (
    <div className="flex flex-col items-center justify-center mb-8">
      <div className="relative w-28 h-28 mb-3">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00A4DC]/50 to-[#aa5cc3]/50 rounded-full opacity-30 blur-xl"></div>
        <div className="relative flex items-center justify-center w-full h-full bg-[#1c1c4e]/60 backdrop-blur-sm rounded-full border border-[#00A4DC]/30">
          {/* Official Jellyfin Logo */}
          <svg width="65" height="65" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M358.87,511.3H153.13a34.56,34.56,0,0,1-34.52-34.52V34.52A34.56,34.56,0,0,1,153.13,0H358.87a34.56,34.56,0,0,1,34.52,34.52V476.78A34.56,34.56,0,0,1,358.87,511.3ZM256,374.09a118.08,118.08,0,0,0,118-118h0V137.22A118.08,118.08,0,0,0,256,19.13h0a118.08,118.08,0,0,0-118,118.09H138V256.09A118.08,118.08,0,0,0,256,374.09ZM202.33,256a53.67,53.67,0,1,0,53.67-53.67A53.72,53.72,0,0,0,202.33,256Z" 
              fill="#00A4DC"
            />
          </svg>
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#00A4DC]">Jellyfin</h1>
        <p className="text-gray-400 text-sm">Your media, your way</p>
      </div>
    </div>
  );
}
