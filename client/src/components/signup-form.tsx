import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, CheckCircle, AlertCircle, User, Info, Clock, Loader2 } from "lucide-react";
import { useJellyfin } from "@/hooks/use-jellyfin";
import { JellyfinUser, jellyfinUserSchema } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordStrength } from "./password-strength";
import { useQuery } from "@tanstack/react-query";

interface TrialInfo {
  isTrialModeEnabled: boolean;
  trialDurationDays?: number;
}

interface ApprovalInfo {
  requireAdminApproval: boolean;
}

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [statusUsername, setStatusUsername] = useState("");
  const [statusPassword, setStatusPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<"pending" | "approved" | "rejected" | "error" | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { createUser, isCreating, error, success, pendingApproval, message, rateLimitInfo } = useJellyfin();

  // Fetch trial settings to show trial notice
  const { data: trialInfo } = useQuery<TrialInfo>({
    queryKey: ['/api/trial-info'],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: approvalInfo } = useQuery<ApprovalInfo>({
    queryKey: ['/api/approval-info'],
    refetchInterval: 60000,
  });

  const isTrialMode = Boolean(trialInfo?.isTrialModeEnabled);
  const trialDays = trialInfo?.trialDurationDays ?? 7;

  const form = useForm<JellyfinUser>({
    resolver: zodResolver(jellyfinUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: JellyfinUser) => {
    await createUser(data);
  };

  const checkAccountStatus = async () => {
    setIsCheckingStatus(true);
    setStatusMessage(null);
    setStatusKind(null);
    try {
      const res = await fetch("/api/account-status", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: statusUsername, password: statusPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to check account status");
      setStatusKind(data.status || "error");
      setStatusMessage(data.message);
      if (data.status === "approved" && data.redirectUrl) {
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 2500);
      }
    } catch (err) {
      setStatusKind("error");
      setStatusMessage(err instanceof Error ? err.message : "Failed to check account status");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const password = form.watch("password");
  const isApprovalRequired = Boolean(approvalInfo?.requireAdminApproval);

  return (
    <Card className="w-full max-w-md rounded-lg glass-card p-6 shadow-xl">
      {/* Form Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold jellyfin-text mb-2">Create Your Account</h2>
        <p className="text-gray-400">Join Jellyfin to access your media library</p>
      </div>

      {/* Trial Mode Notice */}
      {isTrialMode && (
        <Alert className="mb-6 bg-blue-500/10 border border-blue-800/30 rounded-lg">
          <Clock className="h-5 w-5 text-blue-400" />
          <AlertDescription className="text-sm font-medium text-blue-300">
            <div className="flex flex-col gap-1">
              <div className="font-semibold">Free Trial Available!</div>
              <div>
                New accounts get a <strong>{trialDays} day</strong> free trial. 
                Your account will be automatically managed after the trial period.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isApprovalRequired && (
        <Alert className="mb-6 bg-amber-500/10 border border-amber-800/30 rounded-lg">
          <Clock className="h-5 w-5 text-amber-300" />
          <AlertDescription className="text-sm font-medium text-amber-200">
            New account requests require admin approval before Jellyfin access is created.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6 bg-red-500/10 border border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <AlertDescription className="text-sm font-medium text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-500/10 border border-green-800 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <AlertDescription className="text-sm font-medium text-green-400">
            {message || "Account created successfully! Redirecting you to Jellyfin..."}
          </AlertDescription>
        </Alert>
      )}

      {pendingApproval && (
        <Alert className="mb-6 bg-amber-500/10 border border-amber-800/40 rounded-lg">
          <Clock className="h-5 w-5 text-amber-300" />
          <AlertDescription className="whitespace-pre-line text-sm font-medium text-amber-200">
            {message || "Your account request has been sent.\n\nPlease wait up to 2 days for admin approval.\n\nYou can use the same username and password to log in later and check your account status."}
          </AlertDescription>
        </Alert>
      )}

      {/* Rate limit info display */}
      {rateLimitInfo && (
        <div className="mb-6 flex items-start bg-blue-500/10 border border-blue-800/30 rounded-lg p-3">
          <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-300">
            <p>
              For security reasons, we limit the number of signup attempts.
              You have <strong>{rateLimitInfo.remaining}</strong> attempt{rateLimitInfo.remaining !== 1 ? 's' : ''} remaining.
              {rateLimitInfo.remaining < 2 && (
                <span> Rate limit resets at {rateLimitInfo.reset}.</span>
              )}
            </p>
          </div>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-200 font-medium">Username</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <User className="h-5 w-5" />
                    </div>
                    <Input
                      {...field}
                      placeholder="Enter username"
                      className="bg-[#12122c]/80 pl-10 border-indigo-900/30 text-white placeholder-gray-400 rounded-lg h-12 jellyfin-input"
                    />
                    {field.value && !form.formState.errors.username && (
                      <CheckCircle className="absolute right-3 top-3.5 h-5 w-5 text-green-400" />
                    )}
                  </div>
                </FormControl>
                <FormMessage className="text-red-400 text-sm mt-1" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-200 font-medium">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="bg-[#12122c]/80 border-indigo-900/30 text-white placeholder-gray-400 pr-10 rounded-lg h-12 jellyfin-input"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white focus:outline-none transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-red-400 text-sm mt-1" />
              </FormItem>
            )}
          />

          <PasswordStrength password={password} />

          <Button
            type="submit"
            className="w-full jellyfin-button font-medium py-3 rounded-lg h-12"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isApprovalRequired ? "Sending request..." : "Creating account..."}
              </>
            ) : (
              isApprovalRequired ? "Request Account" : "Create Account"
            )}
          </Button>
          
          <div className="text-center mt-4 pt-4 border-t border-gray-800">
            <p className="text-gray-400 mb-2">Already have an account?</p>
            <Button 
              type="button" 
              variant="outline"
              className="w-full bg-[#12122c]/60 backdrop-blur-sm border border-indigo-900/40 hover:bg-[#12122c]/80 text-gray-300"
              onClick={() => window.open("https://freemiuminfo.eu.org", "_blank")}
            >
              Login to Jellyfin
            </Button>
          </div>
        </form>
      </Form>

      {isApprovalRequired && (
        <div className="mt-6 border-t border-gray-800 pt-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-200">Check Account Status</h3>
            <p className="mt-1 text-xs text-gray-500">Use the same username and password you requested with.</p>
          </div>
          <div className="space-y-3">
            <Input
              value={statusUsername}
              onChange={(event) => setStatusUsername(event.target.value)}
              placeholder="Username"
              className="bg-[#12122c]/80 border-indigo-900/30 text-white placeholder-gray-400 rounded-lg h-11 jellyfin-input"
            />
            <Input
              value={statusPassword}
              onChange={(event) => setStatusPassword(event.target.value)}
              type="password"
              placeholder="Password"
              className="bg-[#12122c]/80 border-indigo-900/30 text-white placeholder-gray-400 rounded-lg h-11 jellyfin-input"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full bg-[#12122c]/60 backdrop-blur-sm border border-indigo-900/40 hover:bg-[#12122c]/80 text-gray-300"
              disabled={isCheckingStatus || statusUsername.trim().length < 3 || statusPassword.length < 8}
              onClick={checkAccountStatus}
            >
              {isCheckingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Info className="mr-2 h-4 w-4" />}
              Check Status
            </Button>
            {statusMessage && (
              <Alert className={`rounded-lg ${
                statusKind === "approved" ? "border-green-800 bg-green-500/10" :
                statusKind === "rejected" || statusKind === "error" ? "border-red-800 bg-red-500/10" :
                "border-amber-800/40 bg-amber-500/10"
              }`}>
                {statusKind === "approved" ? <CheckCircle className="h-5 w-5 text-green-400" /> : <AlertCircle className="h-5 w-5 text-amber-300" />}
                <AlertDescription className={`whitespace-pre-line text-sm font-medium ${
                  statusKind === "approved" ? "text-green-400" :
                  statusKind === "rejected" || statusKind === "error" ? "text-red-300" :
                  "text-amber-200"
                }`}>
                  {statusMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
