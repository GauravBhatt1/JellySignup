import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, CheckCircle, AlertCircle, User, Info, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJellyfin } from "@/hooks/use-jellyfin";
import { JellyfinUser, jellyfinUserSchema } from "@shared/schema";
import { JELLYFIN_API_BASE_URL } from "@/lib/jellyfin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { createUser, isCreating, error, success, rateLimitInfo } = useJellyfin();

  // Fetch trial settings to show trial notice
  const { data: trialInfo } = useQuery({
    queryKey: ['/api/trial-info'],
    refetchInterval: 60000, // Refresh every minute
  });

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

  const password = form.watch("password");

  return (
    <Card className="w-full max-w-md rounded-lg glass-card p-6 shadow-xl">
      {/* Form Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold jellyfin-text mb-2">Create Your Account</h2>
        <p className="text-gray-400">Join Jellyfin to access your media library</p>
      </div>

      {/* Trial Mode Notice */}
      {trialInfo?.isTrialModeEnabled && (
        <Alert className="mb-6 bg-blue-500/10 border border-blue-800/30 rounded-lg">
          <Clock className="h-5 w-5 text-blue-400" />
          <AlertDescription className="text-sm font-medium text-blue-300">
            <div className="flex flex-col gap-1">
              <div className="font-semibold">Free Trial Available!</div>
              <div>
                New accounts get a <strong>{trialInfo.trialDurationDays} day</strong> free trial. 
                Your account will be automatically managed after the trial period.
              </div>
            </div>
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
            Account created successfully! Redirecting you to Jellyfin...
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
                <span className="animate-spin mr-2">
                  <svg 
                    className="h-5 w-5" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" cy="12" r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
                Creating account...
              </>
            ) : (
              "Create Account"
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
    </Card>
  );
}
