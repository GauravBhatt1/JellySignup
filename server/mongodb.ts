import mongoose from 'mongoose';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for MongoDB connection");
}

// MongoDB connection
export async function connectMongoDB() {
  try {
    await mongoose.connect(process.env.DATABASE_URL!);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Trial User Schema
const trialUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  signupDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  isExpired: { type: Boolean, default: false },
  trialDurationDays: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Trial Settings Schema
const trialSettingsSchema = new mongoose.Schema({
  isTrialModeEnabled: { type: Boolean, default: false },
  trialDurationDays: { type: Number, default: 7 },
  expiryAction: { type: String, default: 'disable' }, // "disable" or "delete"
  updatedAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.model('User', userSchema);
export const TrialUserModel = mongoose.model('TrialUser', trialUserSchema);
export const TrialSettingsModel = mongoose.model('TrialSettings', trialSettingsSchema);