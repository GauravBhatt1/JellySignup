import mongoose from 'mongoose';
import { IStorage } from './storage';
import { User, InsertUser, TrialUser, InsertTrialUser, TrialSettings, InsertTrialSettings } from '@shared/schema';

// MongoDB Connection
async function connectMongoDB() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for MongoDB connection');
  }
  
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// MongoDB Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const TrialUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  signupDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  isExpired: { type: Boolean, default: false },
  trialDurationDays: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const TrialSettingsSchema = new mongoose.Schema({
  trialDurationDays: { type: Number, required: true },
  isTrialModeEnabled: { type: Boolean, required: true },
  expiryAction: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

// MongoDB Models
const UserModel = mongoose.model('User', UserSchema);
const TrialUserModel = mongoose.model('TrialUser', TrialUserSchema);
const TrialSettingsModel = mongoose.model('TrialSettings', TrialSettingsSchema);

// MongoDB Storage Implementation
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
    const trialUsers = await TrialUserModel.find({});
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
    await TrialUserModel.findOneAndUpdate({ username }, { isExpired: true });
  }

  async deleteTrialUser(username: string): Promise<void> {
    await TrialUserModel.findOneAndDelete({ username });
  }

  async getTrialSettings(): Promise<TrialSettings | undefined> {
    let settings = await TrialSettingsModel.findOne({});
    return settings ? {
      id: parseInt(settings._id.toString()),
      trialDurationDays: settings.trialDurationDays,
      isTrialModeEnabled: settings.isTrialModeEnabled,
      expiryAction: settings.expiryAction,
      updatedAt: settings.updatedAt,
    } : undefined;
  }

  async updateTrialSettings(newSettings: InsertTrialSettings): Promise<TrialSettings> {
    let settings = await TrialSettingsModel.findOne({});
    
    if (settings) {
      settings.trialDurationDays = newSettings.trialDurationDays;
      settings.isTrialModeEnabled = newSettings.isTrialModeEnabled;
      settings.expiryAction = newSettings.expiryAction;
      settings.updatedAt = new Date();
      await settings.save();
    } else {
      settings = new TrialSettingsModel(newSettings);
      await settings.save();
    }

    return {
      id: parseInt(settings._id.toString()),
      trialDurationDays: settings.trialDurationDays,
      isTrialModeEnabled: settings.isTrialModeEnabled,
      expiryAction: settings.expiryAction,
      updatedAt: settings.updatedAt,
    };
  }
}