import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { JellyfinUser } from "@shared/schema";

export function useJellyfin() {
  const [success, setSuccess] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{remaining: number; reset: string} | null>(null);

  const mutation = useMutation({
    mutationFn: async (userData: JellyfinUser) => {
      setError(null);
      setMessage(null);
      setPendingApproval(false);
      const res = await apiRequest("POST", "/api/jellyfin/users", userData);
      
      // Extract rate limit information from headers
      if (res.headers) {
        const remaining = res.headers.get('RateLimit-Remaining');
        const reset = res.headers.get('RateLimit-Reset');
        
        if (remaining !== null && reset !== null) {
          // Convert reset timestamp to readable format
          const resetDate = new Date(parseInt(reset) * 1000);
          const resetTime = resetDate.toLocaleTimeString();
          
          setRateLimitInfo({
            remaining: parseInt(remaining),
            reset: resetTime
          });
        }
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      setError(null);
      setMessage(data.message || null);

      if (data.status === "pending") {
        setPendingApproval(true);
        setSuccess(false);
        return;
      }

      setSuccess(true);
      
      // Redirect to Jellyfin after a short delay
      setTimeout(() => {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      }, 3000);
    },
    onError: (err: Error) => {
      setSuccess(false);
      setPendingApproval(false);
      
      // Check if error is rate limit related
      if (err.message.includes("Too many signup attempts")) {
        setError("You've reached the maximum number of signup attempts. Please try again later.");
      } else {
        setError(err.message);
      }
    },
  });

  return {
    createUser: mutation.mutate,
    isCreating: mutation.isPending,
    error,
    success,
    pendingApproval,
    message,
    rateLimitInfo
  };
}
