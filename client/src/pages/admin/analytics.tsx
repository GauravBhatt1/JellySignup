import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  Globe
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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0d14] to-[#121725] text-white">
      {/* Header */}
      <header className="bg-gray-900/60 border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Analytics Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              size="sm"
              className="bg-gray-800/70 border-gray-700 text-white hover:bg-gray-700"
              onClick={handleBackToDashboard}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button 
              variant="ghost" 
              className="text-gray-400 hover:text-white flex items-center gap-2"
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
                <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 border border-blue-800/30 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-blue-300 flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Total Users
                    </CardDescription>
                    <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-300/70">
                      {stats.activeUsers} active, {stats.inactiveUsers} disabled
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border border-purple-800/30 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-purple-300 flex items-center">
                      <Activity className="mr-2 h-4 w-4" />
                      Active Last Week
                    </CardDescription>
                    <CardTitle className="text-3xl">{stats.activeInLastWeek}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-purple-300/70">
                      {Math.round((stats.activeInLastWeek / stats.totalUsers) * 100)}% of total users
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-amber-900/30 to-amber-800/10 border border-amber-800/30 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-amber-300 flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Never Logged In
                    </CardDescription>
                    <CardTitle className="text-3xl">{stats.neverLoggedIn}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-amber-300/70">
                      {Math.round((stats.neverLoggedIn / stats.totalUsers) * 100)}% of total users
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-900/30 to-green-800/10 border border-green-800/30 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-green-300 flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Downloads Enabled
                    </CardDescription>
                    <CardTitle className="text-3xl">{stats.downloadEnabled}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-300/70">
                      {Math.round((stats.downloadEnabled / stats.totalUsers) * 100)}% of total users
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Chart Tabs */}
            <Tabs defaultValue="activity" className="mb-8">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full bg-gray-900/40 border border-gray-800 text-white">
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
                <TabsTrigger value="recent" className="data-[state=active]:bg-gray-800/80 data-[state=active]:text-primary text-gray-300">
                  <Clock className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Recent Activity</span>
                  <span className="sm:hidden">Recent</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Activity Chart */}
              <TabsContent value="activity">
                <Card className="bg-gray-900/40 backdrop-blur-sm border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>User Activity</CardTitle>
                      <CardDescription>When users last interacted with Jellyfin</CardDescription>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`mr-2 ${showLoginActivity ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'}`}
                        onClick={() => setShowLoginActivity(true)}
                      >
                        Login Activity
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${!showLoginActivity ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'}`}
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
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}