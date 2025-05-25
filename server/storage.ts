import { connectMongoDB, UserModel, TrialUserModel, TrialSettingsModel } from "./mongodb";
import { type User, type InsertUser, type TrialUser, type InsertTrialUser, type TrialSettings, type InsertTrialSettings } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

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
    return await db.select().from(trialUsers).where(eq(trialUsers.isExpired, true));
  }

  async markTrialUserExpired(username: string): Promise<void> {
    await db.update(trialUsers)
      .set({ isExpired: true })
      .where(eq(trialUsers.username, username));
  }

  async deleteTrialUser(username: string): Promise<void> {
    await db.delete(trialUsers).where(eq(trialUsers.username, username));
  }

  async getTrialSettings(): Promise<TrialSettings | undefined> {
    const [settings] = await db.select().from(trialSettings).limit(1);
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = {
        isTrialModeEnabled: true,
        trialDurationDays: 7,
        expiryAction: "disable" as const,
      };
      const [created] = await db
        .insert(trialSettings)
        .values(defaultSettings)
        .returning();
      return created;
    }
    return settings;
  }

  async updateTrialSettings(settings: InsertTrialSettings): Promise<TrialSettings> {
    const existing = await this.getTrialSettings();
    if (existing) {
      const [updated] = await db
        .update(trialSettings)
        .set(settings)
        .where(eq(trialSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(trialSettings)
        .values(settings)
        .returning();
      return created;
    }
  }
}

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
    // Initialize default trial settings - ALWAYS ENABLED
    this.trialSettings = {
      id: 1,
      isTrialModeEnabled: true,
      trialDurationDays: 7,
      expiryAction: "disable", 
      updatedAt: new Date(),
    };
    console.log("🎯 Trial settings initialized: ENABLED by default");
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Trial Users Management
  async createTrialUser(insertTrialUser: InsertTrialUser): Promise<TrialUser> {
    const id = this.currentTrialId++;
    const now = new Date();
    const trialUser: TrialUser = {
      id,
      username: insertTrialUser.username,
      signupDate: now,
      expiryDate: insertTrialUser.expiryDate,
      isExpired: false,
      trialDurationDays: insertTrialUser.trialDurationDays,
      createdAt: now,
    };
    this.trialUsers.set(id, trialUser);
    return trialUser;
  }

  async getTrialUser(username: string): Promise<TrialUser | undefined> {
    return Array.from(this.trialUsers.values()).find(
      (trialUser) => trialUser.username === username,
    );
  }

  async getAllTrialUsers(): Promise<TrialUser[]> {
    return Array.from(this.trialUsers.values());
  }

  async getExpiredTrialUsers(): Promise<TrialUser[]> {
    const now = new Date();
    return Array.from(this.trialUsers.values()).filter(
      trialUser => trialUser.expiryDate <= now && !trialUser.isExpired
    );
  }

  async markTrialUserExpired(username: string): Promise<void> {
    const trialUsersArray = Array.from(this.trialUsers.entries());
    for (const [id, trialUser] of trialUsersArray) {
      if (trialUser.username === username) {
        this.trialUsers.set(id, { ...trialUser, isExpired: true });
        break;
      }
    }
  }

  async deleteTrialUser(username: string): Promise<void> {
    const trialUsersArray = Array.from(this.trialUsers.entries());
    for (const [id, trialUser] of trialUsersArray) {
      if (trialUser.username === username) {
        this.trialUsers.delete(id);
        break;
      }
    }
  }

  // Trial Settings Management
  async getTrialSettings(): Promise<TrialSettings | undefined> {
    if (!this.trialSettings) {
      this.trialSettings = {
        id: 1,
        isTrialModeEnabled: true,
        trialDurationDays: 7,
        expiryAction: "disable",
        updatedAt: new Date(),
      };
    }
    return this.trialSettings;
  }

  async updateTrialSettings(settings: InsertTrialSettings): Promise<TrialSettings> {
    if (!this.trialSettings) {
      this.trialSettings = {
        id: 1,
        isTrialModeEnabled: false,
        trialDurationDays: 7,
        expiryAction: "disable",
        updatedAt: new Date(),
      };
    }
    
    this.trialSettings = {
      id: this.trialSettings.id,
      isTrialModeEnabled: settings.isTrialModeEnabled !== undefined ? settings.isTrialModeEnabled : this.trialSettings.isTrialModeEnabled,
      trialDurationDays: settings.trialDurationDays !== undefined ? settings.trialDurationDays : this.trialSettings.trialDurationDays,
      expiryAction: settings.expiryAction !== undefined ? settings.expiryAction : this.trialSettings.expiryAction,
      updatedAt: new Date(),
    };
    return this.trialSettings;
  }
}

