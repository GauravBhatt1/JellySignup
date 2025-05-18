import { z } from "zod";

// Admin authentication schema
export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Admin credentials check (will be matched against environment variables)
export const adminCredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
  isAuthenticated: z.boolean().default(false),
});

// Admin actions for user management
export const userActionSchema = z.object({
  userId: z.string().min(1, "User ID is required").optional(),
  action: z.enum(["delete", "enable", "disable", "reset-password", "bulk-disable"]),
  newPassword: z.string().optional(),
  userIds: z.array(z.string()).optional(),
});

export type AdminLogin = z.infer<typeof adminLoginSchema>;
export type AdminCredentials = z.infer<typeof adminCredentialsSchema>;
export type UserAction = z.infer<typeof userActionSchema>;