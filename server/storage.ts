import { users, trialUsers, trialSettings, type User, type InsertUser, type TrialUser, type InsertTrialUser, type TrialSettings, type InsertTrialSettings } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Trial Users Management
  createTrialUser(trialUser: InsertTrialUser): Promise<TrialUser>;
  getTrialUser(username: string): Promise<TrialUser | undefined>;
  getAllTrialUsers(): Promise<TrialUser[]>;
  getExpiredTrialUsers(): Promise<TrialUser[]>;
  markTrialUserExpired(username: string): Promise<void>;
  deleteTrialUser(username: string): Promise<void>;
  
  // Trial Settings Management
  getTrialSettings(): Promise<TrialSettings | undefined>;
  updateTrialSettings(settings: InsertTrialSettings): Promise<TrialSettings>;
}

// Database Storage using PostgreSQL
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createTrialUser(insertTrialUser: InsertTrialUser): Promise<TrialUser> {
    const [trialUser] = await db
      .insert(trialUsers)
      .values(insertTrialUser)
      .returning();
    return trialUser;
  }

  async getTrialUser(username: string): Promise<TrialUser | undefined> {
    const [trialUser] = await db.select().from(trialUsers).where(eq(trialUsers.username, username));
    return trialUser || undefined;
  }

  async getAllTrialUsers(): Promise<TrialUser[]> {
    return await db.select().from(trialUsers);
  }

  async getExpiredTrialUsers(): Promise<TrialUser[]> {
    const now = new Date();
    // Get users who are either marked as expired OR have passed their expiry date
    const allTrialUsers = await db.select().from(trialUsers);
    return allTrialUsers.filter((user: any) => 
      user.isExpired || new Date(user.expiryDate) < now
    );
  }

  async markTrialUserExpired(username: string): Promise<void> {
    await db
      .update(trialUsers)
      .set({ isExpired: true })
      .where(eq(trialUsers.username, username));
  }

  async deleteTrialUser(username: string): Promise<void> {
    await db.delete(trialUsers).where(eq(trialUsers.username, username));
  }

  async getTrialSettings(): Promise<TrialSettings | undefined> {
    const [settings] = await db.select().from(trialSettings);
    return settings || undefined;
  }

  async updateTrialSettings(newSettings: InsertTrialSettings): Promise<TrialSettings> {
    // Check if settings exist
    const existing = await this.getTrialSettings();
    
    if (existing) {
      const [updated] = await db
        .update(trialSettings)
        .set(newSettings)
        .where(eq(trialSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(trialSettings)
        .values(newSettings)
        .returning();
      return created;
    }
  }
}

// Memory Storage for development
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private trialUsers: Map<number, TrialUser>;
  private trialSettings: TrialSettings | undefined;
  currentId: number;
  currentTrialId: number;

  constructor() {
    this.users = new Map();
    this.trialUsers = new Map();
    this.currentId = 1;
    this.currentTrialId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTrialUser(insertTrialUser: InsertTrialUser): Promise<TrialUser> {
    const id = this.currentTrialId++;
    const trialUser: TrialUser = {
      ...insertTrialUser,
      id,
      createdAt: new Date(),
    };
    this.trialUsers.set(id, trialUser);
    return trialUser;
  }

  async getTrialUser(username: string): Promise<TrialUser | undefined> {
    for (const trialUser of this.trialUsers.values()) {
      if (trialUser.username === username) {
        return trialUser;
      }
    }
    return undefined;
  }

  async getAllTrialUsers(): Promise<TrialUser[]> {
    return Array.from(this.trialUsers.values());
  }

  async getExpiredTrialUsers(): Promise<TrialUser[]> {
    const now = new Date();
    return Array.from(this.trialUsers.values()).filter(user => 
      user.isExpired || new Date(user.expiryDate) < now
    );
  }

  async markTrialUserExpired(username: string): Promise<void> {
    const trialUser = await this.getTrialUser(username);
    if (trialUser) {
      trialUser.isExpired = true;
      this.trialUsers.set(trialUser.id, trialUser);
    }
  }

  async deleteTrialUser(username: string): Promise<void> {
    for (const [id, trialUser] of this.trialUsers.entries()) {
      if (trialUser.username === username) {
        this.trialUsers.delete(id);
        break;
      }
    }
  }

  async getTrialSettings(): Promise<TrialSettings | undefined> {
    return this.trialSettings;
  }

  async updateTrialSettings(settings: InsertTrialSettings): Promise<TrialSettings> {
    this.trialSettings = {
      id: 1,
      ...settings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.trialSettings;
  }
}

import { MongoStorage } from './mongo-storage';

// Auto-detect storage based on environment
// If DATABASE_URL exists and starts with mongodb, use MongoDB
// FORCE_MONGODB flag can override detection for VPS deployment
const isDatabaseUrlMongoDB = process.env.DATABASE_URL?.startsWith('mongodb');
// Only use MongoDB if DATABASE_URL is MongoDB format or explicitly forced
const forceMongoForVPS = process.env.FORCE_MONGODB === 'true' || process.env.NODE_ENV === 'production';
const useMongoStorage = isDatabaseUrlMongoDB || forceMongoForVPS;

console.log(`Storage Configuration:
  DATABASE_URL detected: ${process.env.DATABASE_URL ? 'Yes' : 'No'}
  MongoDB URL detected: ${isDatabaseUrlMongoDB ? 'Yes' : 'No'}
  FORCE_MONGODB flag: ${forceMongoForVPS ? 'Yes' : 'No'}
  Using storage: ${useMongoStorage ? 'MongoDB' : 'Memory'}`);

export const storage = useMongoStorage ? new MongoStorage() : new MemStorage();