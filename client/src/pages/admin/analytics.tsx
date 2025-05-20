import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, UserCheck, UserX, Settings, Film } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function Analytics() {
  // Fetch user list instead of location stats
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000 // Refresh every minute
  });
  
  // Calculate user statistics
  const userStats = React.useMemo(() => {
    if (!usersData) {
      return {
        total: 0,
        active: 0,
        inactive: 0
      };
    }
    
    const total = usersData.length;
    const active = usersData.filter((user: any) => !user.Policy?.IsDisabled).length;
    const inactive = total - active;
    
    return { total, active, inactive };
  }, [usersData]);
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          Jellyfin Admin Dashboard
        </h1>
        <p className="text-gray-400 mt-1">
          Manage your Jellyfin users and monitor system status
        </p>
      </div>
      
      {/* User Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? '...' : userStats.total}</div>
            <p className="text-gray-400 text-sm mt-1">Registered accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-500" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{isLoading ? '...' : userStats.active}</div>
            <p className="text-gray-400 text-sm mt-1">Enabled accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-500" />
              Disabled Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{isLoading ? '...' : userStats.inactive}</div>
            <p className="text-gray-400 text-sm mt-1">Inactive accounts</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
          <CardDescription>Common administration tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition flex flex-col items-center text-center">
              <Users className="w-8 h-8 text-primary mb-2" />
              <span className="font-medium">Manage Users</span>
              <span className="text-xs text-gray-400 mt-1">Add, edit or remove user accounts</span>
            </button>
            
            <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition flex flex-col items-center text-center">
              <Film className="w-8 h-8 text-primary mb-2" />
              <span className="font-medium">Content Library</span>
              <span className="text-xs text-gray-400 mt-1">Review media status and metadata</span>
            </button>
            
            <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition flex flex-col items-center text-center">
              <FileText className="w-8 h-8 text-primary mb-2" />
              <span className="font-medium">System Logs</span>
              <span className="text-xs text-gray-400 mt-1">View server activity and errors</span>
            </button>
            
            <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition flex flex-col items-center text-center">
              <Settings className="w-8 h-8 text-primary mb-2" />
              <span className="font-medium">Server Settings</span>
              <span className="text-xs text-gray-400 mt-1">Configure Jellyfin server options</span>
            </button>
          </div>
        </CardContent>
      </Card>
      
      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">System Information</CardTitle>
          <CardDescription>Jellyfin server overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Server Status</h3>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-emerald-500 text-sm">Online</span>
                </div>
                <p className="text-gray-400 text-xs">Server is running normally</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Version</h3>
                <p className="text-white text-sm mb-1">Jellyfin 10.8.12</p>
                <p className="text-gray-400 text-xs">Last checked: Today</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Log Entries</h3>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-gray-800 rounded text-gray-300">
                  <span className="text-gray-400 mr-2">INFO:</span>
                  Server started successfully
                </div>
                <div className="p-2 bg-gray-800 rounded text-gray-300">
                  <span className="text-gray-400 mr-2">INFO:</span>
                  User login: admin
                </div>
                <div className="p-2 bg-gray-800 rounded text-gray-300">
                  <span className="text-yellow-400 mr-2">WARN:</span>
                  Media scan incomplete - check permissions
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}