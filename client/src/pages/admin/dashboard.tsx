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
  UserCheck2
} from "lucide-react";
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
  const [newPassword, setNewPassword] = useState("");
  const [showNeverLoggedIn, setShowNeverLoggedIn] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Check if admin is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/users");
        if (!res.ok) {
          window.location.href = "/admin/login";
        }
      } catch (error) {
        window.location.href = "/admin/login";
      }
    };
    
    checkAuth();
  }, []);

  // Query to get all users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      return res.json();
    }
  });

  // Mutation for user actions (delete, enable, disable)
  const actionMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      action, 
      newPassword,
      userIds
    }: { 
      userId?: string; 
      action: "delete" | "enable" | "disable" | "reset-password" | "bulk-disable"; 
      newPassword?: string;
      userIds?: string[];
    }) => {
      const res = await apiRequest("POST", "/api/admin/users/action", {
        userId,
        action,
        newPassword,
        userIds
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
      <header className="bg-gray-900/60 border-b border-gray-800 px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Jellyfin Admin Dashboard</h1>
          </div>
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-white flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-6">
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-lg p-6 shadow-lg">
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
                              const userIds = filteredUsers.map(user => user.Id);
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
                      <TableHead className="text-gray-400">Username</TableHead>
                      <TableHead className="text-gray-400">Last Activity</TableHead>
                      <TableHead className="text-gray-400">Last Login</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user: JellyfinApiUser) => (
                        <TableRow key={user.Id} className="border-gray-800 hover:bg-gray-900/50">
                          <TableCell className="font-medium text-white">
                            {user.Name}
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {formatDate(user.LastActivityDate)}
                          </TableCell>
                          <TableCell className="text-gray-400">
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
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {/* Reset Password */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    className="h-8 w-8 bg-gray-800 border-gray-700 hover:bg-gray-700"
                                    onClick={() => setSelectedUser(user)}
                                  >
                                    <Lock className="h-4 w-4 text-amber-400" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-gray-900 border-gray-800 text-white">
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
                                <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
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
      </main>
    </div>
  );
}