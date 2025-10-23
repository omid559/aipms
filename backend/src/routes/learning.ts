import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import {
  SlicingHistory,
  FeedbackSession,
  TrainingExample,
  FineTuningJob,
} from '../models/learning.js';
import { VisionAnalyzer } from '../services/visionAnalyzer.js';
import { TrainingDataManager } from '../services/trainingDataManager.js';
import { FineTuningService } from '../services/fineTuningService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const visionAnalyzer = new VisionAnalyzer();
const trainingDataManager = new TrainingDataManager();
const fineTuningService = new FineTuningService();

// Configure multer for image uploads
const imageStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/feedback');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'feedback-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  },
});

// Save slicing history
router.post('/history', async (req, res) => {
  try {
    const history = new SlicingHistory(req.body);
    await history.save();

    res.json({
      success: true,
      historyId: history._id,
      message: 'Slicing history saved'
    });
  } catch (error) {
    console.error('Error saving history:', error);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

// Submit quick feedback (rating)
router.post('/feedback/quick', async (req, res) => {
  try {
    const { historyId, rating, feedback } = req.body;

    // Update slicing history
    await SlicingHistory.findByIdAndUpdate(historyId, {
      feedback,
      feedbackText: req.body.comments,
      feedbackTimestamp: new Date(),
    });

    // Create feedback session
    const session = new FeedbackSession({
      slicingHistoryId: historyId,
      feedbackType: 'quick_rating',
      rating,
    });

    await session.save();

    // If good feedback, convert to training data
    if (rating >= 4) {
      const history = await SlicingHistory.findById(historyId);
      if (history) {
        await trainingDataManager.createFromFeedback(
          history,
          `User rated ${rating}/5: ${req.body.comments || 'Good print'}`,
          history.settings
        );
      }
    }

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Submit detailed feedback
router.post('/feedback/detailed', async (req, res) => {
  try {
    const { historyId, printQuality, issues, settingsToImprove, comments } = req.body;

    await SlicingHistory.findByIdAndUpdate(historyId, {
      feedback: printQuality === 'excellent' || printQuality === 'good' ? 'good' : 'bad',
      feedbackText: comments,
      feedbackTimestamp: new Date(),
    });

    const session = new FeedbackSession({
      slicingHistoryId: historyId,
      feedbackType: 'detailed_text',
      detailedFeedback: {
        printQuality,
        issues,
        settingsToImprove,
        userComments: comments,
      },
      learningValue: issues && issues.length > 0 ? 'high' : 'medium',
    });

    await session.save();

    res.json({
      success: true,
      message: 'Detailed feedback submitted'
    });
  } catch (error) {
    console.error('Error submitting detailed feedback:', error);
    res.status(500).json({ error: 'Failed to submit detailed feedback' });
  }
});

// Submit print result with images
router.post('/feedback/images', upload.array('images', 5), async (req, res) => {
  try {
    const { historyId, printSuccessful, comments } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    // Get history
    const history = await SlicingHistory.findById(historyId);
    if (!history) {
      return res.status(404).json({ error: 'History not found' });
    }

    // Analyze images with Vision API
    const imageUrls = files.map(f => `/uploads/feedback/${f.filename}`);

    console.log('Analyzing images with Vision API...');
    const analysis = await visionAnalyzer.analyzeMultipleImages(
      imageUrls.map(url => `${req.protocol}://${req.get('host')}${url}`),
      {
        modelInfo: history.modelInfo,
        settings: history.settings,
        material: history.material?.name,
      }
    );

    // Update history
    history.printCompleted = true;
    history.printSuccessful = printSuccessful === 'true' || printSuccessful === true;
    history.printImages = imageUrls;
    history.qualityAnalysis = {
      analyzed: true,
      aiAnalysis: analysis.aiAnalysis,
      detectedIssues: analysis.detectedIssues.map(i => i.issue),
      suggestions: analysis.recommendations,
      overallScore: analysis.score,
    };
    history.feedback = analysis.score >= 75 ? 'good' : 'needs_improvement';

    await history.save();

    // Create feedback session
    const session = new FeedbackSession({
      slicingHistoryId: historyId,
      feedbackType: 'image_analysis',
      images: imageUrls.map(url => ({
        url,
        uploadedAt: new Date(),
        aiAnalysis: analysis.aiAnalysis,
        detectedDefects: analysis.detectedIssues.map(i => i.issue),
      })),
      learningValue: analysis.score >= 85 ? 'high' : 'medium',
    });

    await session.save();

    // If high quality, add to training data
    if (analysis.score >= 85) {
      await trainingDataManager.createFromFeedback(
        history,
        `Excellent print quality: ${analysis.aiAnalysis}`,
        history.settings
      );
    }

    res.json({
      success: true,
      analysis,
      message: 'Images analyzed successfully'
    });
  } catch (error) {
    console.error('Error analyzing images:', error);
    res.status(500).json({
      error: 'Failed to analyze images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Submit corrected settings
router.post('/feedback/corrections', async (req, res) => {
  try {
    const { historyId, correctedSettings, reason } = req.body;

    const history = await SlicingHistory.findById(historyId);
    if (!history) {
      return res.status(404).json({ error: 'History not found' });
    }

    // Create feedback session
    const session = new FeedbackSession({
      slicingHistoryId: historyId,
      feedbackType: 'settings_correction',
      suggestedSettings: correctedSettings,
      reasonForChange: reason,
      learningValue: 'high',
    });

    await session.save();

    // Create training example
    const trainingExample = await trainingDataManager.createFromFeedback(
      history,
      reason,
      correctedSettings
    );

    session.convertedToTraining = true;
    session.trainingExampleId = trainingExample._id;
    await session.save();

    res.json({
      success: true,
      message: 'Settings correction submitted and added to training data'
    });
  } catch (error) {
    console.error('Error submitting corrections:', error);
    res.status(500).json({ error: 'Failed to submit corrections' });
  }
});

// Import 3MF with annotations
router.post('/training/import-3mf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { description, expertNotes, quality } = req.body;

    const example = await trainingDataManager.importFrom3MF(
      req.file.path,
      {
        description,
        expertNotes,
        quality: quality || 'good',
      }
    );

    res.json({
      success: true,
      exampleId: example._id,
      message: '3MF imported successfully'
    });
  } catch (error) {
    console.error('Error importing 3MF:', error);
    res.status(500).json({ error: 'Failed to import 3MF' });
  }
});

// Get training data statistics
router.get('/training/stats', async (req, res) => {
  try {
    const stats = await trainingDataManager.getStatistics();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Start fine-tuning
router.post('/fine-tuning/start', async (req, res) => {
  try {
    const { baseModel, minQuality, epochs } = req.body;

    const result = await fineTuningService.startFineTuning({
      baseModel,
      minQuality,
      epochs,
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error starting fine-tuning:', error);
    res.status(500).json({
      error: 'Failed to start fine-tuning',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check fine-tuning job status
router.get('/fine-tuning/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const status = await fineTuningService.checkJobStatus(jobId);

    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// List fine-tuning jobs
router.get('/fine-tuning/jobs', async (req, res) => {
  try {
    const jobs = await fineTuningService.listJobs(20);

    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Error listing jobs:', error);
    res.status(500).json({ error: 'Failed to list jobs' });
  }
});

// Deploy model
router.post('/fine-tuning/deploy/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await fineTuningService.deployModel(jobId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error deploying model:', error);
    res.status(500).json({ error: 'Failed to deploy model' });
  }
});

// Get model performance
router.get('/performance/:modelId?', async (req, res) => {
  try {
    const { modelId } = req.params;

    const metrics = await fineTuningService.getPerformanceMetrics(modelId);

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error getting performance:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

// Get user's slicing history
router.get('/history/:userId?', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const query = userId ? { userId } : {};
    const history = await SlicingHistory.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Get training examples (for review/validation)
router.get('/training/examples', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const validated = req.query.validated === 'true';

    const query = validated ? { validated: true } : {};
    const examples = await TrainingExample.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({
      success: true,
      examples
    });
  } catch (error) {
    console.error('Error getting examples:', error);
    res.status(500).json({ error: 'Failed to get examples' });
  }
});

// Validate training example
router.post('/training/validate/:exampleId', async (req, res) => {
  try {
    const { exampleId } = req.params;
    const { validatedBy } = req.body;

    const example = await trainingDataManager.validateExample(exampleId, validatedBy || 'system');

    res.json({
      success: true,
      example
    });
  } catch (error) {
    console.error('Error validating example:', error);
    res.status(500).json({ error: 'Failed to validate example' });
  }
});

export default router;
