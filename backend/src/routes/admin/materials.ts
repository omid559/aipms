import { Router } from 'express';
import { Material } from '../../models/material.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

/**
 * GET /api/admin/materials
 * Get all materials
 */
router.get('/', async (req, res) => {
  try {
    const { active, type, search } = req.query;

    const filter: any = {};
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }
    if (type) {
      filter.type = type;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
      ];
    }

    const materials = await Material.find(filter)
      .populate('createdBy', 'name email')
      .sort({ type: 1, name: 1 });

    res.json({
      success: true,
      materials,
      count: materials.length,
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

/**
 * GET /api/admin/materials/types
 * Get list of material types
 */
router.get('/types', async (req, res) => {
  try {
    const types = await Material.distinct('type');

    res.json({
      success: true,
      types: types.sort(),
    });
  } catch (error) {
    console.error('Get material types error:', error);
    res.status(500).json({ error: 'Failed to fetch material types' });
  }
});

/**
 * GET /api/admin/materials/:id
 * Get single material by ID
 */
router.get('/:id', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid material ID', errors: errors.array() });
    }

    const material = await Material.findById(req.params.id).populate('createdBy', 'name email');

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
 * POST /api/admin/materials
 * Create new material
 */
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').trim().notEmpty().withMessage('Type is required'),
  body('temperature.nozzle').isFloat({ min: 0, max: 500 }).withMessage('Invalid nozzle temperature'),
  body('temperature.nozzleMin').isFloat({ min: 0, max: 500 }).withMessage('Invalid nozzle min temperature'),
  body('temperature.nozzleMax').isFloat({ min: 0, max: 500 }).withMessage('Invalid nozzle max temperature'),
  body('temperature.bed').isFloat({ min: 0, max: 200 }).withMessage('Invalid bed temperature'),
  body('properties.density').isFloat({ min: 0.5, max: 5 }).withMessage('Invalid density'),
  body('properties.diameter').isIn([1.75, 2.85]).withMessage('Invalid filament diameter'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const material = new Material({
      ...req.body,
      createdBy: req.user!._id,
    });

    await material.save();

    res.status(201).json({
      success: true,
      material,
      message: 'Material created successfully',
    });
  } catch (error: any) {
    console.error('Create material error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Material with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create material' });
  }
});

/**
 * PUT /api/admin/materials/:id
 * Update material
 */
router.put('/:id', [
  param('id').isMongoId(),
  body('name').optional().trim().notEmpty(),
  body('type').optional().trim().notEmpty(),
  body('temperature.nozzle').optional().isFloat({ min: 0, max: 500 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const material = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({
      success: true,
      material,
      message: 'Material updated successfully',
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

/**
 * DELETE /api/admin/materials/:id
 * Delete material
 */
router.delete('/:id', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid material ID', errors: errors.array() });
    }

    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (material.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default material' });
    }

    await material.deleteOne();

    res.json({
      success: true,
      message: 'Material deleted successfully',
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

/**
 * PATCH /api/admin/materials/:id/toggle-active
 * Toggle material active status
 */
router.patch('/:id/toggle-active', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    material.isActive = !material.isActive;
    await material.save();

    res.json({
      success: true,
      material,
      message: `Material ${material.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Toggle material error:', error);
    res.status(500).json({ error: 'Failed to toggle material status' });
  }
});

/**
 * PATCH /api/admin/materials/:id/set-default
 * Set material as default for its type
 */
router.patch('/:id/set-default', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    material.isDefault = true;
    await material.save(); // Pre-save hook will handle unsetting other defaults

    res.json({
      success: true,
      material,
      message: 'Material set as default successfully',
    });
  } catch (error) {
    console.error('Set default material error:', error);
    res.status(500).json({ error: 'Failed to set default material' });
  }
});

export default router;
