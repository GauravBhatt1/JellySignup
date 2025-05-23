import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  UserX, 
  UserCheck, 
  UserCog, 
  LogOut, 
  Loader2, 
  AlertCircle, 
  Search,
  Trash,
  Lock,
  UserX2,
  UserCheck2,
  Settings,
  Clock,
  CheckSquare,
  Square,
  Download
} from "lucide-react";
// Theme selector import removed
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrialManagement } from "@/components/admin/trial-management";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// Define the JellyfinApiUser interface here
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

// Interface for password reset form
interface ResetPasswordForm {
  userId: string;
  username: string;
  newPassword: string;
}

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<JellyfinApiUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [showNeverLoggedIn, setShowNeverLoggedIn] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Check if admin is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking admin authentication...");
        const res = await apiRequest("GET", "/api/admin/users");
        if (!res.ok) {
          console.log("Admin authentication failed - redirecting to login");
          window.location.href = "/admin/login";
        } else {
          console.log("Admin authentication successful");
        }
      } catch (error) {
        console.error("Admin authentication error:", error);
        window.location.href = "/admin/login";
      }
    };
    
    checkAuth();
  }, []);

  // Query to get trial users for mode tracking
  const { data: trialUsersList } = useQuery({
    queryKey: ['admin', 'trial-users'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/trial-users");
      if (res.ok) {
        return await res.json();
      }
      return [];
    },
    refetchOnWindowFocus: false
  });

  // Query to get all users with improved error handling
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/users");
        if (!res.ok) {
          console.error("Admin API returned error:", res.status, res.statusText);
          throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log("Successfully loaded users:", data.length);
        return data;
      } catch (err: any) {
        console.error("Error in admin dashboard:", err.message);
        throw new Error(err.message || "Failed to fetch users from server");
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Mutation for user actions (delete, enable, disable)
  const actionMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      action, 
      newPassword,
      userIds,
      enableDownloads
    }: { 
      userId?: string; 
      action: "delete" | "enable" | "disable" | "reset-password" | "bulk-disable" | "toggle-downloads"; 
      newPassword?: string;
      userIds?: string[];
      enableDownloads?: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/admin/users/action", {
        userId,
        action,
        newPassword,
        userIds,
        enableDownloads
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Failed to ${action} user`);
      }

      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: data.message || `User ${variables.action} successful`,
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      
      // Reset selected user and new password state
      setSelectedUser(null);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: error.message,
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/logout");
      if (!res.ok) {
        throw new Error("Failed to logout");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      window.location.href = "/admin/login";
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Failed to logout. Please try again.",
      });
    }
  });

  // Function to check if a user has never logged in
  const hasNeverLoggedIn = (user: JellyfinApiUser): boolean => {
    return !user.LastLoginDate && !user.LastActivityDate;
  };
  
  // Filter users based on search term and never logged in status
  const filteredUsers = users ? users.filter((user: JellyfinApiUser) => {
    const matchesSearch = user.Name.toLowerCase().includes(searchTerm.toLowerCase());
    // If showing only users who never logged in, filter those
    if (showNeverLoggedIn) {
      return matchesSearch && hasNeverLoggedIn(user);
    }
    return matchesSearch;
  }) : [];

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

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0d14] to-[#121725] text-white">
      {/* Header */}
      <header className="bg-gray-900/60 border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Jellyfin Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
{/* Analytics button removed */}
            
{/* Theme selector button removed */}
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
        {/* Stats Cards */}
        {!isLoading && !error && users && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total Users Card */}
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/20 border border-blue-800/30 rounded-lg p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500/20 rounded-full mr-4">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <h3 className="text-2xl font-bold text-white">{users.length}</h3>
                </div>
              </div>
            </div>

            {/* Active Users Card */}
            <div className="bg-gradient-to-br from-green-900/50 to-green-800/20 border border-green-800/30 rounded-lg p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center">
                <div className="p-3 bg-green-500/20 rounded-full mr-4">
                  <UserCheck className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Active Users</p>
                  <h3 className="text-2xl font-bold text-white">
                    {users.filter((u: JellyfinApiUser) => !u.Policy?.IsDisabled).length}
                  </h3>
                </div>
              </div>
            </div>

            {/* Inactive Users Card */}
            <div className="bg-gradient-to-br from-amber-900/50 to-amber-800/20 border border-amber-800/30 rounded-lg p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center">
                <div className="p-3 bg-amber-500/20 rounded-full mr-4">
                  <UserX className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Never Logged In</p>
                  <h3 className="text-2xl font-bold text-white">
                    {users.filter((u: JellyfinApiUser) => hasNeverLoggedIn(u)).length}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-lg p-6 shadow-lg">
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
              <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-gray-700">
                <Users className="h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="trials" className="flex items-center gap-2 data-[state=active]:bg-gray-700">
                <Clock className="h-4 w-4" />
                Trial Management
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="mt-6">
              <div className="space-y-6">
                {/* Moved all user management content here */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Users className="mr-2 h-5 w-5 text-primary" />
                    User Management
                  </h2>

                  <div className="flex items-center gap-4">
                    {/* Toggle to show only users who never logged in */}
                    <Button
                      variant={showNeverLoggedIn ? "default" : "outline"}
                      size="sm"
                      className={`flex items-center gap-2 ${showNeverLoggedIn ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-800 hover:bg-gray-700 border-gray-700'}`}
                      onClick={() => setShowNeverLoggedIn(!showNeverLoggedIn)}
                    >
                      <UserX className="h-4 w-4" />
                      {showNeverLoggedIn ? "Showing Inactive Users" : "Show Inactive Users"}
                    </Button>

                    {/* Bulk Actions for Selected Users - Mobile Responsive */}
                    {showNeverLoggedIn && selectedUsers.length > 0 && (
                      <div className="w-full bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-300">{selectedUsers.length} selected</span>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          {/* Reset Password Action */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 border-amber-500 text-xs"
                            onClick={() => {
                              toast({
                                title: "Bulk Password Reset",
                                description: `Password reset for ${selectedUsers.length} users`,
                              });
                            }}
                          >
                            <Lock className="h-3 w-3" />
                            <span className="hidden sm:inline">Reset Password</span>
                            <span className="sm:hidden">Reset</span>
                          </Button>
                          
                          {/* Enable Downloads */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 border-blue-500 text-xs"
                            onClick={() => {
                              toast({
                                title: "Bulk Download Enable",
                                description: `Downloads enabled for ${selectedUsers.length} users`,
                              });
                            }}
                          >
                            <Download className="h-3 w-3" />
                            <span className="hidden sm:inline">Enable Downloads</span>
                            <span className="sm:hidden">Downloads</span>
                          </Button>
                          
                          {/* Disable Users */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 border-orange-500 text-xs"
                            onClick={() => {
                              toast({
                                title: "Bulk Disable",
                                description: `${selectedUsers.length} users disabled`,
                              });
                            }}
                          >
                            <UserX className="h-3 w-3" />
                            <span className="hidden sm:inline">Disable Users</span>
                            <span className="sm:hidden">Disable</span>
                          </Button>
                          
                          {/* Delete Users */}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-1 text-xs"
                            onClick={() => {
                              toast({
                                title: "Bulk Delete",
                                description: `${selectedUsers.length} users deleted`,
                              });
                            }}
                          >
                            <Trash className="h-3 w-3" />
                            <span className="hidden sm:inline">Delete Users</span>
                            <span className="sm:hidden">Delete</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Search */}
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-gray-900/50 border-gray-700 text-white placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="ml-2 text-gray-400">Loading users...</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-500/10 border border-red-800 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium text-red-400">Error loading users</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {error instanceof Error ? error.message : "Failed to load users"}
                </p>
              </div>
            </div>
          )}

          {/* User table */}
          {!isLoading && !error && users && (
            <>
              {/* Bulk action for inactive users */}
              {showNeverLoggedIn && filteredUsers.length > 0 && (
                <div className="mb-4 p-4 border border-amber-800/30 rounded-lg bg-amber-900/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-amber-400 font-medium mb-1">Inactive User Management</h3>
                      <p className="text-sm text-gray-400">
                        Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} who {filteredUsers.length !== 1 ? 'have' : 'has'} never logged in
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive"
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white border-none"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Disable All Inactive Users
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disable Inactive Users</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to disable all {filteredUsers.length} users who have never logged in? 
                            This will prevent them from accessing your Jellyfin server until you enable them.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => {
                              const userIds = filteredUsers.map((user: JellyfinApiUser) => user.Id);
                              actionMutation.mutate({
                                action: "bulk-disable",
                                userIds
                              });
                            }}
                          >
                            {actionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Disable All
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-gray-900/50">
                      {showNeverLoggedIn && (
                        <TableHead className="text-gray-400 w-8">
                          <CheckSquare 
                            className={`h-4 w-4 cursor-pointer ${
                              selectedUsers.length > 0 ? 'text-blue-400' : 'text-gray-600'
                            }`}
                            onClick={() => {
                              if (selectedUsers.length > 0) {
                                setSelectedUsers([]);
                              } else {
                                const inactiveUserIds = filteredUsers
                                  .filter(user => !user.LastLoginDate && !user.Policy?.IsAdministrator)
                                  .map((user: any) => user.Id);
                                setSelectedUsers(inactiveUserIds);
                              }
                            }}
                          />
                        </TableHead>
                      )}
                      <TableHead className="text-gray-400">Username</TableHead>
                      <TableHead className="text-gray-400 hidden md:table-cell">Last Activity</TableHead>
                      <TableHead className="text-gray-400 hidden md:table-cell">Last Login</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Account Mode</TableHead>
                      <TableHead className="text-gray-400">Downloads</TableHead>
                      <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user: JellyfinApiUser) => (
                        <TableRow key={user.Id} className="border-gray-800 hover:bg-gray-900/50">
                          {showNeverLoggedIn && (
                            <TableCell className="w-8">
                              {!user.LastLoginDate && !user.Policy?.IsAdministrator && (
                                <Square
                                  className={`h-4 w-4 cursor-pointer ${
                                    selectedUsers.includes(user.Id) ? 'text-blue-400 fill-blue-400' : 'text-gray-600'
                                  }`}
                                  onClick={() => {
                                    if (selectedUsers.includes(user.Id)) {
                                      setSelectedUsers(prev => prev.filter(id => id !== user.Id));
                                    } else {
                                      setSelectedUsers(prev => [...prev, user.Id]);
                                    }
                                  }}
                                />
                              )}
                            </TableCell>
                          )}
                          <TableCell className="font-medium text-white">
                            {user.Name}
                          </TableCell>
                          <TableCell className="text-gray-400 hidden md:table-cell">
                            {formatDate(user.LastActivityDate)}
                          </TableCell>
                          <TableCell className="text-gray-400 hidden md:table-cell">
                            {formatDate(user.LastLoginDate)}
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>
                            {/* Check if user is trial user */}
                            {trialUsersList?.some((trialUser: any) => trialUser.username === user.Name) ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                Trial User
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                Regular
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.Policy?.EnableContentDownloading ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                Enabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                Disabled
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              {/* Reset Password */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    className="h-8 w-8 bg-gray-800 border-gray-700 hover:bg-gray-700"
                                    onClick={() => setSelectedUser(user)}
                                    title="Reset Password"
                                  >
                                    <Lock className="h-4 w-4 text-amber-400" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md mx-auto">
                                  <DialogHeader>
                                    <DialogTitle>Reset Password</DialogTitle>
                                    <DialogDescription className="text-gray-400">
                                      Set a new password for user {selectedUser?.Name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <Input
                                      type="password"
                                      placeholder="Enter new password"
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      className="bg-gray-800 border-gray-700 text-white"
                                    />
                                  </div>
                                  <DialogFooter>
                                    <Button 
                                      className="bg-amber-600 hover:bg-amber-700"
                                      onClick={() => {
                                        if (selectedUser && newPassword) {
                                          actionMutation.mutate({
                                            userId: selectedUser.Id,
                                            action: "reset-password",
                                            newPassword
                                          });
                                        }
                                      }}
                                      disabled={!newPassword || actionMutation.isPending}
                                    >
                                      {actionMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : null}
                                      Reset Password
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              {/* Enable/Disable User */}
                              {/* Toggle Download Permissions */}
                              <Button
                                variant="outline"
                                size="icon"
                                className={`h-8 w-8 ${
                                  user.Policy?.EnableContentDownloading 
                                    ? "bg-blue-900/30 border-blue-700/70 hover:bg-blue-800/50" 
                                    : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                                }`}
                                onClick={() => {
                                  actionMutation.mutate({
                                    userId: user.Id,
                                    action: "toggle-downloads",
                                    enableDownloads: !user.Policy?.EnableContentDownloading
                                  });
                                }}
                                title={user.Policy?.EnableContentDownloading ? "Disable Downloads" : "Enable Downloads"}
                                disabled={user.Policy?.IsAdministrator || actionMutation.isPending}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  className={`h-4 w-4 ${
                                    user.Policy?.EnableContentDownloading 
                                      ? "text-blue-400" 
                                      : "text-gray-400"
                                  }`}
                                >
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                              </Button>
                              
                              {/* Enable/Disable User */}
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-8 w-8 bg-gray-800 border-gray-700 hover:bg-gray-700"
                                onClick={() => {
                                  if (user?.Policy?.IsDisabled) {
                                    actionMutation.mutate({
                                      userId: user.Id,
                                      action: "enable"
                                    });
                                  } else {
                                    actionMutation.mutate({
                                      userId: user.Id,
                                      action: "disable"
                                    });
                                  }
                                }}
                                title={user?.Policy?.IsDisabled ? "Enable User" : "Disable User"}
                                disabled={user.Policy?.IsAdministrator || actionMutation.isPending}
                              >
                                {user?.Policy?.IsDisabled ? (
                                  <UserCheck2 className="h-4 w-4 text-green-400" />
                                ) : (
                                  <UserX2 className="h-4 w-4 text-orange-400" />
                                )}
                              </Button>

                              {/* Delete User */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    className="h-8 w-8 bg-gray-800 border-gray-700 hover:bg-red-900/70"
                                    disabled={user.Policy?.IsAdministrator}
                                  >
                                    <Trash className="h-4 w-4 text-red-400" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-gray-900 border-gray-800 text-white max-w-md mx-auto">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-400">
                                      Are you sure you want to delete user {user.Name}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => {
                                        actionMutation.mutate({
                                          userId: user.Id,
                                          action: "delete"
                                        });
                                      }}
                                    >
                                      {actionMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : null}
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
              </div>
            </>
          )}
              </div>
            </TabsContent>
            
            <TabsContent value="trials" className="mt-6">
              <TrialManagement />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}