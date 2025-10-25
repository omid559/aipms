import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  isActive: boolean;
  emailVerified: boolean;
  quota: {
    maxUploads: number;
    maxStorageBytes: number;
    maxAICalls: number;
    usedUploads: number;
    usedStorageBytes: number;
    usedAICalls: number;
  };
  apiKey?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateApiKey(): string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'guest'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    quota: {
      maxUploads: {
        type: Number,
        default: 10, // per month for free tier
      },
      maxStorageBytes: {
        type: Number,
        default: 1024 * 1024 * 1024, // 1GB
      },
      maxAICalls: {
        type: Number,
        default: 20, // per month
      },
      usedUploads: {
        type: Number,
        default: 0,
      },
      usedStorageBytes: {
        type: Number,
        default: 0,
      },
      usedAICalls: {
        type: Number,
        default: 0,
      },
    },
    apiKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function (): string {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Generate API key
userSchema.methods.generateApiKey = function (): string {
  const crypto = require('crypto');
  const apiKey = `aipms_${crypto.randomBytes(32).toString('hex')}`;
  this.apiKey = apiKey;
  return apiKey;
};

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ apiKey: 1 });
userSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser>('User', userSchema);
