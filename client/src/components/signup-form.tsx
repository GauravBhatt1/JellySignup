import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJellyfin } from "@/hooks/use-jellyfin";
import { JellyfinUser, jellyfinUserSchema } from "@shared/schema";
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

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { createUser, isCreating, error, success } = useJellyfin();

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
    <Card className="w-full max-w-md rounded-lg border border-jellyfinBorder bg-jellyfinDark p-6 shadow-lg">
      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-800">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-sm font-medium text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-500/10 border-green-800">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-sm font-medium text-green-400">
            Account created successfully! Redirecting you to Jellyfin...
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-200">Username</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      placeholder="Enter username"
                      className="bg-gray-700 border-jellyfinBorder text-white placeholder-gray-400"
                    />
                    {field.value && !form.formState.errors.username && (
                      <CheckCircle className="absolute right-3 top-2.5 h-4 w-4 text-green-400" />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-200">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="bg-gray-700 border-jellyfinBorder text-white placeholder-gray-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-white focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <PasswordStrength password={password} />

          <Button
            type="submit"
            className="w-full bg-jellyfinPurple hover:bg-jellyfinPurple/90"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <span className="animate-spin mr-2">
                  <svg 
                    className="h-4 w-4" 
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
        </form>
      </Form>
    </Card>
  );
}
