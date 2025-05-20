import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from "react-simple-maps";

// Map for coordinates by country code
const countryCoordinates: Record<string, [number, number]> = {
  "IN": [78.9629, 20.5937], // India
  "US": [-95.7129, 37.0902], // United States
  "UK": [-3.4359, 55.3781], // United Kingdom (actually GB)
  "GB": [-3.4359, 55.3781], // Great Britain 
  "CA": [-106.3468, 56.1304], // Canada
  "AU": [133.7751, -25.2744], // Australia
  "DE": [10.4515, 51.1657], // Germany
  "FR": [2.2137, 46.2276], // France
  "JP": [138.2529, 36.2048], // Japan
  "BR": [-51.9253, -14.2350], // Brazil
  "RU": [105.3188, 61.5240], // Russia
  "CN": [104.1954, 35.8617], // China
  "IT": [12.5674, 41.8719], // Italy
  "ES": [-3.7492, 40.4637], // Spain
  "MX": [-102.5528, 23.6345], // Mexico
  "ZA": [22.9375, -30.5595], // South Africa
  "ID": [113.9213, -0.7893], // Indonesia
  "KR": [127.9785, 35.9078], // South Korea
  "TR": [35.2433, 38.9637], // Turkey
  "AR": [-63.6167, -38.4161], // Argentina
  "NL": [5.2913, 52.1326], // Netherlands
  "CH": [8.2275, 46.8182], // Switzerland
  "SE": [18.6435, 60.1282], // Sweden
  "PL": [19.1451, 51.9194], // Poland
  "BE": [4.4699, 50.5039], // Belgium
  "NO": [8.4689, 60.4720], // Norway
  "AT": [14.5501, 47.5162], // Austria
  "FI": [25.7482, 61.9241], // Finland
  "NZ": [174.8860, -40.9006], // New Zealand
  "GR": [21.8243, 39.0742], // Greece
  "PT": [-8.2245, 39.3999], // Portugal
  "DK": [9.5018, 56.2639], // Denmark
  "IE": [-8.2439, 53.4129], // Ireland
  "SG": [103.8198, 1.3521], // Singapore
  "IL": [34.8516, 31.0461], // Israel
  "HK": [114.1095, 22.3964], // Hong Kong
  "CZ": [15.4729, 49.8175], // Czech Republic
  "AE": [53.8478, 23.4241], // UAE
  "TW": [120.9605, 23.6978], // Taiwan
  "MY": [101.9758, 4.2105], // Malaysia
  "TH": [100.9925, 15.8700], // Thailand
  "SA": [45.0792, 23.8859], // Saudi Arabia
  "HU": [19.5033, 47.1625], // Hungary
  "RO": [24.9668, 45.9432], // Romania
  "CL": [-71.5429, -35.6751], // Chile
  "CO": [-74.2973, 4.5709], // Colombia
  "PH": [121.7740, 12.8797], // Philippines
  "VN": [108.2772, 14.0583], // Vietnam
  "UA": [31.1656, 48.3794], // Ukraine
  "RS": [21.0059, 44.0165], // Serbia
  "BG": [25.4858, 42.7339], // Bulgaria
  "EG": [30.8025, 26.8206], // Egypt
  "PE": [-75.0152, -9.1900], // Peru
  "HR": [15.2000, 45.1000], // Croatia
  "LT": [23.8813, 55.1694], // Lithuania
  "LV": [24.6032, 56.8796], // Latvia
  "EE": [25.0136, 58.5953], // Estonia
  // Add more countries as needed
};

