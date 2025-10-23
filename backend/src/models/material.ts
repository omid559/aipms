import mongoose, { Document, Schema } from 'mongoose';

/**
 * Material Profile Interface
 */
export interface IMaterial extends Document {
  name: string;
  type: string; // PLA, ABS, PETG, TPU, etc.
  manufacturer?: string;
  color?: string;

  // Temperature Settings
  temperature: {
    nozzle: number; // °C
    nozzleMin: number; // °C
    nozzleMax: number; // °C
    bed: number; // °C
    bedMin: number; // °C
    bedMax: number; // °C
    chamber?: number; // °C (optional, for enclosed printers)
  };

  // Print Speed Settings
  speed: {
    print: number; // mm/s
    infill: number; // mm/s
    wall: number; // mm/s
    topBottom: number; // mm/s
    support: number; // mm/s
    travel: number; // mm/s
    firstLayer: number; // mm/s
  };

  // Cooling Settings
  cooling: {
    minFanSpeed: number; // 0-100%
    maxFanSpeed: number; // 0-100%
    regularFanSpeed: number; // 0-100%
    bridgeFanSpeed: number; // 0-100%
    disableFirstLayers: number; // Number of layers
  };

  // Retraction Settings
  retraction: {
    enabled: boolean;
    distance: number; // mm
    speed: number; // mm/s
    extraRestart: number; // mm
    minTravel: number; // mm
    zHop: number; // mm
  };

  // Material Properties
  properties: {
    density: number; // g/cm³
    diameter: number; // mm (1.75 or 2.85 typically)
    flowRate: number; // % (typically 100)
    shrinkage: number; // % (for dimensional accuracy)
  };

  // Bed Adhesion
  adhesion: {
    type: 'none' | 'skirt' | 'brim' | 'raft';
    brimWidth?: number; // mm
    raftLayers?: number;
  };

  // Advanced Settings
  advanced: {
    printingTemperatureGraph?: Array<{ speed: number; temp: number }>; // Speed to temp mapping
    fanSpeedGraph?: Array<{ layerHeight: number; speed: number }>; // Layer to fan speed mapping
    linearAdvance?: number; // K-factor for Marlin
    pressureAdvance?: number; // For Klipper
    maxVolumetricSpeed?: number; // mm³/s
  };

  // Material Characteristics
  characteristics: {
    strength: number; // 1-10
    flexibility: number; // 1-10
    durability: number; // 1-10
    printability: number; // 1-10 (ease of printing)
    supportRemoval: number; // 1-10 (how easy to remove supports)
    postProcessing: number; // 1-10 (how well it can be sanded, painted, etc.)
  };

  // Special Requirements
  requirements: {
    enclosure: boolean; // Needs enclosed printer
    heatbed: boolean; // Needs heated bed
    allMetalHotend: boolean; // For high temp materials
    dryingRequired: boolean; // Needs to be dried before use
    ventilation: boolean; // Needs good ventilation
  };

  // Usage Notes
  notes?: string;
  warningMessage?: string; // For toxic/hazardous materials

  // Status
  isActive: boolean;
  isDefault: boolean;

  // Metadata
  createdBy: mongoose.Types.ObjectId; // User ID
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
}

const materialSchema = new Schema<IMaterial>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  manufacturer: String,
  color: String,
  temperature: {
    nozzle: { type: Number, required: true, min: 0, max: 500 },
    nozzleMin: { type: Number, required: true, min: 0, max: 500 },
    nozzleMax: { type: Number, required: true, min: 0, max: 500 },
    bed: { type: Number, required: true, min: 0, max: 200 },
    bedMin: { type: Number, required: true, min: 0, max: 200 },
    bedMax: { type: Number, required: true, min: 0, max: 200 },
    chamber: { type: Number, min: 0, max: 100 },
  },
  speed: {
    print: { type: Number, required: true, min: 0, max: 500 },
    infill: { type: Number, required: true, min: 0, max: 500 },
    wall: { type: Number, required: true, min: 0, max: 500 },
    topBottom: { type: Number, required: true, min: 0, max: 500 },
    support: { type: Number, required: true, min: 0, max: 500 },
    travel: { type: Number, required: true, min: 0, max: 500 },
    firstLayer: { type: Number, required: true, min: 0, max: 500 },
  },
  cooling: {
    minFanSpeed: { type: Number, required: true, min: 0, max: 100 },
    maxFanSpeed: { type: Number, required: true, min: 0, max: 100 },
    regularFanSpeed: { type: Number, required: true, min: 0, max: 100 },
    bridgeFanSpeed: { type: Number, required: true, min: 0, max: 100 },
    disableFirstLayers: { type: Number, default: 1, min: 0, max: 10 },
  },
  retraction: {
    enabled: { type: Boolean, default: true },
    distance: { type: Number, required: true, min: 0, max: 10 },
    speed: { type: Number, required: true, min: 0, max: 100 },
    extraRestart: { type: Number, default: 0, min: 0, max: 5 },
    minTravel: { type: Number, default: 1.5, min: 0, max: 10 },
    zHop: { type: Number, default: 0, min: 0, max: 5 },
  },
  properties: {
    density: { type: Number, required: true, min: 0.5, max: 5 },
    diameter: { type: Number, required: true, enum: [1.75, 2.85] },
    flowRate: { type: Number, default: 100, min: 50, max: 150 },
    shrinkage: { type: Number, default: 0, min: 0, max: 10 },
  },
  adhesion: {
    type: { type: String, enum: ['none', 'skirt', 'brim', 'raft'], default: 'skirt' },
    brimWidth: { type: Number, min: 0, max: 50 },
    raftLayers: { type: Number, min: 0, max: 10 },
  },
  advanced: {
    printingTemperatureGraph: [{
      speed: { type: Number, min: 0, max: 500 },
      temp: { type: Number, min: 0, max: 500 },
    }],
    fanSpeedGraph: [{
      layerHeight: { type: Number, min: 0, max: 1 },
      speed: { type: Number, min: 0, max: 100 },
    }],
    linearAdvance: { type: Number, min: 0, max: 2 },
    pressureAdvance: { type: Number, min: 0, max: 2 },
    maxVolumetricSpeed: { type: Number, min: 0, max: 50 },
  },
  characteristics: {
    strength: { type: Number, min: 1, max: 10, default: 5 },
    flexibility: { type: Number, min: 1, max: 10, default: 5 },
    durability: { type: Number, min: 1, max: 10, default: 5 },
    printability: { type: Number, min: 1, max: 10, default: 5 },
    supportRemoval: { type: Number, min: 1, max: 10, default: 5 },
    postProcessing: { type: Number, min: 1, max: 10, default: 5 },
  },
  requirements: {
    enclosure: { type: Boolean, default: false },
    heatbed: { type: Boolean, default: true },
    allMetalHotend: { type: Boolean, default: false },
    dryingRequired: { type: Boolean, default: false },
    ventilation: { type: Boolean, default: false },
  },
  notes: String,
  warningMessage: String,
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
  imageUrl: String,
}, {
  timestamps: true,
});

// Indexes
materialSchema.index({ name: 1, type: 1 });
materialSchema.index({ type: 1, isActive: 1 });
materialSchema.index({ isActive: 1, isDefault: 1 });
materialSchema.index({ createdBy: 1 });

// Ensure only one default material per type
materialSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await mongoose.model('Material').updateMany(
      { _id: { $ne: this._id }, type: this.type },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Validation: nozzleMin <= nozzle <= nozzleMax
materialSchema.pre('save', function(next) {
  if (this.temperature.nozzle < this.temperature.nozzleMin ||
      this.temperature.nozzle > this.temperature.nozzleMax) {
    next(new Error('Nozzle temperature must be between min and max'));
  }
  if (this.temperature.bed < this.temperature.bedMin ||
      this.temperature.bed > this.temperature.bedMax) {
    next(new Error('Bed temperature must be between min and max'));
  }
  next();
});

export const Material = mongoose.model<IMaterial>('Material', materialSchema);
