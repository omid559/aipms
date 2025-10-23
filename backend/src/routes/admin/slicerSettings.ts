import { Router } from 'express';
import { SlicerConfig, DEFAULT_SLICER_SETTINGS } from '../../models/slicerConfig.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

/**
 * GET /api/admin/slicer-settings
 * Get all slicer configurations
 */
router.get('/', async (req, res) => {
  try {
    const configs = await SlicerConfig.find()
      .populate('createdBy', 'name email')
      .sort({ isDefault: -1, name: 1 });

    res.json({
      success: true,
      configs,
      count: configs.length,
    });
  } catch (error) {
    console.error('Get slicer configs error:', error);
    res.status(500).json({ error: 'Failed to fetch slicer configurations' });
  }
});

/**
 * GET /api/admin/slicer-settings/:id
 * Get single slicer configuration
 */
router.get('/:id', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid config ID', errors: errors.array() });
    }

    const config = await SlicerConfig.findById(req.params.id).populate('createdBy', 'name email');

    if (!config) {
      return res.status(404).json({ error: 'Slicer configuration not found' });
    }

    res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Get slicer config error:', error);
    res.status(500).json({ error: 'Failed to fetch slicer configuration' });
  }
});

/**
 * GET /api/admin/slicer-settings/default/template
 * Get default slicer settings template
 */
router.get('/default/template', async (req, res) => {
  try {
    res.json({
      success: true,
      template: DEFAULT_SLICER_SETTINGS,
      categories: [...new Set(DEFAULT_SLICER_SETTINGS.map(s => s.category))],
      totalSettings: DEFAULT_SLICER_SETTINGS.length,
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * POST /api/admin/slicer-settings
 * Create new slicer configuration
 */
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('version').optional().trim(),
  body('settings').isArray().withMessage('Settings must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    // If no settings provided, use default
    if (!req.body.settings || req.body.settings.length === 0) {
      req.body.settings = DEFAULT_SLICER_SETTINGS;
    }

    const config = new SlicerConfig({
      ...req.body,
      createdBy: req.user!._id,
    });

    await config.save();

    res.status(201).json({
      success: true,
      config,
      message: 'Slicer configuration created successfully',
    });
  } catch (error: any) {
    console.error('Create slicer config error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Configuration with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create slicer configuration' });
  }
});

/**
 * PUT /api/admin/slicer-settings/:id
 * Update slicer configuration
 */
router.put('/:id', [
  param('id').isMongoId(),
  body('name').optional().trim().notEmpty(),
  body('settings').optional().isArray(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const config = await SlicerConfig.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({ error: 'Slicer configuration not found' });
    }

    res.json({
      success: true,
      config,
      message: 'Slicer configuration updated successfully',
    });
  } catch (error) {
    console.error('Update slicer config error:', error);
    res.status(500).json({ error: 'Failed to update slicer configuration' });
  }
});

/**
 * PATCH /api/admin/slicer-settings/:id/setting/:key
 * Update specific setting visibility and AI usage
 */
router.patch('/:id/setting/:key', [
  param('id').isMongoId(),
  param('key').trim().notEmpty(),
  body('visibleInUI').optional().isBoolean(),
  body('useInAIOptimization').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const config = await SlicerConfig.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ error: 'Slicer configuration not found' });
    }

    const setting = config.settings.find(s => s.key === req.params.key);

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    // Update setting properties
    if (req.body.visibleInUI !== undefined) {
      setting.visibleInUI = req.body.visibleInUI;
    }
    if (req.body.useInAIOptimization !== undefined) {
      setting.useInAIOptimization = req.body.useInAIOptimization;
    }

    await config.save();

    res.json({
      success: true,
      config,
      setting,
      message: 'Setting updated successfully',
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

/**
 * PATCH /api/admin/slicer-settings/:id/bulk-update
 * Bulk update setting visibility
 */
router.patch('/:id/bulk-update', [
  param('id').isMongoId(),
  body('updates').isArray().withMessage('Updates must be an array'),
  body('updates.*.key').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const config = await SlicerConfig.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ error: 'Slicer configuration not found' });
    }

    // Apply all updates
    const updates = req.body.updates as Array<{
      key: string;
      visibleInUI?: boolean;
      useInAIOptimization?: boolean;
    }>;

    let updatedCount = 0;

    for (const update of updates) {
      const setting = config.settings.find(s => s.key === update.key);
      if (setting) {
        if (update.visibleInUI !== undefined) {
          setting.visibleInUI = update.visibleInUI;
        }
        if (update.useInAIOptimization !== undefined) {
          setting.useInAIOptimization = update.useInAIOptimization;
        }
        updatedCount++;
      }
    }

    await config.save();

    res.json({
      success: true,
      config,
      updatedCount,
      message: `${updatedCount} settings updated successfully`,
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * DELETE /api/admin/slicer-settings/:id
 * Delete slicer configuration
 */
router.delete('/:id', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid config ID', errors: errors.array() });
    }

    const config = await SlicerConfig.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ error: 'Slicer configuration not found' });
    }

    if (config.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default configuration' });
    }

    await config.deleteOne();

    res.json({
      success: true,
      message: 'Slicer configuration deleted successfully',
    });
  } catch (error) {
    console.error('Delete slicer config error:', error);
    res.status(500).json({ error: 'Failed to delete slicer configuration' });
  }
});

/**
 * PATCH /api/admin/slicer-settings/:id/set-default
 * Set configuration as default
 */
router.patch('/:id/set-default', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
    const config = await SlicerConfig.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ error: 'Slicer configuration not found' });
    }

    config.isDefault = true;
    await config.save(); // Pre-save hook will handle unsetting other defaults

    res.json({
      success: true,
      config,
      message: 'Configuration set as default successfully',
    });
  } catch (error) {
    console.error('Set default config error:', error);
    res.status(500).json({ error: 'Failed to set default configuration' });
  }
});

/**
 * GET /api/admin/slicer-settings/:id/stats
 * Get statistics for a configuration
 */
router.get('/:id/stats', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
    const config = await SlicerConfig.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ error: 'Slicer configuration not found' });
    }

    const stats = {
      totalSettings: config.settings.length,
      visibleInUI: config.settings.filter(s => s.visibleInUI).length,
      usedInAI: config.settings.filter(s => s.useInAIOptimization).length,
      advancedOnly: config.settings.filter(s => s.advancedOnly).length,
      byCategory: config.settings.reduce((acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;
