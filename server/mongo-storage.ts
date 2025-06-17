import mongoose from 'mongoose';
import { IStorage } from './storage';
import { User, InsertUser, TrialUser, InsertTrialUser, TrialSettings, InsertTrialSettings } from '@shared/schema';

// MongoDB Connection with VPS optimization
async function connectMongoDB() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for MongoDB connection');
  }
  
  try {
    // VPS-optimized connection settings
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000
    };
    
    const mongoUrl = process.env.MONGODB_URL || process.env.DATABASE_URL;
    await mongoose.connect(mongoUrl, options);
    console.log('✅ MongoDB connected successfully with VPS optimization');
    
    // Connection event handlers for production monitoring
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected - attempting reconnection');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });
    
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
    const now = new Date();
    // Find users who are either marked as expired OR have passed their expiry date
    const expiredUsers = await TrialUserModel.find({
      $or: [
        { isExpired: true },
        { expiryDate: { $lt: now } }
      ]
    });
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
    try {
      // Ensure MongoDB connection is established
      await connectMongoDB();
      
      // Log incoming data for debugging
      console.log('MongoDB updateTrialSettings called with:', newSettings);
      
      // Use findOneAndUpdate with upsert for better reliability
      const settings = await TrialSettingsModel.findOneAndUpdate(
        {}, // Empty filter to find any document
        {
          $set: {
            ...newSettings,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        {
          upsert: true, // Create if doesn't exist
          new: true, // Return updated document
          runValidators: true // Run schema validation
        }
      );

      console.log('MongoDB trial settings updated successfully:', settings);

      return {
        id: parseInt(settings._id.toString()),
        trialDurationDays: settings.trialDurationDays,
        isTrialModeEnabled: settings.isTrialModeEnabled,
        expiryAction: settings.expiryAction,
        updatedAt: settings.updatedAt,
      };
    } catch (error) {
      console.error('MongoDB updateTrialSettings error details:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        newSettings
      });
      
      // Re-throw with more specific error info
      if (error instanceof Error) {
        throw new Error(`Trial settings update failed: ${error.message}`);
      }
      throw error;
    }
  }
}