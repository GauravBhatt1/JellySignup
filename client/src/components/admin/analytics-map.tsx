import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Globe, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Visitor location data interface
interface VisitorLocation {
  ip: string;
  username: string;
  coordinates: [number, number]; // [longitude, latitude]
  city: string;
  country: string;
  timestamp: number;
}

interface AnalyticsMapProps {
  visitorData: VisitorLocation[];
  title?: string;
  showZoom?: boolean;
}

// Map dimensions
const MAP_WIDTH = 800;
const MAP_HEIGHT = 400;

// Convert coordinates to pixel position on the map
function coordsToPixels(
  coords: [number, number], 
  zoom: number = 1,
  center: [number, number] = [0, 0]
): [number, number] {
  // Map projection: Simple equirectangular projection
  const [lon, lat] = coords;
  
  // Adjust for zoom and center offset
  const x = ((lon + 180) / 360) * MAP_WIDTH * zoom + (MAP_WIDTH / 2) * (1 - zoom) - (center[0] + 180) / 360 * MAP_WIDTH * (zoom - 1);
  const y = ((90 - lat) / 180) * MAP_HEIGHT * zoom + (MAP_HEIGHT / 2) * (1 - zoom) - (90 - center[1]) / 180 * MAP_HEIGHT * (zoom - 1);
  
  return [x, y];
}

