import mongoose from 'mongoose';

const { Schema } = mongoose;

// Slicing History Schema
const SlicingHistorySchema = new Schema({
  userId: { type: String, default: 'anonymous' },
  timestamp: { type: Date, default: Date.now },

  // Input Data
  modelInfo: {
    filename: String,
    filePath: String,
    fileSize: Number,
    analysis: {
      volume: Number,
      surfaceArea: Number,
      boundingBox: {
        x: Number,
        y: Number,
        z: Number,
      },
      overhangs: Array,
      thinWalls: Boolean,
      bridging: Boolean,
    }
  },

  // Settings Used
  settings: {
    type: Schema.Types.Mixed,
    required: true,
  },

  // Material & Printer
  material: {
    type: Schema.Types.Mixed,
  },
  printer: {
    type: Schema.Types.Mixed,
  },

  // AI Optimization
  aiOptimized: { type: Boolean, default: false },
  aiRecommendations: Schema.Types.Mixed,

  // Output
  gcodeGenerated: Boolean,
  threeMFGenerated: Boolean,
  metadata: {
    layerCount: Number,
    estimatedTime: String,
    filamentLength: String,
    filamentWeight: String,
  },

  // Feedback
  feedback: {
    type: String,
    enum: ['pending', 'good', 'bad', 'excellent', 'needs_improvement'],
    default: 'pending',
  },
  feedbackText: String,
  feedbackTimestamp: Date,

  // Print Result
  printCompleted: { type: Boolean, default: false },
  printSuccessful: Boolean,
  printImages: [String], // URLs to uploaded images

  // Quality Analysis
  qualityAnalysis: {
    analyzed: { type: Boolean, default: false },
    aiAnalysis: String,
    detectedIssues: [String],
    suggestions: [String],
    overallScore: Number, // 0-100
  },

  // Tags for learning
  tags: [String],
  category: String,
});

// Training Example Schema (for fine-tuning)
const TrainingExampleSchema = new Schema({
  timestamp: { type: Date, default: Date.now },

  // Source
  source: {
    type: String,
    enum: ['user_feedback', 'expert_annotation', 'imported_3mf', 'manual'],
    required: true,
  },

  // Model characteristics
  modelCharacteristics: {
    volume: Number,
    surfaceArea: Number,
    boundingBox: Schema.Types.Mixed,
    complexity: String, // 'simple', 'medium', 'complex'
    features: [String], // ['overhangs', 'thin_walls', 'bridging', 'supports_needed']
  },

  // Material and Printer context
  material: String,
  materialType: String,
  printerType: String,

  // Optimal settings (the "correct answer")
  optimalSettings: {
    type: Schema.Types.Mixed,
    required: true,
  },

  // Explanation/Reasoning
  reasoning: String,
  expertNotes: String,

  // Quality metrics
  quality: {
    type: String,
    enum: ['excellent', 'good', 'acceptable', 'poor'],
    default: 'good',
  },

  // Used for training
  usedInTraining: { type: Boolean, default: false },
  trainingBatch: String,

  // Validation
  validated: { type: Boolean, default: false },
  validatedBy: String,
});

// Fine-tuning Job Schema
const FineTuningJobSchema = new Schema({
  timestamp: { type: Date, default: Date.now },

  // OpenAI Job Info
  openAIJobId: String,
  modelName: String,
  baseModel: { type: String, default: 'gpt-4o-mini-2024-07-18' },

  // Training Data
  trainingExamplesCount: Number,
  trainingFileId: String,
  validationFileId: String,

  // Status
  status: {
    type: String,
    enum: ['pending', 'running', 'succeeded', 'failed', 'cancelled'],
    default: 'pending',
  },

  // Results
  fineTunedModel: String,
  trainingMetrics: Schema.Types.Mixed,

  // Deployment
  deployed: { type: Boolean, default: false },
  deploymentTimestamp: Date,

  // Performance tracking
  performanceMetrics: {
    averageAccuracy: Number,
    userSatisfaction: Number,
    improvementOverBase: Number,
  },
});

// Feedback Session Schema
const FeedbackSessionSchema = new Schema({
  timestamp: { type: Date, default: Date.now },

  slicingHistoryId: {
    type: Schema.Types.ObjectId,
    ref: 'SlicingHistory',
    required: true,
  },

  // Feedback Type
  feedbackType: {
    type: String,
    enum: ['quick_rating', 'detailed_text', 'image_analysis', 'settings_correction'],
    required: true,
  },

  // Quick Rating
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },

  // Detailed Feedback
  detailedFeedback: {
    printQuality: String, // 'excellent', 'good', 'fair', 'poor'
    issues: [String], // ['stringing', 'warping', 'layer_shifts', 'under_extrusion', etc.]
    settingsToImprove: [String],
    userComments: String,
  },

  // Image Analysis
  images: [{
    url: String,
    uploadedAt: Date,
    aiAnalysis: String,
    detectedDefects: [String],
  }],

  // Settings Corrections (user suggests better settings)
  suggestedSettings: Schema.Types.Mixed,
  reasonForChange: String,

  // Learning value
  learningValue: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },

  // Converted to training example
  convertedToTraining: { type: Boolean, default: false },
  trainingExampleId: {
    type: Schema.Types.ObjectId,
    ref: 'TrainingExample',
  },
});

// Model Performance Metrics
const ModelPerformanceSchema = new Schema({
  timestamp: { type: Date, default: Date.now },

  modelId: String,
  modelVersion: String,

  // Metrics
  metrics: {
    totalPredictions: Number,
    successfulPrints: Number,
    failedPrints: Number,
    averageUserRating: Number,

    // Specific issues
    commonIssues: [{
      issue: String,
      frequency: Number,
    }],

    // Setting accuracy
    settingAccuracy: {
      layerHeight: Number,
      infillDensity: Number,
      printSpeed: Number,
      temperature: Number,
      support: Number,
    },
  },

  // Comparison with previous version
  improvement: {
    percentImprovement: Number,
    betterThan: String, // previous model ID
  },
});

export const SlicingHistory = mongoose.model('SlicingHistory', SlicingHistorySchema);
export const TrainingExample = mongoose.model('TrainingExample', TrainingExampleSchema);
export const FineTuningJob = mongoose.model('FineTuningJob', FineTuningJobSchema);
export const FeedbackSession = mongoose.model('FeedbackSession', FeedbackSessionSchema);
export const ModelPerformance = mongoose.model('ModelPerformance', ModelPerformanceSchema);