// MongoDB Storage Class
export class MongoStorage implements IStorage {
  constructor() {
    connectMongoDB().catch(console.error);
  }

  async getUser(id: number): Promise<User | undefined> {
    const user = await UserModel.findById(id);
    return user ? { id: parseInt(user._id.toString()), username: user.username, password: user.password } : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username });
    return user ? { id: parseInt(user._id.toString()), username: user.username, password: user.password } : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = new UserModel(insertUser);
    const savedUser = await user.save();
    return { id: parseInt(savedUser._id.toString()), username: savedUser.username, password: savedUser.password };
  }

  async createTrialUser(insertTrialUser: InsertTrialUser): Promise<TrialUser> {
    const trialUser = new TrialUserModel(insertTrialUser);
    const savedTrialUser = await trialUser.save();
    return {
      id: parseInt(savedTrialUser._id.toString()),
      username: savedTrialUser.username,
      signupDate: savedTrialUser.signupDate,
      expiryDate: savedTrialUser.expiryDate,
      isExpired: savedTrialUser.isExpired,
      trialDurationDays: savedTrialUser.trialDurationDays,
      createdAt: savedTrialUser.createdAt,
    };
  }

  async getTrialUser(username: string): Promise<TrialUser | undefined> {
    const trialUser = await TrialUserModel.findOne({ username });
    return trialUser ? {
      id: parseInt(trialUser._id.toString()),
      username: trialUser.username,
      signupDate: trialUser.signupDate,
      expiryDate: trialUser.expiryDate,
      isExpired: trialUser.isExpired,
      trialDurationDays: trialUser.trialDurationDays,
      createdAt: trialUser.createdAt,
    } : undefined;
  }

  async getAllTrialUsers(): Promise<TrialUser[]> {
    const trialUsers = await TrialUserModel.find();
    return trialUsers.map(user => ({
      id: parseInt(user._id.toString()),
      username: user.username,
      signupDate: user.signupDate,
      expiryDate: user.expiryDate,
      isExpired: user.isExpired,
      trialDurationDays: user.trialDurationDays,
      createdAt: user.createdAt,
    }));
  }

  async getExpiredTrialUsers(): Promise<TrialUser[]> {
    const expiredUsers = await TrialUserModel.find({ isExpired: true });
    return expiredUsers.map(user => ({
      id: parseInt(user._id.toString()),
      username: user.username,
      signupDate: user.signupDate,
      expiryDate: user.expiryDate,
      isExpired: user.isExpired,
      trialDurationDays: user.trialDurationDays,
      createdAt: user.createdAt,
    }));
  }

  async markTrialUserExpired(username: string): Promise<void> {
    await TrialUserModel.updateOne({ username }, { isExpired: true });
  }

  async deleteTrialUser(username: string): Promise<void> {
    await TrialUserModel.deleteOne({ username });
  }

  async getTrialSettings(): Promise<TrialSettings | undefined> {
    let settings = await TrialSettingsModel.findOne();
    if (!settings) {
      // Create default settings
      settings = new TrialSettingsModel({
        isTrialModeEnabled: true,
        trialDurationDays: 7,
        expiryAction: 'disable'
      });
      await settings.save();
    }
    return {
      id: parseInt(settings._id.toString()),
      isTrialModeEnabled: settings.isTrialModeEnabled,
      trialDurationDays: settings.trialDurationDays,
      expiryAction: settings.expiryAction,
      updatedAt: settings.updatedAt,
    };
  }

  async updateTrialSettings(newSettings: InsertTrialSettings): Promise<TrialSettings> {
    let settings = await TrialSettingsModel.findOne();
    
    if (settings) {
      settings.isTrialModeEnabled = newSettings.isTrialModeEnabled ?? settings.isTrialModeEnabled;
      settings.trialDurationDays = newSettings.trialDurationDays ?? settings.trialDurationDays;
      settings.expiryAction = newSettings.expiryAction ?? settings.expiryAction;
      settings.updatedAt = new Date();
      await settings.save();
    } else {
      settings = new TrialSettingsModel({
        ...newSettings,
        updatedAt: new Date()
      });
      await settings.save();
    }

    return {
      id: parseInt(settings._id.toString()),
      isTrialModeEnabled: settings.isTrialModeEnabled,
      trialDurationDays: settings.trialDurationDays,
      expiryAction: settings.expiryAction,
      updatedAt: settings.updatedAt,
    };
  }
}

export const storage = new MongoStorage();