const AnalyticsMap: React.FC<AnalyticsMapProps> = ({
  visitorData,
  title = "User Activity Map",
  showZoom = true
}) => {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [selectedMarker, setSelectedMarker] = useState<VisitorLocation | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number]>([0, 0]);
  
  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Group markers by location to prevent overlapping
  const groupedMarkers: Record<string, VisitorLocation[]> = {};
  
  visitorData.forEach(visitor => {
    if (!visitor.coordinates) return;
    
    const key = `${visitor.coordinates[0].toFixed(2)},${visitor.coordinates[1].toFixed(2)}`;
    if (!groupedMarkers[key]) {
      groupedMarkers[key] = [];
    }
    groupedMarkers[key].push(visitor);
  });
  
  // Handle map drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart([e.clientX, e.clientY]);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = (e.clientX - dragStart[0]) / (MAP_WIDTH * zoom) * 360;
    const dy = (e.clientY - dragStart[1]) / (MAP_HEIGHT * zoom) * 180;
    
    setCenter([
      Math.max(-180, Math.min(180, center[0] - dx)),
      Math.max(-90, Math.min(90, center[1] + dy))
    ]);
    
    setDragStart([e.clientX, e.clientY]);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const zoomIn = () => {
    setZoom(Math.min(zoom + 0.5, 4));
  };
  
  const zoomOut = () => {
    setZoom(Math.max(zoom - 0.5, 1));
  };
  
  return (
    <Card className="border border-gray-800 bg-gray-900/40 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>
              Tracking user locations with precise coordinates
            </CardDescription>
          </div>
          
          {showZoom && (
            <div className="flex">
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 w-8 p-0 rounded-r-none"
                onClick={zoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 w-8 p-0 rounded-l-none border-l-0"
                onClick={zoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div 
          className="relative w-full h-[400px] overflow-hidden bg-[#081c33] rounded-md"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {/* Simple world map grid */}
          <div className="absolute inset-0">
            {/* Grid lines for longitude */}
            {Array.from({ length: 18 }).map((_, i) => {
              const lon = -180 + i * 20;
              const [x] = coordsToPixels([lon, 0], zoom, center);
              return (
                <div 
                  key={`lon-${i}`}
                  className="absolute h-full w-[1px] bg-gray-800/30"
                  style={{ left: `${x}px` }}
                ></div>
              );
            })}
            
            {/* Grid lines for latitude */}
            {Array.from({ length: 9 }).map((_, i) => {
              const lat = -80 + i * 20;
              const [, y] = coordsToPixels([0, lat], zoom, center);
              return (
                <div 
                  key={`lat-${i}`}
                  className="absolute w-full h-[1px] bg-gray-800/30"
                  style={{ top: `${y}px` }}
                ></div>
              );
            })}
            
            {/* Equator line (highlighted) */}
            {(() => {
              const [, equator] = coordsToPixels([0, 0], zoom, center);
              return (
                <div 
                  className="absolute w-full h-[1px] bg-gray-600/50"
                  style={{ top: `${equator}px` }}
                ></div>
              );
            })()}
            
            {/* Prime meridian (highlighted) */}
            {(() => {
              const [meridian] = coordsToPixels([0, 0], zoom, center);
              return (
                <div 
                  className="absolute h-full w-[1px] bg-gray-600/50"
                  style={{ left: `${meridian}px` }}
                ></div>
              );
            })()}
          </div>
          
          {/* Render markers for each location group */}
          {Object.entries(groupedMarkers).map(([key, visitors], idx) => {
            const [longitude, latitude] = visitors[0].coordinates;
            try {
              // Skip if coordinates are invalid
              if (isNaN(longitude) || isNaN(latitude)) {
                return null;
              }
              
              const [x, y] = coordsToPixels([longitude, latitude], zoom, center);
              
              // Skip if marker is outside viewport
              if (x < -20 || x > MAP_WIDTH + 20 || y < -20 || y > MAP_HEIGHT + 20) {
                return null;
              }
              
              const count = visitors.length;
              const size = Math.max(5, Math.min(15, 5 + Math.log2(count) * 2));
              const isSelected = selectedMarker && selectedMarker.coordinates[0] === longitude && selectedMarker.coordinates[1] === latitude;
              
              return (
                <div 
                  key={`marker-${idx}`}
                  className={`absolute cursor-pointer transition-all duration-300 ease-out ${isSelected ? 'z-10' : 'z-0'}`}
                  style={{ 
                    left: `${x - size/2}px`,
                    top: `${y - size/2}px`,
                    width: `${size}px`,
                    height: `${size}px`,
                    transform: `scale(${isSelected ? 1.5 : 1})`
                  }}
                  onClick={() => setSelectedMarker(visitors[0])}
                >
                  {/* Pulse animation for markers */}
                  <div className={`absolute inset-0 rounded-full bg-primary/30 ${isSelected ? 'animate-ping' : ''}`}></div>
                  
                  {/* Main marker dot */}
                  <div 
                    className={`absolute inset-0 rounded-full bg-primary border border-white/20 flex items-center justify-center text-[8px] font-bold text-white
                                ${isSelected ? 'ring-2 ring-primary/50' : ''}`}
                  >
                    {count > 1 && count}
                  </div>
                </div>
              );
            } catch (error) {
              console.error(`Error rendering marker for ${key}:`, error);
              return null;
            }
          })}
          
          {/* Show tooltip for selected marker */}
          {selectedMarker && (
            <div 
              className="absolute z-20 bg-gray-900/90 backdrop-blur-sm border border-primary/30 p-2 rounded-md shadow-lg text-sm"
              style={{ 
                left: coordsToPixels(selectedMarker.coordinates, zoom, center)[0] + 15,
                top: coordsToPixels(selectedMarker.coordinates, zoom, center)[1] - 15,
                maxWidth: '200px'
              }}
            >
              <div className="text-white font-medium">{selectedMarker.username}</div>
              <div className="text-gray-300 text-xs">
                <div>{selectedMarker.city}, {selectedMarker.country}</div>
                <div className="text-gray-400 mt-1">{formatDate(selectedMarker.timestamp)}</div>
                <div className="text-gray-500 text-[10px] mt-1">
                  [{selectedMarker.coordinates[1].toFixed(4)}, {selectedMarker.coordinates[0].toFixed(4)}]
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Map stats */}
        <div className="mt-2 px-1 flex justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <MapPin className="h-3 w-3 text-primary mr-1" />
            <span>{Object.keys(groupedMarkers).length} unique locations</span>
          </div>
          <div>{visitorData.length} total data points</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsMap;