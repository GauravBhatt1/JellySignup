import { connectMongoDB, UserModel, TrialUserModel, TrialSettingsModel } from "./mongodb";
import { type User, type InsertUser, type TrialUser, type InsertTrialUser, type TrialSettings, type InsertTrialSettings } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
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

export class MongoStorage implements IStorage {
  private initialized = false;

  private async ensureConnection() {
    if (!this.initialized) {
      await connectMongoDB();
      this.initialized = true;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.ensureConnection();
    const user = await UserModel.findById(id);
    return user ? { id: user._id.toString(), username: user.username, password: user.password } : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureConnection();
    const user = await UserModel.findOne({ username });
    return user ? { id: user._id.toString(), username: user.username, password: user.password } : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.ensureConnection();
    const user = new UserModel(insertUser);
    const savedUser = await user.save();
    return { id: savedUser._id.toString(), username: savedUser.username, password: savedUser.password };
  }

  async createTrialUser(insertTrialUser: InsertTrialUser): Promise<TrialUser> {
    await this.ensureConnection();
    const trialUser = new TrialUserModel({
      ...insertTrialUser,
      signupDate: insertTrialUser.signupDate || new Date(),
      createdAt: new Date(),
    });
    const savedTrialUser = await trialUser.save();
    return {
      id: savedTrialUser._id.toString(),
      username: savedTrialUser.username,
      signupDate: savedTrialUser.signupDate,
      expiryDate: savedTrialUser.expiryDate,
      isExpired: savedTrialUser.isExpired,
      trialDurationDays: savedTrialUser.trialDurationDays,
      createdAt: savedTrialUser.createdAt,
    };
  }

  async getTrialUser(username: string): Promise<TrialUser | undefined> {
    await this.ensureConnection();
    const trialUser = await TrialUserModel.findOne({ username });
    return trialUser ? {
      id: trialUser._id.toString(),
      username: trialUser.username,
      signupDate: trialUser.signupDate,
      expiryDate: trialUser.expiryDate,
      isExpired: trialUser.isExpired,
      trialDurationDays: trialUser.trialDurationDays,
      createdAt: trialUser.createdAt,
    } : undefined;
  }

  async getAllTrialUsers(): Promise<TrialUser[]> {
    await this.ensureConnection();
    const trialUsers = await TrialUserModel.find();
    return trialUsers.map(user => ({
      id: user._id.toString(),
      username: user.username,
      signupDate: user.signupDate,
      expiryDate: user.expiryDate,
      isExpired: user.isExpired,
      trialDurationDays: user.trialDurationDays,
      createdAt: user.createdAt,
    }));
  }

  async getExpiredTrialUsers(): Promise<TrialUser[]> {
    await this.ensureConnection();
    const now = new Date();
    const expiredUsers = await TrialUserModel.find({
      $or: [
        { isExpired: true },
        { expiryDate: { $lte: now } }
      ]
    });
    return expiredUsers.map(user => ({
      id: user._id.toString(),
      username: user.username,
      signupDate: user.signupDate,
      expiryDate: user.expiryDate,
      isExpired: user.isExpired,
      trialDurationDays: user.trialDurationDays,
      createdAt: user.createdAt,
    }));
  }

  async markTrialUserExpired(username: string): Promise<void> {
    await this.ensureConnection();
    await TrialUserModel.updateOne({ username }, { isExpired: true });
  }

  async deleteTrialUser(username: string): Promise<void> {
    await this.ensureConnection();
    await TrialUserModel.deleteOne({ username });
  }

  async getTrialSettings(): Promise<TrialSettings | undefined> {
    await this.ensureConnection();
    let settings = await TrialSettingsModel.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new TrialSettingsModel({
        isTrialModeEnabled: true,
        trialDurationDays: 7,
        expiryAction: 'disable',
      });
      await settings.save();
    }
    
    return {
      id: settings._id.toString(),
      isTrialModeEnabled: settings.isTrialModeEnabled,
      trialDurationDays: settings.trialDurationDays,
      expiryAction: settings.expiryAction,
      updatedAt: settings.updatedAt,
    };
  }

  async updateTrialSettings(insertSettings: InsertTrialSettings): Promise<TrialSettings> {
    await this.ensureConnection();
    const updatedSettings = await TrialSettingsModel.findOneAndUpdate(
      {},
      { ...insertSettings, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    
    return {
      id: updatedSettings._id.toString(),
      isTrialModeEnabled: updatedSettings.isTrialModeEnabled,
      trialDurationDays: updatedSettings.trialDurationDays,
      expiryAction: updatedSettings.expiryAction,
      updatedAt: updatedSettings.updatedAt,
    };
  }
}

export const storage = new MongoStorage();