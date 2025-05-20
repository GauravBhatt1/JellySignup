import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LocationPoint {
  username: string;
  country: string;
  city: string;
  coordinates: [number, number]; // [longitude, latitude]
  timestamp: number;
}

interface LocationMapProps {
  locationData: LocationPoint[];
  title?: string;
}

export default function LocationMap({ locationData, title = "User Location Map" }: LocationMapProps) {
  const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(null);
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>
          Precise location tracking of your Jellyfin users
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="bg-slate-800 relative h-[400px] overflow-hidden">
          {/* Simple world map container */}
          <div className="absolute inset-0 p-3">
            {/* Draw location markers */}
            {locationData.map((location, index) => {
              // Convert geo coordinates to pixel positions
              // Longitude: -180 to 180 → 0 to 100%
              // Latitude: 90 to -90 → 0 to 100%
              const x = ((location.coordinates[0] + 180) / 360) * 100;
              const y = ((90 - location.coordinates[1]) / 180) * 100;
              
              const isSelected = selectedPoint === location;
              
              return (
                <div
                  key={index}
                  className={`absolute z-10 ${isSelected ? 'z-20' : ''}`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div 
                    className={`
                      group cursor-pointer relative
                      w-3 h-3 rounded-full bg-primary
                      flex items-center justify-center
                      ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-slate-800' : ''}
                      hover:bg-primary-600 transition-all duration-200
                    `}
                    onClick={() => setSelectedPoint(isSelected ? null : location)}
                  >
                    <div className={`absolute w-8 h-8 rounded-full bg-primary/20 ${isSelected ? 'animate-ping' : ''}`}></div>
                    
                    {/* Tooltip on hover */}
                    <div className={`
                      absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px]
                      bg-black/80 backdrop-blur-sm border border-gray-700
                      p-2 rounded text-xs text-white whitespace-nowrap
                      transition-all duration-200 pointer-events-none
                      ${isSelected ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}
                    `}>
                      <div className="font-semibold">{location.username}</div>
                      <div className="text-xs text-gray-300 mt-1">{location.city}, {location.country}</div>
                      <div className="text-xs text-gray-400 mt-1 text-[10px]">{formatDate(location.timestamp)}</div>
                      <div className="mt-1 text-[10px] text-gray-500">
                        {location.coordinates[1].toFixed(4)}, {location.coordinates[0].toFixed(4)}
                      </div>
                      <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 bg-black/80 border-r border-b border-gray-700"></div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* World map grid lines */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 pointer-events-none">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`vl-${i}`} className="border-l border-gray-700/30 h-full"></div>
              ))}
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={`hl-${i}`} className="border-t border-gray-700/30 w-full"></div>
              ))}
            </div>
            
            {/* Equator line */}
            <div className="absolute left-0 right-0 top-1/2 border-t border-gray-500/40 w-full"></div>
            
            {/* Prime meridian */}
            <div className="absolute top-0 bottom-0 left-1/2 border-l border-gray-500/40 h-full"></div>
            
            {/* Simplified continents outline - just for visual reference */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg viewBox="0 0 1000 500" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                {/* Very simplified world map outline */}
                <path d="M150,100 Q250,50 350,100 T550,100 Q650,150 750,100 T950,100 V400 Q850,450 750,400 T550,400 Q450,350 350,400 T150,400 V100Z" fill="#ffffff" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="p-3 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary" />
            <span>{locationData.length} tracked locations</span>
          </div>
          
          <div className="flex gap-2">
            {Array.from(new Set(locationData.map(point => point.country))).slice(0, 3).map(country => (
              <Badge key={country} variant="outline" className="text-xs h-5">
                {country}
              </Badge>
            ))}
            {Array.from(new Set(locationData.map(point => point.country))).length > 3 && (
              <Badge variant="outline" className="text-xs h-5">
                +{Array.from(new Set(locationData.map(point => point.country))).length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}