import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const form = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: AdminLoginForm) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/admin/login", data);
      
      if (response.ok) {
        toast({
          title: "Login successful",
          description: "Welcome to the admin dashboard",
        });
        // Use window.location for hard navigation to reload the page
        window.location.href = "/admin/dashboard";
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: error.message || "Invalid credentials",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An error occurred while logging in",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-[#0a0d14] to-[#121725]">
      <Card className="w-full max-w-md rounded-xl glass-card p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <LockKeyhole className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold gradient-text mb-2">Admin Login</h2>
          <p className="text-gray-400">Enter your Jellyfin administrator credentials</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200 font-medium">Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Your Jellyfin admin username"
                      className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 rounded-lg h-12 glow-input focus:border-purple-500"
                    />
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
                        placeholder="Your Jellyfin admin password"
                        className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 pr-10 rounded-lg h-12 glow-input focus:border-purple-500"
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

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg h-12 glow-button"
              disabled={isLoading}
            >
              {isLoading ? (
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
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Only Jellyfin administrators can access the admin dashboard.</p>
          <p className="mt-1">Use the same credentials you use to log in to Jellyfin with administrator rights.</p>
        </div>
      </Card>
    </div>
  );
}