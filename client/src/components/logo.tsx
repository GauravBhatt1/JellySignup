import { Play } from "lucide-react";

export function JellyfinLogo() {
  return (
    <div className="flex items-center justify-center mb-4">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur-xl opacity-70"></div>
        <div className="relative bg-gray-900 rounded-full p-3">
          <Play className="h-16 w-16 fill-primary stroke-primary" />
        </div>
      </div>
    </div>
  );
}
