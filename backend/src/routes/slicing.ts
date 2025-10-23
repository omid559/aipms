import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { SlicingSettings, PrinterProfile } from '../types/slicing.js';
import { ModelAnalyzer } from '../services/modelAnalyzer.js';
import { OrcaSlicerService } from '../services/orcaSlicerService.js';
import orientationOptimizer from '../services/orientationOptimizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const modelAnalyzer = new ModelAnalyzer();
const orcaSlicerService = new OrcaSlicerService();

// Analyze 3D model and get characteristics
router.post('/analyze', async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Convert relative path to absolute
    const absolutePath = filePath.startsWith('/')
      ? filePath
      : path.join(__dirname, '../../../', filePath);

    console.log('Analyzing model:', absolutePath);

    // Use real model analyzer
    const analysis = await modelAnalyzer.analyzeModel(absolutePath);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze model',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AI-powered orientation optimization
router.post('/optimize-orientation', async (req, res) => {
  try {
    const { filePath, materialType, printerProfile } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Convert relative path to absolute
    const absolutePath = filePath.startsWith('/')
      ? filePath
      : path.join(__dirname, '../../../', filePath);

    console.log('🤖 AI: Optimizing orientation for model:', absolutePath);

    // Use AI to optimize orientation
    const orientationResult = await orientationOptimizer.optimizeOrientation(
      absolutePath,
      materialType,
      printerProfile ? {
        x: printerProfile.buildVolumeX,
        y: printerProfile.buildVolumeY,
        z: printerProfile.buildVolumeZ,
      } : undefined
    );

    res.json({
      success: true,
      orientationData: orientationResult,
      message: 'Orientation optimized successfully'
    });
  } catch (error) {
    console.error('Orientation optimization error:', error);
    res.status(500).json({
      error: 'Failed to optimize orientation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate G-code from settings using OrcaSlicer
router.post('/generate-gcode', async (req, res) => {
  try {
    const { filePath, settings, printerProfile, generate3MF, optimizeOrientation } = req.body;

    if (!filePath || !settings || !printerProfile) {
      return res.status(400).json({
        error: 'File path, settings, and printer profile are required'
      });
    }

    // Convert relative path to absolute
    const absolutePath = filePath.startsWith('/')
      ? filePath
      : path.join(__dirname, '../../../', filePath);

    console.log('Slicing model with OrcaSlicer:', absolutePath);

    // Use OrcaSlicer to generate G-code and 3MF
    const result = await orcaSlicerService.slice(
      absolutePath,
      settings as SlicingSettings,
      printerProfile as PrinterProfile,
      generate3MF !== false,
      optimizeOrientation !== false // Default to true
    );

    res.json({
      success: true,
      gcodePath: result.gcodePath,
      threeMFPath: result.threeMFPath,
      metadata: result.metadata,
      orientationData: result.orientationData,
      rotatedModelPath: result.rotatedModelPath,
      message: 'G-code generated successfully'
    });
  } catch (error) {
    console.error('G-code generation error:', error);
    res.status(500).json({
      error: 'Failed to generate G-code',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate slicing settings
router.post('/validate', async (req, res) => {
  try {
    const { settings, printerProfile } = req.body;

    const validationErrors: string[] = [];

    // Validate settings against printer capabilities
    if (settings.layerHeight < 0.05 || settings.layerHeight > 0.4) {
      validationErrors.push('Layer height must be between 0.05mm and 0.4mm');
    }

    if (settings.printSpeed > printerProfile.maxPrintSpeed) {
      validationErrors.push(`Print speed exceeds printer maximum (${printerProfile.maxPrintSpeed} mm/s)`);
    }

    if (settings.printingTemperature > printerProfile.maxTemperature) {
      validationErrors.push(`Temperature exceeds printer maximum (${printerProfile.maxTemperature}°C)`);
    }

    res.json({
      valid: validationErrors.length === 0,
      errors: validationErrors
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Failed to validate settings' });
  }
});

// Download G-code file
router.get('/download/gcode/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../../output', filename);

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(404).json({ error: 'File not found' });
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Download 3MF file
router.get('/download/3mf/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../../output', filename);

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(404).json({ error: 'File not found' });
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

export default router;
