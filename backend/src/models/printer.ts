import mongoose, { Document, Schema } from 'mongoose';

/**
 * Printer Profile Interface
 */
export interface IPrinter extends Document {
  name: string;
  manufacturer: string;
  model: string;

  // Build Volume
  buildVolume: {
    x: number; // mm
    y: number; // mm
    z: number; // mm
  };

  // Nozzle Configuration
  nozzle: {
    diameter: number; // mm (e.g., 0.4)
    availableSizes: number[]; // [0.2, 0.4, 0.6, 0.8]
  };

  // Extruder Configuration
  extruder: {
    count: number; // Number of extruders (1, 2, etc.)
    type: 'bowden' | 'direct';
  };

  // Movement Capabilities
  maxSpeed: {
    x: number; // mm/s
    y: number; // mm/s
    z: number; // mm/s
    e: number; // mm/s (extruder)
  };

  maxAcceleration: {
    x: number; // mm/s²
    y: number; // mm/s²
    z: number; // mm/s²
    e: number; // mm/s²
  };

  // Bed Configuration
  bed: {
    type: 'heated' | 'unheated';
    maxTemp: number; // °C
    shape: 'rectangular' | 'circular';
    material: string; // glass, PEI, BuildTak, etc.
  };

  // Leveling
  autoLeveling: boolean;
  levelingType?: 'BLTouch' | 'Inductive' | 'Capacitive' | 'Manual';

  // Firmware
  firmware: string; // Marlin, Klipper, RepRap, etc.
  firmwareVersion?: string;

  // Additional Features
  features: {
    filamentSensor: boolean;
    powerRecovery: boolean;
    enclosure: boolean;
    hepa: boolean;
    camera: boolean;
  };

  // G-code Flavor
  gcodeFlavor: 'marlin' | 'klipper' | 'reprap' | 'smoothie' | 'repetier';

  // Start/End G-code
  startGcode: string;
  endGcode: string;

  // Status
  isActive: boolean;
  isDefault: boolean;

  // Metadata
  createdBy: mongoose.Types.ObjectId; // User ID
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  imageUrl?: string;
}

const printerSchema = new Schema<IPrinter>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
  },
  buildVolume: {
    x: { type: Number, required: true, min: 0 },
    y: { type: Number, required: true, min: 0 },
    z: { type: Number, required: true, min: 0 },
  },
  nozzle: {
    diameter: { type: Number, required: true, min: 0.1, max: 2.0 },
    availableSizes: [{ type: Number, min: 0.1, max: 2.0 }],
  },
  extruder: {
    count: { type: Number, required: true, min: 1, max: 4, default: 1 },
    type: { type: String, enum: ['bowden', 'direct'], required: true },
  },
  maxSpeed: {
    x: { type: Number, required: true, min: 0 },
    y: { type: Number, required: true, min: 0 },
    z: { type: Number, required: true, min: 0 },
    e: { type: Number, required: true, min: 0 },
  },
  maxAcceleration: {
    x: { type: Number, required: true, min: 0 },
    y: { type: Number, required: true, min: 0 },
    z: { type: Number, required: true, min: 0 },
    e: { type: Number, required: true, min: 0 },
  },
  bed: {
    type: { type: String, enum: ['heated', 'unheated'], required: true },
    maxTemp: { type: Number, required: true, min: 0 },
    shape: { type: String, enum: ['rectangular', 'circular'], default: 'rectangular' },
    material: { type: String, default: 'glass' },
  },
  autoLeveling: {
    type: Boolean,
    default: false,
  },
  levelingType: {
    type: String,
    enum: ['BLTouch', 'Inductive', 'Capacitive', 'Manual'],
  },
  firmware: {
    type: String,
    required: true,
    default: 'Marlin',
  },
  firmwareVersion: String,
  features: {
    filamentSensor: { type: Boolean, default: false },
    powerRecovery: { type: Boolean, default: false },
    enclosure: { type: Boolean, default: false },
    hepa: { type: Boolean, default: false },
    camera: { type: Boolean, default: false },
  },
  gcodeFlavor: {
    type: String,
    enum: ['marlin', 'klipper', 'reprap', 'smoothie', 'repetier'],
    default: 'marlin',
  },
  startGcode: {
    type: String,
    default: 'G28 ; Home all axes\nG1 Z15.0 F6000 ; Move the platform down 15mm',
  },
  endGcode: {
    type: String,
    default: 'M104 S0 ; Turn off extruder\nM140 S0 ; Turn off bed\nG28 X0 ; Home X axis\nM84 ; Disable motors',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: String,
  imageUrl: String,
}, {
  timestamps: true,
});

// Indexes
printerSchema.index({ name: 1, manufacturer: 1 });
printerSchema.index({ isActive: 1, isDefault: 1 });
printerSchema.index({ createdBy: 1 });

// Ensure only one default printer
printerSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await mongoose.model('Printer').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

export const Printer = mongoose.model<IPrinter>('Printer', printerSchema);
