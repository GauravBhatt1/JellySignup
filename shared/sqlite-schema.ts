import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Trial Users Table
export const trialUsers = sqliteTable("trial_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  signupDate: integer("signup_date", { mode: "timestamp" }).notNull(),
  expiryDate: integer("expiry_date", { mode: "timestamp" }).notNull(),
  isExpired: integer("is_expired", { mode: "boolean" }).default(false).notNull(),
  trialDurationDays: integer("trial_duration_days").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Trial Settings Table (for admin configuration)
export const trialSettings = sqliteTable("trial_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  isTrialModeEnabled: integer("is_trial_mode_enabled", { mode: "boolean" }).default(false).notNull(),
  trialDurationDays: integer("trial_duration_days").default(7).notNull(),
  expiryAction: text("expiry_action").default("disable").notNull(), // "disable" or "delete"
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTrialUserSchema = createInsertSchema(trialUsers).pick({
  username: true,
  signupDate: true,
  expiryDate: true,
  isExpired: true,
  trialDurationDays: true,
});

export const insertTrialSettingsSchema = createInsertSchema(trialSettings).pick({
  isTrialModeEnabled: true,
  trialDurationDays: true,
  expiryAction: true,
});

export const jellyfinUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least one number"),
});

export const trialSettingsSchema = z.object({
  isTrialModeEnabled: z.boolean(),
  trialDurationDays: z.number().min(1).max(30),
  expiryAction: z.enum(["disable", "delete"]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type JellyfinUser = z.infer<typeof jellyfinUserSchema>;
export type TrialUser = typeof trialUsers.$inferSelect;
export type InsertTrialUser = z.infer<typeof insertTrialUserSchema>;
export type TrialSettings = typeof trialSettings.$inferSelect;
export type InsertTrialSettings = z.infer<typeof insertTrialSettingsSchema>;