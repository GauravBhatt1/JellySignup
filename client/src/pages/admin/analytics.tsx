import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LocationMap from '@/components/admin/location-map';
import { MapPin, Users, Clock, Activity, Globe } from 'lucide-react';
import { format } from 'date-fns';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("location-map");
  
  // Fetch location stats from the API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/location-stats'],
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000 // Refresh every 30 seconds
  });
  
  // Format the data for the map visualization
  const mapData = React.useMemo(() => {
    if (!data || !data.geoData) return [];
    
    return data.geoData.map((item: any) => ({
      username: item.username,
      coordinates: item.coordinates,
      city: item.city || 'Unknown',
      country: item.country || 'Unknown',
      timestamp: item.timestamp
    }));
  }, [data]);

  // Get top countries by user count
  const topCountries = React.useMemo(() => {
    if (!data || !data.countries) return [];
    
    return Object.entries(data.countries)
      .map(([country, stats]: [string, any]) => ({
        country,
        count: stats.count,
        percentage: stats.percentage
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data]);
  
  // Format date for readability
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return format(date, 'MMM d, yyyy HH:mm');
  };
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            Jellyfin User Analytics
          </h1>
          <p className="text-gray-400 mt-1">
            Track user activity and geographic distribution in real-time
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1.5 text-xs">
            <Activity className="w-3 h-3 mr-1" />
            {isLoading ? 'Loading...' : 
              `${data?.totalTracked || 0} total activities`}
          </Badge>
          
          <Badge variant="outline" className="px-3 py-1.5 text-xs">
            <Globe className="w-3 h-3 mr-1" />
            {isLoading ? '...' :
              `${Object.keys(data?.countries || {}).length} countries`}
          </Badge>
        </div>
      </div>
      
      <Tabs 
        defaultValue="location-map" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="location-map" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Map View</span>
          </TabsTrigger>
          <TabsTrigger value="countries" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Countries</span>
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Recent</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="location-map" className="m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  User Location Map
                </CardTitle>
                <CardDescription>
                  Precise location tracking of user activity (Google Analytics-style)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center bg-gray-900/50 rounded-lg">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                      <p className="mt-4 text-gray-400">Loading location data...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="h-[400px] flex items-center justify-center bg-gray-900/50 rounded-lg">
                    <div className="text-center max-w-md mx-auto">
                      <p className="text-red-400">Failed to load location data</p>
                      <p className="text-gray-400 mt-2 text-sm">Please try refreshing the page</p>
                    </div>
                  </div>
                ) : (
                  <LocationMap 
                    locationData={mapData}
                    title="Real-time User Location Tracking"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="countries" className="m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  User Distribution by Country
                </CardTitle>
                <CardDescription>
                  Geographic breakdown of your Jellyfin userbase
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topCountries.map((item) => (
                      <div key={item.country} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-300 font-medium">{item.country}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-[150px] md:w-[200px] bg-gray-800 rounded-full h-2.5">
                            <div 
                              className="bg-primary h-2.5 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <Badge variant="outline">{item.count} users</Badge>
                        </div>
                      </div>
                    ))}
                    
                    {topCountries.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        No country data available yet
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recent" className="m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent User Activity
                </CardTitle>
                <CardDescription>
                  Latest access logs from your Jellyfin users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left py-3 font-medium text-gray-400">User</th>
                          <th className="text-left py-3 font-medium text-gray-400">Location</th>
                          <th className="text-left py-3 font-medium text-gray-400">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.recentLocations?.map((log: any, index: number) => (
                          <tr 
                            key={index} 
                            className="border-b border-gray-800 hover:bg-gray-900/30"
                          >
                            <td className="py-3 text-gray-300">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                {log.username}
                              </div>
                            </td>
                            <td className="py-3 text-gray-300">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                {log.city}, {log.country}
                              </div>
                            </td>
                            <td className="py-3 text-gray-400 text-sm">
                              {formatDate(log.timestamp)}
                            </td>
                          </tr>
                        ))}
                        
                        {(!data?.recentLocations || data?.recentLocations.length === 0) && (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-gray-400">
                              No recent activity recorded
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}