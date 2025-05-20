import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WorldMapProps {
  locationData: {
    country: string;
    city?: string;
    count: number;
  }[];
}

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e'];

export default function WorldMap({ locationData }: WorldMapProps) {
  // Sort data by count in descending order and take top 8
  const chartData = React.useMemo(() => {
    return locationData
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(item => ({
        name: item.country,
        value: item.count
      }));
  }, [locationData]);
  
  // Calculate total count for percentage
  const totalCount = React.useMemo(() => {
    return locationData.reduce((sum, item) => sum + item.count, 0);
  }, [locationData]);
  
  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalCount) * 100).toFixed(1);
      
      return (
        <div className="bg-gray-900/90 backdrop-blur-sm border border-primary/30 p-2 rounded-md shadow-lg text-sm">
          <p className="font-medium text-white">{data.name}</p>
          <p className="text-gray-300">{data.value} users ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">User Location Distribution</CardTitle>
        <CardDescription>
          Geographic breakdown of your Jellyfin users
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Pie chart visualization */}
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Country list */}
          <div className="p-4 space-y-2 max-h-[300px] overflow-auto border-t md:border-t-0 md:border-l border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Country Breakdown</h3>
            
            {locationData
              .sort((a, b) => b.count - a.count)
              .map((location, index) => {
                const percentage = ((location.count / totalCount) * 100).toFixed(1);
                
                return (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex-1">
                      <span className="text-sm text-gray-300">{location.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-800 h-2 w-20 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {location.count}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              
            {locationData.length === 0 && (
              <div className="text-center p-6 text-gray-500">
                No location data available
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}