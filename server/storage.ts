import { users, type User, type InsertUser, type TrialUser, type InsertTrialUser, type TrialSettings, type InsertTrialSettings } from "@shared/schema";

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
    // Initialize default trial settings
    this.trialSettings = {
      id: 1,
      isTrialModeEnabled: false,
      trialDurationDays: 7,
      expiryAction: "disable",
      updatedAt: new Date(),
    };
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
      isTrialModeEnabled: settings.isTrialModeEnabled,
      trialDurationDays: settings.trialDurationDays,
      expiryAction: settings.expiryAction,
      updatedAt: new Date(),
    };
    return this.trialSettings;
  }
}

export const storage = new MemStorage();
