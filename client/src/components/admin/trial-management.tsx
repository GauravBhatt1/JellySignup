import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock, Users, Settings } from "lucide-react";

interface TrialSettings {
  isTrialModeEnabled: boolean;
  trialDurationDays: number;
  expiryAction: "disable" | "delete";
}

interface TrialUser {
  id: number;
  username: string;
  signupDate: string;
  expiryDate: string;
  isExpired: boolean;
  trialDurationDays: number;
}

export function TrialManagement() {
  const [settings, setSettings] = useState<TrialSettings>({
    isTrialModeEnabled: false,
    trialDurationDays: 7,
    expiryAction: "disable"
  });
  const [trialUsers, setTrialUsers] = useState<TrialUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTrialSettings();
    loadTrialUsers();
  }, []);

  const loadTrialSettings = async () => {
    try {
      const response = await fetch('/api/admin/trial-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading trial settings:', error);
      toast({
        title: "Error",
        description: "Failed to load trial settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTrialUsers = async () => {
    try {
      const response = await fetch('/api/admin/trial-users');
      if (response.ok) {
        const data = await response.json();
        setTrialUsers(data);
      }
    } catch (error) {
      console.error('Error loading trial users:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/trial-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Trial settings updated successfully",
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving trial settings:', error);
      toast({
        title: "Error",
        description: "Failed to update trial settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const processExpiredTrials = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/process-expired-trials', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message,
        });
        loadTrialUsers(); // Refresh the list
      } else {
        throw new Error('Failed to process expired trials');
      }
    } catch (error) {
      console.error('Error processing expired trials:', error);
      toast({
        title: "Error",
        description: "Failed to process expired trials",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getDaysRemaining = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (user: TrialUser) => {
    if (user.isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    const daysRemaining = getDaysRemaining(user.expiryDate);
    if (daysRemaining <= 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysRemaining <= 3) {
      return <Badge variant="secondary">Expires in {daysRemaining}d</Badge>;
    } else {
      return <Badge variant="outline">{daysRemaining} days left</Badge>;
    }
  };

  if (loading) {
    return <div className="p-4">Loading trial management...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Trial Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Free Trial Settings
          </CardTitle>
          <CardDescription>
            Configure free trial mode for new user registrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="trial-mode"
              checked={settings.isTrialModeEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, isTrialModeEnabled: checked })
              }
            />
            <Label htmlFor="trial-mode">Enable Free Trial Mode</Label>
          </div>

          {settings.isTrialModeEnabled && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trial-duration">Trial Duration (Days)</Label>
                  <Select
                    value={settings.trialDurationDays.toString()}
                    onValueChange={(value) => {
                      setSettings(prev => ({
                        ...prev,
                        trialDurationDays: parseInt(value),
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day} {day === 1 ? 'Day' : 'Days'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose between 1 to 30 days
                  </p>
                </div>

                <div>
                  <Label htmlFor="expiry-action">Action After Trial Expires</Label>
                  <Select
                    value={settings.expiryAction}
                    onValueChange={(value: "disable" | "delete") =>
                      setSettings({ ...settings, expiryAction: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disable">Disable Account</SelectItem>
                      <SelectItem value="delete">Delete Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  When trial mode is enabled, all new signups will be marked as trial users with access for {settings.trialDurationDays} days.
                </p>
              </div>
            </div>
          )}

          <Button onClick={saveSettings} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Trial Users Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Trial Users ({trialUsers.length})
          </CardTitle>
          <CardDescription>
            Manage users with trial accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trialUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No trial users found
            </p>
          ) : (
            <div className="space-y-3">
              {trialUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires: {new Date(user.expiryDate).toLocaleDateString()}
                      </span>
                      <span>
                        Signup: {new Date(user.signupDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(user)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              onClick={processExpiredTrials}
              disabled={processing}
              variant="outline"
            >
              {processing ? "Processing..." : "Process Expired Trials"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will {settings.expiryAction === 'delete' ? 'delete' : 'disable'} all expired trial accounts
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}