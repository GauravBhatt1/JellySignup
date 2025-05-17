// Client-side Jellyfin API utility functions
// This file can be used to add additional client-side Jellyfin functionality if needed
import { JellyfinUser } from "@shared/schema";

// Constants
export const JELLYFIN_API_BASE_URL = import.meta.env.VITE_JELLYFIN_SERVER_URL || "";
