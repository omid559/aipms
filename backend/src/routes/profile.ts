import { Router } from 'express';
import { Material } from '../models/material.js';
import { Printer } from '../models/printer.js';
import { SlicerConfig } from '../models/slicerConfig.js';

const router = Router();

/**
 * GET /api/profile/materials
 * Get all active materials
 */
router.get('/materials', async (req, res) => {
  try {
    const materials = await Material.find({ isActive: true })
      .select('-createdBy -__v')
      .sort({ type: 1, name: 1 });

    res.json({
      success: true,
      materials,
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

/**
 * GET /api/profile/materials/:id
 * Get specific material
 */
router.get('/materials/:id', async (req, res) => {
  try {
    const material = await Material.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({
      success: true,
      material,
    });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

/**
 * GET /api/profile/printers
 * Get all active printers
 */
router.get('/printers', async (req, res) => {
  try {
    const printers = await Printer.find({ isActive: true })
      .select('-createdBy -__v')
      .sort({ isDefault: -1, name: 1 });

    res.json({
      success: true,
      printers,
    });
  } catch (error) {
    console.error('Get printers error:', error);
    res.status(500).json({ error: 'Failed to fetch printers' });
  }
});

/**
 * GET /api/profile/printers/:id
 * Get specific printer
 */
router.get('/printers/:id', async (req, res) => {
  try {
    const printer = await Printer.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    res.json({
      success: true,
      printer,
    });
  } catch (error) {
    console.error('Get printer error:', error);
    res.status(500).json({ error: 'Failed to fetch printer' });
  }
});

/**
 * GET /api/profile/slicer-config
 * Get active slicer configuration
 */
router.get('/slicer-config', async (req, res) => {
  try {
    // Get default config or first active config
    let config = await SlicerConfig.findOne({ isDefault: true, isActive: true });

    if (!config) {
      config = await SlicerConfig.findOne({ isActive: true });
    }

    if (!config) {
      return res.status(404).json({ error: 'No active slicer configuration found' });
    }

    // Filter settings based on visibility
    const visibleSettings = config.settings.filter(s => s.visibleInUI);
    const aiSettings = config.settings.filter(s => s.useInAIOptimization);

    res.json({
      success: true,
      config: {
        id: config._id,
        name: config.name,
        version: config.version,
        visibleSettings,
        aiSettings,
        allSettings: config.settings,
      },
    });
  } catch (error) {
    console.error('Get slicer config error:', error);
    res.status(500).json({ error: 'Failed to fetch slicer configuration' });
  }
});

export default router;
