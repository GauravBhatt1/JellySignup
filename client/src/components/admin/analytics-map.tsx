import React, { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from "react-simple-maps";
import { MapPin } from 'lucide-react';

// World map topology path (simplified for faster loading)
const geoUrl = "/worldmap.json";

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

const AnalyticsMap: React.FC<AnalyticsMapProps> = ({
  visitorData,
  title = "User Activity Map",
  showZoom = true
}) => {
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{x: number, y: number} | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<VisitorLocation | null>(null);
  const [zoom, setZoom] = useState(1);
  
  // Format the timestamp to a readable date/time
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // When a marker is clicked, show detailed information
  const handleMarkerClick = (visitor: VisitorLocation, event: React.MouseEvent) => {
    setSelectedMarker(visitor);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    
    const tooltipHtml = `
      <strong>${visitor.username}</strong><br/>
      ${visitor.city}, ${visitor.country}<br/>
      ${formatDate(visitor.timestamp)}
    `;
    
    setTooltipContent(tooltipHtml);
  };
  
  // Close the tooltip when clicking anywhere else
  const handleMapClick = () => {
    setSelectedMarker(null);
    setTooltipContent(null);
  };
  
  // Group markers by location (to prevent overlapping)
  const groupedMarkers: Record<string, VisitorLocation[]> = {};
  
  visitorData.forEach(visitor => {
    const key = `${visitor.coordinates[0].toFixed(2)},${visitor.coordinates[1].toFixed(2)}`;
    if (!groupedMarkers[key]) {
      groupedMarkers[key] = [];
    }
    groupedMarkers[key].push(visitor);
  });
  
  return (
    <div className="relative">
      {title && (
        <h3 className="text-lg font-medium mb-2 text-gray-200">{title}</h3>
      )}
      
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden">
        <div 
          className="relative h-[300px] md:h-[400px] lg:h-[500px]"
          onClick={handleMapClick}
        >
          <ComposableMap
            projection="geoEqualEarth"
            className="w-full h-full"
          >
            <ZoomableGroup
              zoom={zoom}
              center={[0, 0]}
              onMoveEnd={({ zoom }) => setZoom(zoom)}
            >
              {/* World map background */}
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#1e293b"
                      stroke="#334155"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', fill: '#293548' },
                        pressed: { outline: 'none' }
                      }}
                    />
                  ))
                }
              </Geographies>
              
              {/* Group markers by location */}
              {Object.entries(groupedMarkers).map(([key, visitors]) => {
                const [longitude, latitude] = visitors[0].coordinates;
                const count = visitors.length;
                
                // Calculate marker size based on visitor count
                const size = Math.max(5, Math.min(15, 5 + Math.log2(count) * 3));
                
                return (
                  <Marker 
                    key={key} 
                    coordinates={[longitude, latitude]}
                    onClick={(e) => handleMarkerClick(visitors[0], e)}
                  >
                    <g
                      transform={`translate(-${size/2}, -${size/2})`}
                      className="cursor-pointer"
                    >
                      {/* Glowing effect for marker */}
                      <circle 
                        cx={size/2} 
                        cy={size/2} 
                        r={size} 
                        fill="#8b5cf6" 
                        opacity={0.2} 
                      />
                      {/* Main marker circle */}
                      <circle 
                        cx={size/2} 
                        cy={size/2} 
                        r={size/2} 
                        fill="#8b5cf6" 
                        stroke="#1e293b"
                        strokeWidth={1} 
                      />
                      {/* Show visitor count if more than 1 */}
                      {count > 1 && (
                        <text 
                          textAnchor="middle" 
                          y={size/2 + 1} 
                          x={size/2} 
                          style={{ 
                            fill: "white", 
                            fontSize: size/2, 
                            fontWeight: "bold",
                            dominantBaseline: "middle"
                          }}
                        >
                          {count}
                        </text>
                      )}
                    </g>
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
          
          {/* Tooltip for marker details */}
          {tooltipContent && tooltipPosition && (
            <div 
              className="fixed z-10 bg-gray-900/90 backdrop-blur-sm border border-primary/30 p-2 rounded-md shadow-lg text-sm"
              style={{
                left: `${tooltipPosition.x + 15}px`,
                top: `${tooltipPosition.y - 15}px`,
                maxWidth: '200px'
              }}
              dangerouslySetInnerHTML={{ __html: tooltipContent }}
            />
          )}
        </div>
      </div>
      
      {/* Zoom controls */}
      {showZoom && (
        <div className="absolute bottom-3 right-3 flex bg-gray-900/80 backdrop-blur-sm rounded-md border border-gray-800">
          <button 
            className="px-2 py-1 text-gray-400 hover:text-white"
            onClick={() => setZoom(Math.min(zoom + 0.5, 4))}
          >
            +
          </button>
          <div className="border-r border-gray-800 h-full"></div>
          <button 
            className="px-2 py-1 text-gray-400 hover:text-white"
            onClick={() => setZoom(Math.max(zoom - 0.5, 1))}
          >
            -
          </button>
        </div>
      )}
      
      {/* Legend */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center">
          <MapPin className="h-3 w-3 text-primary mr-1" />
          <span>User locations</span>
        </div>
        <div>
          {visitorData.length} locations • {Object.keys(groupedMarkers).length} unique points
        </div>
      </div>
    </div>
  );
};

export default AnalyticsMap;