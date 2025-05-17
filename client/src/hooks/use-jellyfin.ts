import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { JellyfinUser } from "@shared/schema";

export function useJellyfin() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (userData: JellyfinUser) => {
      setError(null);
      const res = await apiRequest("POST", "/api/jellyfin/users", userData);
      return res.json();
    },
    onSuccess: (data) => {
      setSuccess(true);
      setError(null);
      
      // Redirect to Jellyfin after a short delay
      setTimeout(() => {
        window.location.href = data.redirectUrl;
      }, 3000);
    },
    onError: (err: Error) => {
      setSuccess(false);
      setError(err.message);
    },
  });

  return {
    createUser: mutation.mutate,
    isCreating: mutation.isPending,
    error,
    success,
  };
}