// City coordinates for major cities - we'll use these as a backup when country is all we have
const cityCoordinates: Record<string, [number, number]> = {
  "New York, US": [-74.0060, 40.7128],
  "Los Angeles, US": [-118.2437, 34.0522],
  "Chicago, US": [-87.6298, 41.8781],
  "London, GB": [-0.1278, 51.5074],
  "Berlin, DE": [13.4050, 52.5200],
  "Paris, FR": [2.3522, 48.8566],
  "Madrid, ES": [-3.7038, 40.4168],
  "Rome, IT": [12.4964, 41.9028],
  "Mumbai, IN": [72.8777, 19.0760],
  "Delhi, IN": [77.1025, 28.7041],
  "Beijing, CN": [116.4074, 39.9042],
  "Tokyo, JP": [139.6917, 35.6895],
  "Sydney, AU": [151.2093, -33.8688],
  "Rio de Janeiro, BR": [-43.1729, -22.9068],
  "Mexico City, MX": [-99.1332, 19.4326],
  "Cairo, EG": [31.2357, 30.0444],
  "Moscow, RU": [37.6173, 55.7558],
  "Toronto, CA": [-79.3832, 43.6532],
  "Vancouver, CA": [-123.1207, 49.2827],
  "Seoul, KR": [126.9780, 37.5665],
  "Amsterdam, NL": [4.9041, 52.3676],
  "Hong Kong": [114.1694, 22.3193],
  "Singapore": [103.8198, 1.3521],
  "Bangkok, TH": [100.5018, 13.7563],
  "Johannesburg, ZA": [28.0473, -26.2041],
  "São Paulo, BR": [-46.6333, -23.5505],
  "Dubai, AE": [55.2708, 25.2048],
  "Dublin, IE": [-6.2603, 53.3498],
  "Istanbul, TR": [28.9784, 41.0082],
  "Bangalore, IN": [77.5946, 12.9716],
  "Jakarta, ID": [106.8456, -6.2088],
  "Manila, PH": [120.9842, 14.5995],
  "Kuala Lumpur, MY": [101.6869, 3.1390],
  "Warsaw, PL": [21.0122, 52.2297],
  "Stockholm, SE": [18.0686, 59.3293],
  "Helsinki, FI": [24.9384, 60.1699],
  "Vienna, AT": [16.3738, 48.2082],
  "Prague, CZ": [14.4378, 50.0755],
  "Budapest, HU": [19.0402, 47.4979],
  "Athens, GR": [23.7275, 37.9838],
  "Lisbon, PT": [-9.1393, 38.7223],
  "Copenhagen, DK": [12.5683, 55.6761],
  "Brussels, BE": [4.3517, 50.8503],
  "Bucharest, RO": [26.1025, 44.4268],
  "Sofia, BG": [23.3219, 42.6977],
  "Zagreb, HR": [15.9819, 45.8150],
  "Belgrade, RS": [20.4612, 44.8125],
  "Riyadh, SA": [46.7219, 24.6877],
  "Kiev, UA": [30.5234, 50.4501],
  "Unknown": [0, 0] // Default for unknown locations
};

interface WorldMapProps {
  locationData: {
    country: string;
    city?: string;
    count: number;
  }[];
}

const WorldMap: React.FC<WorldMapProps> = ({ locationData }) => {
  // Create markers from location data
  const markers = locationData.map(location => {
    const countryCode = location.country; 
    const cityName = location.city ? `${location.city}, ${location.country}` : undefined;
    
    // Try to get coordinates in this order: exact city, then country
    let coordinates: [number, number] | undefined;
    
    if (cityName && cityCoordinates[cityName]) {
      coordinates = cityCoordinates[cityName];
    } else if (countryCoordinates[countryCode]) {
      coordinates = countryCoordinates[countryCode];
    } else {
      console.log(`No coordinates found for ${cityName || countryCode}`);
      return null; // Skip this location
    }
    
    if (!coordinates) return null;
    
    return {
      name: cityName || countryCode,
      coordinates,
      count: location.count
    };
  }).filter((marker): marker is {name: string; coordinates: [number, number]; count: number} => marker !== null);

  return (
    <div className="world-map-container">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{
          scale: 200,
          center: [0, 0]
        }}
        className="w-full h-[300px] md:h-[400px] lg:h-[500px]"
      >
        <Geographies geography="/worldmap.json">
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1f2937"
                stroke="#374151"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "#374151" },
                  pressed: { outline: "none" }
                }}
              />
            ))
          }
        </Geographies>
        
        {markers.map((marker, index) => (
          <Marker key={index} coordinates={marker.coordinates}>
            <circle 
              r={Math.max(4, Math.min(12, marker.count / 2))} 
              fill="#8b5cf6" 
              fillOpacity={0.8} 
              stroke="#1f2937"
              strokeWidth={1}
            />
            <title>{marker.name} ({marker.count})</title>
          </Marker>
        ))}
      </ComposableMap>
      <div className="text-xs text-gray-400 text-center mt-2">
        Hover over markers to see location details
      </div>
    </div>
  );
};

export default WorldMap;