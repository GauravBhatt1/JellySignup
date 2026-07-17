import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  UserX, 
  UserCheck, 
  Loader2, 
  AlertCircle, 
  Search,
  Trash,
  Lock,
  UserX2,
  UserCheck2,
  CheckSquare,
  Square,
  Download,
  FileDown,
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
import { AdminLayout } from "@/components/admin/admin-layout";
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

  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter((user: JellyfinApiUser) => !user.Policy?.IsDisabled && !user.Policy?.IsAdministrator).length || 0;
  const disabledUsers = users?.filter((user: JellyfinApiUser) => user.Policy?.IsDisabled).length || 0;
  const neverLoggedInUsers = users?.filter((user: JellyfinApiUser) => hasNeverLoggedIn(user) && !user.Policy?.IsAdministrator).length || 0;
  const trialUsersCount = trialUsersList?.length || 0;
  const downloadsEnabledUsers = users?.filter((user: JellyfinApiUser) => user.Policy?.EnableContentDownloading).length || 0;

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

  const exportUsersCsv = () => {
    const rows = filteredUsers.map((user: JellyfinApiUser) => ({
      username: user.Name,
      status: user.Policy?.IsAdministrator ? "Admin" : user.Policy?.IsDisabled ? "Disabled" : "Active",
      accountMode: trialUsersList?.some((trialUser: any) => trialUser.username === user.Name) ? "Trial" : "Regular",
      downloads: user.Policy?.EnableContentDownloading ? "Enabled" : "Disabled",
      lastActivity: user.LastActivityDate || "Never",
      lastLogin: user.LastLoginDate || "Never"
    }));
    const headers = ["username", "status", "accountMode", "downloads", "lastActivity", "lastLogin"];
    const csv = [
      headers.join(","),
      ...rows.map((row: Record<string, string>) => headers.map(header => `"${String(row[header]).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jellysignup-users-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedUserNames = selectedUsers
    .map(id => users?.find((user: JellyfinApiUser) => user.Id === id)?.Name)
    .filter(Boolean) as string[];

  return (
    <AdminLayout
      title="User Management"
      description="Manage Jellyfin users, bulk actions, exports, and account safety."
    >
      <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-lg">
        <div className="space-y-4">
                {/* Moved all user management content here */}
                {/* Mobile Notice removed - Bulk actions now work on mobile too */}
                {/* Banner removed to enable mobile bulk actions */}
                    
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                      <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4 shadow-lg">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Total</div>
                        <div className="mt-2 text-2xl font-bold text-white">{totalUsers}</div>
                      </div>
                      <div className="rounded-2xl border border-green-500/20 bg-green-950/20 p-4 shadow-lg">
                        <div className="text-xs uppercase tracking-wide text-green-400/70">Active</div>
                        <div className="mt-2 text-2xl font-bold text-green-300">{activeUsers}</div>
                      </div>
                      <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4 shadow-lg">
                        <div className="text-xs uppercase tracking-wide text-red-400/70">Disabled</div>
                        <div className="mt-2 text-2xl font-bold text-red-300">{disabledUsers}</div>
                      </div>
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 shadow-lg">
                        <div className="text-xs uppercase tracking-wide text-amber-400/70">Never Login</div>
                        <div className="mt-2 text-2xl font-bold text-amber-300">{neverLoggedInUsers}</div>
                      </div>
                      <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4 shadow-lg">
                        <div className="text-xs uppercase tracking-wide text-blue-400/70">Trials</div>
                        <div className="mt-2 text-2xl font-bold text-blue-300">{trialUsersCount}</div>
                      </div>
                      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4 shadow-lg">
                        <div className="text-xs uppercase tracking-wide text-cyan-400/70">Downloads</div>
                        <div className="mt-2 text-2xl font-bold text-cyan-300">{downloadsEnabledUsers}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4 shadow-lg">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-white">Export & Bulk Preview</div>
                            <p className="mt-1 text-xs text-gray-500">Download current filtered users or preview selected bulk changes.</p>
                          </div>
                          <Button onClick={exportUsersCsv} variant="outline" size="sm" className="border-gray-700 bg-gray-800 hover:bg-gray-700">
                            <FileDown className="mr-2 h-4 w-4" /> Export CSV
                          </Button>
                        </div>
                    </div>

                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-4">
                  <h2 className="text-xl font-semibold flex items-center w-full lg:w-auto">
                    <Users className="mr-2 h-5 w-5 text-primary" />
                    User Management
                  </h2>

                  <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
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

                    {/* Bulk Actions Panel for Selected Users (Mobile Friendly) */}
                    {selectedUsers.length > 0 && (
                      <div className="w-full lg:w-auto sticky top-0 z-50 bg-gray-900/95 backdrop-blur-xl border border-blue-500/40 rounded-xl p-4 shadow-xl md:static md:top-auto md:mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-blue-400 font-semibold">{selectedUsers.length} Users Selected</div>
                            <div className="mt-1 max-w-[360px] truncate text-xs text-gray-400">Preview: {selectedUserNames.slice(0, 4).join(', ')}{selectedUserNames.length > 4 ? ` +${selectedUserNames.length - 4} more` : ''}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUsers([])}
                              className="text-gray-400 hover:text-white h-8 px-2"
                            >
                              Clear
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Select all visible users logic
                                const allIds = users?.map((u: any) => u.Id) || [];
                                setSelectedUsers(allIds);
                              }}
                              className="text-blue-400 border-blue-500/50 h-8 px-3 text-xs"
                            >
                              Select All
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 md:gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex flex-col items-center justify-center gap-1 h-16 sm:h-14 bg-amber-600 hover:bg-amber-700 border-amber-500 text-white rounded-xl active:scale-95 transition-transform text-[10px] sm:text-xs font-medium"
                            onClick={() => {
                              actionMutation.mutate({
                                action: "reset-password",
                                userIds: selectedUsers
                              });
                            }}
                            disabled={actionMutation.isPending}
                          >
                            <Lock className="h-5 w-5" />
                            <span>Reset</span>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex flex-col items-center justify-center gap-1 h-16 sm:h-14 bg-blue-600 hover:bg-blue-700 border-blue-500 text-white rounded-xl active:scale-95 transition-transform text-[10px] sm:text-xs font-medium"
                            onClick={() => {
                              actionMutation.mutate({
                                action: "toggle-downloads",
                                userIds: selectedUsers
                              });
                            }}
                            disabled={actionMutation.isPending}
                          >
                            <Download className="h-5 w-5" />
                            <span>Download</span>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex flex-col items-center justify-center gap-1 h-16 sm:h-14 bg-orange-600 hover:bg-orange-700 border-orange-500 text-white rounded-xl active:scale-95 transition-transform text-[10px] sm:text-xs font-medium"
                            onClick={() => {
                              actionMutation.mutate({
                                action: "bulk-disable",
                                userIds: selectedUsers
                              });
                            }}
                            disabled={actionMutation.isPending}
                          >
                            <UserX className="h-5 w-5" />
                            <span>Disable</span>
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex flex-col items-center justify-center gap-1 h-16 sm:h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl active:scale-95 transition-transform text-[10px] sm:text-xs font-medium"
                                disabled={actionMutation.isPending}
                              >
                                <Trash className="h-5 w-5" />
                                <span>Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg mx-auto">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {selectedUsers.length} selected users?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  This will move these Jellyfin users to the recycle bin first: {selectedUserNames.slice(0, 8).join(', ')}{selectedUserNames.length > 8 ? ` +${selectedUserNames.length - 8} more` : ''}. You can restore them later unless another user takes the same username.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => {
                                    actionMutation.mutate({ action: "delete", userIds: selectedUsers });
                                  }}
                                >
                                  Move to Recycle Bin
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}

                    {/* Inactive Users Info */}
                    {showNeverLoggedIn && (
                      <div className="text-center text-sm text-amber-400 mb-4">
                        Found {filteredUsers.filter((user: JellyfinApiUser) => !user.LastLoginDate && !user.Policy?.IsAdministrator).length} inactive users
                      </div>
                    )}

                    {/* Search */}
                    <div className="relative w-full sm:w-64">
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
              
              {/* Mobile user cards */}
              <div className="grid gap-3 md:hidden">
                {filteredUsers.length === 0 ? (
                  <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-6 text-center text-gray-500">
                    No users found
                  </div>
                ) : (
                  filteredUsers.map((user: JellyfinApiUser) => {
                    const isSelected = selectedUsers.includes(user.Id);
                    const isTrialUser = trialUsersList?.some((trialUser: any) => trialUser.username === user.Name);
                    return (
                      <div
                        key={user.Id}
                        className={`rounded-2xl border p-4 shadow-lg transition-colors ${isSelected ? 'border-blue-500/70 bg-blue-950/20' : 'border-gray-800 bg-gray-950/60'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {!user.Policy?.IsAdministrator && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedUsers(prev => prev.filter(id => id !== user.Id));
                                    } else {
                                      setSelectedUsers(prev => [...prev, user.Id]);
                                    }
                                  }}
                                  className="rounded-lg p-1 text-gray-500 active:scale-95"
                                  aria-label={isSelected ? 'Deselect user' : 'Select user'}
                                >
                                  {isSelected ? <CheckSquare className="h-5 w-5 text-blue-400" /> : <Square className="h-5 w-5" />}
                                </button>
                              )}
                              <h3 className="truncate text-base font-semibold text-white">{user.Name}</h3>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {user.Policy?.IsAdministrator ? (
                                <span className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2.5 py-1 text-[11px] font-medium text-indigo-300">Admin</span>
                              ) : user.Policy?.IsDisabled ? (
                                <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/20 px-2.5 py-1 text-[11px] font-medium text-red-300">Disabled</span>
                              ) : (
                                <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/20 px-2.5 py-1 text-[11px] font-medium text-green-300">Active</span>
                              )}
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${isTrialUser ? 'border-blue-500/30 bg-blue-500/20 text-blue-300' : 'border-gray-500/30 bg-gray-500/20 text-gray-300'}`}>
                                {isTrialUser ? 'Trial' : 'Regular'}
                              </span>
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${user.Policy?.EnableContentDownloading ? 'border-blue-500/30 bg-blue-500/20 text-blue-300' : 'border-gray-500/30 bg-gray-500/20 text-gray-300'}`}>
                                Downloads {user.Policy?.EnableContentDownloading ? 'On' : 'Off'}
                              </span>
                              {hasNeverLoggedIn(user) && !user.Policy?.IsAdministrator && (
                                <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-300">Never logged in</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-900/50 p-3 text-xs text-gray-400">
                          <div>
                            <div className="text-gray-500">Last activity</div>
                            <div className="mt-1 font-medium text-gray-200">{formatDate(user.LastActivityDate)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Last login</div>
                            <div className="mt-1 font-medium text-gray-200">{formatDate(user.LastLoginDate)}</div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="flex h-14 flex-col items-center justify-center gap-1 rounded-xl border-gray-700 bg-gray-800 text-[10px] text-white hover:bg-gray-700"
                                onClick={() => setSelectedUser(user)}
                                disabled={actionMutation.isPending}
                              >
                                <Lock className="h-4 w-4 text-amber-400" />
                                Reset
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
                                  {actionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                  Reset Password
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            className="flex h-14 flex-col items-center justify-center gap-1 rounded-xl border-blue-700/60 bg-blue-900/30 text-[10px] text-white hover:bg-blue-800/50 disabled:opacity-40"
                            onClick={() => actionMutation.mutate({ userId: user.Id, action: "toggle-downloads", enableDownloads: !user.Policy?.EnableContentDownloading })}
                            disabled={user.Policy?.IsAdministrator || actionMutation.isPending}
                          >
                            <Download className="h-4 w-4 text-blue-300" />
                            DL
                          </Button>

                          <Button
                            variant="outline"
                            className="flex h-14 flex-col items-center justify-center gap-1 rounded-xl border-orange-700/60 bg-orange-900/30 text-[10px] text-white hover:bg-orange-800/50 disabled:opacity-40"
                            onClick={() => actionMutation.mutate({ userId: user.Id, action: user.Policy?.IsDisabled ? "enable" : "disable" })}
                            disabled={user.Policy?.IsAdministrator || actionMutation.isPending}
                          >
                            {user.Policy?.IsDisabled ? <UserCheck2 className="h-4 w-4 text-green-300" /> : <UserX2 className="h-4 w-4 text-orange-300" />}
                            {user.Policy?.IsDisabled ? 'Enable' : 'Disable'}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="flex h-14 flex-col items-center justify-center gap-1 rounded-xl border-red-700/60 bg-red-900/30 text-[10px] text-white hover:bg-red-800/50 disabled:opacity-40"
                                disabled={user.Policy?.IsAdministrator || actionMutation.isPending}
                              >
                                <Trash className="h-4 w-4 text-red-300" />
                                Delete
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
                                <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => actionMutation.mutate({ userId: user.Id, action: "delete" })}
                                >
                                  {actionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-gray-800 bg-gray-950/40 shadow-xl md:block">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow className="border-gray-800 bg-gray-900/80 hover:bg-gray-900/80">
                      <TableHead className="text-gray-400 w-8">
                        <CheckSquare 
                          className={`h-4 w-4 cursor-pointer ${
                            selectedUsers.length > 0 ? 'text-blue-400' : 'text-gray-600'
                          }`}
                          onClick={() => {
                            if (selectedUsers.length > 0) {
                              setSelectedUsers([]);
                             } else {
                              // For all users tab - select all non-admin users
                              const allUserIds = showNeverLoggedIn 
                                ? filteredUsers
                                    .filter((user: JellyfinApiUser) => !user.LastLoginDate && !user.Policy?.IsAdministrator)
                                    .map((user: any) => user.Id)
                                : filteredUsers
                                    .filter((user: JellyfinApiUser) => !user.Policy?.IsAdministrator)
                                    .map((user: any) => user.Id);
                              setSelectedUsers(allUserIds);
                            }
                          }}
                        />
                      </TableHead>
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
                        <TableRow key={user.Id} className="border-gray-800 transition-colors hover:bg-gray-900/70">
                          <TableCell className="w-8">
                            {!user.Policy?.IsAdministrator && (
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
      </div>
    </AdminLayout>
  );
}
