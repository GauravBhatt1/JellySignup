import React, { useState, useEffect, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

// Location tracking interfaces
interface LocationData {
  ip: string;
  country: string;
  region: string;
  city: string;
  timestamp: number;
  username: string;
}

interface LocationStats {
  totalTracked: number;
  countries: Record<string, {
    count: number;
    percentage: number;
  }>;
  cities: Record<string, {
    count: number;
    country: string;
  }>;
  recentLocations: LocationData[];
}
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  Clock,
  Activity,
  Calendar,
  LogOut,
  ArrowLeft,
  MapPin,
  Globe,
  Info as InfoCircled
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format, differenceInDays, isAfter, subDays } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface JellyfinApiUser {
  Id: string;
  Name: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
  Policy?: {
    IsAdministrator: boolean;
    IsDisabled: boolean;
    EnableContentDownloading?: boolean;
    [key: string]: any;
  };
  LastLoginDate?: string;
  LastActivityDate?: string;
  [key: string]: any;
}

// Custom colors for the charts
const COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#f43f5e'];

export default function AdminAnalytics() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [showLoginActivity, setShowLoginActivity] = useState(true);

  // Query to get all users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      try {
        console.log("Checking admin authentication...");
        const res = await apiRequest("GET", "/api/admin/users");
        if (!res.ok) {
          console.log("Admin authentication failed - redirecting to login");
          window.location.href = "/admin/login";
          throw new Error("Authentication failed");
        }
        console.log("Admin authentication successful");
        const data = await res.json();
        return data as JellyfinApiUser[];
      } catch (err: any) {
        console.error("Error in admin dashboard:", err.message);
        throw new Error(err.message || "Failed to fetch users from server");
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  // Query to get location statistics
  const { data: locationStats, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['admin', 'locations'],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/location-stats");
        if (!res.ok) {
          throw new Error("Failed to fetch location data");
        }
        return res.json() as Promise<LocationStats>;
      } catch (err: any) {
        console.error("Error fetching location stats:", err.message);
        throw new Error(err.message || "Failed to fetch location data");
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Navigate to dashboard page
  const handleBackToDashboard = () => {
    navigate("/admin/dashboard");
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const res = await apiRequest("POST", "/api/admin/logout");
      if (res.ok) {
        toast({
          title: "Logged out",
          description: "You have been logged out successfully",
        });
        window.location.href = "/admin/login";
      } else {
        toast({
          variant: "destructive",
          title: "Logout Failed",
          description: "Failed to logout. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred while logging out",
      });
    }
  };

  // Calculate user statistics
  const calculateStats = () => {
    if (!users || users.length === 0) return null;

    const totalUsers = users.length;
    const activeUsers = users.filter(user => !user.Policy?.IsDisabled).length;
    const adminUsers = users.filter(user => user.Policy?.IsAdministrator).length;
    const inactiveUsers = users.filter(user => user.Policy?.IsDisabled).length;
    const downloadEnabled = users.filter(user => user.Policy?.EnableContentDownloading).length;
    const neverLoggedIn = users.filter(user => !user.LastLoginDate && !user.LastActivityDate).length;

    // Calculate activity in the last 7 days
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const activeInLastWeek = users.filter(user => {
      if (user.LastActivityDate) {
        const lastActivity = new Date(user.LastActivityDate);
        return isAfter(lastActivity, sevenDaysAgo);
      }
      return false;
    }).length;

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      inactiveUsers,
      downloadEnabled,
      neverLoggedIn,
      activeInLastWeek
    };
  };

  // Group users by activity recency
  const getUserActivityData = () => {
    if (!users || users.length === 0) return [];

    const now = new Date();
    const activityGroups = [
      { name: 'Today', count: 0 },
      { name: 'Yesterday', count: 0 },
      { name: 'This Week', count: 0 },
      { name: 'This Month', count: 0 },
      { name: 'Older', count: 0 },
      { name: 'Never', count: 0 }
    ];

    users.forEach(user => {
      const dateToCheck = showLoginActivity 
        ? (user.LastLoginDate || null)
        : (user.LastActivityDate || user.LastLoginDate || null);

      if (!dateToCheck) {
        // Never logged in or no activity
        activityGroups[5].count++;
        return;
      }

      const date = new Date(dateToCheck);
      const daysDiff = differenceInDays(now, date);

      if (daysDiff < 1) {
        activityGroups[0].count++; // Today
      } else if (daysDiff < 2) {
        activityGroups[1].count++; // Yesterday
      } else if (daysDiff < 7) {
        activityGroups[2].count++; // This Week
      } else if (daysDiff < 30) {
        activityGroups[3].count++; // This Month
      } else {
        activityGroups[4].count++; // Older
      }
    });

    return activityGroups;
  };

  // Get distribution of user status
  const getUserStatusData = () => {
    if (!users || users.length === 0) return [];

    return [
      { name: 'Active', value: users.filter(user => !user.Policy?.IsDisabled).length },
      { name: 'Disabled', value: users.filter(user => user.Policy?.IsDisabled).length },
      { name: 'Admins', value: users.filter(user => user.Policy?.IsAdministrator).length }
    ];
  };

  // Get user downloads permissions distribution
  const getDownloadsData = () => {
    if (!users || users.length === 0) return [];

    return [
      { name: 'Enabled', value: users.filter(user => user.Policy?.EnableContentDownloading).length },
      { name: 'Disabled', value: users.filter(user => !user.Policy?.EnableContentDownloading).length }
    ];
  };

  // Get most recently active users (top 5)
  const getRecentlyActiveUsers = () => {
    if (!users || users.length === 0) return [];

    return [...users]
      .filter(user => user.LastActivityDate || user.LastLoginDate)
      .sort((a, b) => {
        const dateA = new Date(a.LastActivityDate || a.LastLoginDate || 0);
        const dateB = new Date(b.LastActivityDate || b.LastLoginDate || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  };

  // Stat calculations
  const stats = calculateStats();
  const activityData = getUserActivityData();
  const statusData = getUserStatusData();
  const downloadsData = getDownloadsData();
  const recentUsers = getRecentlyActiveUsers();

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-800 p-3 rounded-lg shadow-lg">
          <p className="text-gray-300">{`${label} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4 shadow-md">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Analytics Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              onClick={handleBackToDashboard}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button 
              variant="ghost" 
              className="text-gray-300 hover:text-white hover:bg-gray-800 flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-4 sm:p-6">
        {isLoading ? (
          // Loading skeleton
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-gray-900/40 backdrop-blur-sm border-gray-800 shadow-lg">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-1/2 bg-gray-800" />
                  <Skeleton className="h-8 w-20 bg-gray-800" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full bg-gray-800" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          // Error display
          <Card className="bg-red-900/20 border-red-800">
            <CardHeader>
              <CardTitle>Error Loading Analytics</CardTitle>
              <CardDescription className="text-red-300">
                Failed to load analytics data. Please try again or check your connection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-red-700 hover:bg-red-800"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="bg-gray-900 border border-blue-800/40 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-blue-400 flex items-center font-medium">
                      <Users className="mr-2 h-4 w-4" />
                      Total Users
                    </CardDescription>
                    <CardTitle className="text-3xl text-white">{stats.totalUsers}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-300">
                      {stats.activeUsers} active, {stats.inactiveUsers} disabled
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900 border border-purple-800/40 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-purple-400 flex items-center font-medium">
                      <Activity className="mr-2 h-4 w-4" />
                      Active Last Week
                    </CardDescription>
                    <CardTitle className="text-3xl text-white">{stats.activeInLastWeek}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-purple-300">
                      {Math.round((stats.activeInLastWeek / stats.totalUsers) * 100)}% of total users
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900 border border-amber-800/40 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-amber-400 flex items-center font-medium">
                      <Clock className="mr-2 h-4 w-4" />
                      Never Logged In
                    </CardDescription>
                    <CardTitle className="text-3xl text-white">{stats.neverLoggedIn}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-amber-300">
                      {Math.round((stats.neverLoggedIn / stats.totalUsers) * 100)}% of total users
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900 border border-emerald-800/40 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-emerald-400 flex items-center font-medium">
                      <Calendar className="mr-2 h-4 w-4" />
                      Downloads Enabled
                    </CardDescription>
                    <CardTitle className="text-3xl text-white">{stats.downloadEnabled}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-emerald-300">
                      {Math.round((stats.downloadEnabled / stats.totalUsers) * 100)}% of total users
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Chart Tabs */}
            <Tabs defaultValue="activity" className="mb-8">
              <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full bg-gray-900/40 border border-gray-800 text-white">
                <TabsTrigger value="activity" className="data-[state=active]:bg-gray-800/80 data-[state=active]:text-primary text-gray-300">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">User Activity</span>
                  <span className="sm:hidden">Activity</span>
                </TabsTrigger>
                <TabsTrigger value="status" className="data-[state=active]:bg-gray-800/80 data-[state=active]:text-primary text-gray-300">
                  <PieChartIcon className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">User Status</span>
                  <span className="sm:hidden">Status</span>
                </TabsTrigger>
                <TabsTrigger value="downloads" className="data-[state=active]:bg-gray-800/80 data-[state=active]:text-primary text-gray-300">
                  <Activity className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Download Permissions</span>
                  <span className="sm:hidden">Downloads</span>
                </TabsTrigger>
                <TabsTrigger value="location" className="data-[state=active]:bg-gray-800/80 data-[state=active]:text-primary text-gray-300">
                  <Globe className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">User Locations</span>
                  <span className="sm:hidden">Locations</span>
                </TabsTrigger>
                <TabsTrigger value="recent" className="data-[state=active]:bg-gray-800/80 data-[state=active]:text-primary text-gray-300">
                  <Clock className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Recent Activity</span>
                  <span className="sm:hidden">Recent</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Activity Chart */}
              <TabsContent value="activity">
                <Card className="bg-gray-900 border-gray-800 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-white">User Activity</CardTitle>
                      <CardDescription className="text-gray-300">When users last interacted with Jellyfin</CardDescription>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`mr-2 ${showLoginActivity ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-gray-800 text-gray-300'}`}
                        onClick={() => setShowLoginActivity(true)}
                      >
                        Login Activity
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${!showLoginActivity ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-gray-800 text-gray-300'}`}
                        onClick={() => setShowLoginActivity(false)}
                      >
                        Any Activity
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={activityData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 20,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#d1d5db' }} 
                            axisLine={{ stroke: '#4a5568' }}
                          />
                          <YAxis 
                            tick={{ fill: '#d1d5db' }} 
                            axisLine={{ stroke: '#4a5568' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="count" 
                            fill="#8b5cf6" 
                            radius={[4, 4, 0, 0]}
                            barSize={40}
                            name="Users"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Status Pie Chart */}
              <TabsContent value="status">
                <Card className="bg-gray-900/40 backdrop-blur-sm border-gray-800">
                  <CardHeader>
                    <CardTitle>User Status Distribution</CardTitle>
                    <CardDescription>Breakdown of user account status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => 
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Downloads Pie Chart */}
              <TabsContent value="downloads">
                <Card className="bg-gray-900/40 backdrop-blur-sm border-gray-800">
                  <CardHeader>
                    <CardTitle>Download Permissions</CardTitle>
                    <CardDescription>Users with download permissions enabled</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={downloadsData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => 
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#f43f5e" />
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Recent User Activity */}
              <TabsContent value="recent">
                <Card className="bg-gray-900/40 backdrop-blur-sm border-gray-800">
                  <CardHeader>
                    <CardTitle>Recent User Activity</CardTitle>
                    <CardDescription>Most recently active users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="text-left py-3 px-4 text-gray-400">Username</th>
                            <th className="text-left py-3 px-4 text-gray-400">Last Login</th>
                            <th className="text-left py-3 px-4 text-gray-400">Last Activity</th>
                            <th className="text-left py-3 px-4 text-gray-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentUsers.map(user => (
                            <tr key={user.Id} className="border-b border-gray-800 hover:bg-gray-900/50">
                              <td className="py-3 px-4 text-white">{user.Name}</td>
                              <td className="py-3 px-4 text-gray-300">{formatDate(user.LastLoginDate)}</td>
                              <td className="py-3 px-4 text-gray-300">{formatDate(user.LastActivityDate)}</td>
                              <td className="py-3 px-4">
                                {user.Policy?.IsAdministrator ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                    Admin
                                  </span>
                                ) : user.Policy?.IsDisabled ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                    Disabled
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                    Active
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location">
                <Card className="bg-gray-900/40 backdrop-blur-sm border-gray-800">
                  <CardHeader>
                    <CardTitle>User Locations</CardTitle>
                    <CardDescription>Geographic distribution of your Jellyfin users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-gray-800 p-6 bg-gray-900/60 backdrop-blur-sm">
                      <h3 className="text-xl font-medium mb-4 flex items-center">
                        <Globe className="mr-2 h-5 w-5 text-primary" />
                        Global User Map
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Track where your users are accessing Jellyfin from across the world with precise location mapping.
                      </p>
                      
                      {/* World map visualization */}
                      {isLoadingLocations ? (
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 animate-pulse h-[300px] md:h-[400px]">
                          <div className="h-full w-full flex items-center justify-center">
                            <div className="text-gray-500">Loading map data...</div>
                          </div>
                        </div>
                      ) : locationStats && locationStats.totalTracked > 0 ? (
                        // Import and use the WorldMap component
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          {/* Convert the country data to format needed by WorldMap */}
                          {(() => {
                            const mapData = Object.entries(locationStats.countries || {}).map(
                              ([country, data]) => ({
                                country,
                                count: data.count
                              })
                            );
                            // Add city-specific data
                            Object.entries(locationStats.cities || {}).forEach(([cityKey, data]) => {
                              const [city, country] = cityKey.split(', ');
                              // Need to declare the proper type to include city
                              mapData.push({
                                country,
                                city,
                                count: data.count
                              } as any);
                            });
                            
                            // Dynamic import of WorldMap to avoid server-side rendering issues
                            const WorldMap = React.lazy(() => import('@/components/admin/world-map'));
                            
                            return (
                              <React.Suspense fallback={<div>Loading map...</div>}>
                                <WorldMap locationData={mapData} />
                              </React.Suspense>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-center py-12">
                          <MapPin className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400">No location data available yet.</p>
                          <p className="text-gray-500 text-sm mt-2">Data will appear as users access your Jellyfin server.</p>
                        </div>
                      )}
                      
                      <h3 className="text-xl font-medium mt-8 mb-4 flex items-center">
                        <MapPin className="mr-2 h-5 w-5 text-primary" />
                        Location Breakdown
                      </h3>
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {isLoadingLocations ? (
                          // Loading skeleton for location data
                          Array(6).fill(0).map((_, i) => (
                            <div key={i} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 animate-pulse">
                              <div className="flex justify-between items-center mb-2">
                                <div className="h-4 bg-gray-700 rounded w-20"></div>
                                <div className="h-4 bg-gray-700 rounded w-8"></div>
                              </div>
                              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="bg-gray-600 h-full rounded-full w-1/3"></div>
                              </div>
                            </div>
                          ))
                        ) : locationStats && locationStats.totalTracked > 0 ? (
                          // Real location data
                          Object.entries(locationStats.countries)
                            .sort((a, b) => b[1].count - a[1].count)
                            .slice(0, 6)
                            .map(([country, data]) => (
                              <div key={country} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-gray-300 font-medium">{country}</span>
                                  <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs">{data.percentage}%</span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-primary h-full rounded-full" 
                                    style={{ width: `${data.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))
                        ) : (
                          // No location data yet
                          <div className="col-span-3 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <p className="text-gray-400 text-center">
                              No location data available yet. Data will appear here as users log in.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                        <h4 className="text-white font-medium mb-2 flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-primary" />
                          Recent User Locations
                        </h4>
                        
                        {isLoadingLocations ? (
                          <div className="animate-pulse flex flex-col gap-2">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700">
                                <div className="flex items-center gap-2">
                                  <div className="h-4 w-20 bg-gray-700 rounded"></div>
                                  <div className="h-4 w-16 bg-gray-700 rounded"></div>
                                </div>
                                <div className="h-4 w-24 bg-gray-700 rounded"></div>
                              </div>
                            ))}
                          </div>
                        ) : locationStats && locationStats.recentLocations && locationStats.recentLocations.length > 0 ? (
                          <div className="space-y-1">
                            {locationStats.recentLocations.slice(0, 5).map((loc, index) => (
                              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">{loc.username}</span>
                                  <span className="text-sm text-gray-300">
                                    {loc.city && loc.city !== 'Unknown' ? loc.city + ', ' : ''}
                                    {loc.country}
                                  </span>
                                </div>
                                <span className="text-xs text-primary">
                                  {formatDistanceToNow(new Date(loc.timestamp), { addSuffix: true })}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">
                            No location data recorded yet. This will update as users log in to Jellyfin.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}