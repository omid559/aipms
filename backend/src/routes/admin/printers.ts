import { Router } from 'express';
import { Printer } from '../../models/printer.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

/**
 * GET /api/admin/printers
 * Get all printers
 */
router.get('/', async (req, res) => {
  try {
    const { active, search } = req.query;

    const filter: any = {};
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    const printers = await Printer.find(filter)
      .populate('createdBy', 'name email')
      .sort({ isDefault: -1, name: 1 });

    res.json({
      success: true,
      printers,
      count: printers.length,
    });
  } catch (error) {
    console.error('Get printers error:', error);
    res.status(500).json({ error: 'Failed to fetch printers' });
  }
});

/**
 * GET /api/admin/printers/:id
 * Get single printer by ID
 */
router.get('/:id', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid printer ID', errors: errors.array() });
    }

    const printer = await Printer.findById(req.params.id).populate('createdBy', 'name email');

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
 * POST /api/admin/printers
 * Create new printer
 */
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('manufacturer').trim().notEmpty().withMessage('Manufacturer is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('buildVolume.x').isFloat({ min: 0 }).withMessage('Build volume X must be positive'),
  body('buildVolume.y').isFloat({ min: 0 }).withMessage('Build volume Y must be positive'),
  body('buildVolume.z').isFloat({ min: 0 }).withMessage('Build volume Z must be positive'),
  body('nozzle.diameter').isFloat({ min: 0.1, max: 2.0 }).withMessage('Invalid nozzle diameter'),
  body('extruder.type').isIn(['bowden', 'direct']).withMessage('Invalid extruder type'),
  body('bed.type').isIn(['heated', 'unheated']).withMessage('Invalid bed type'),
  body('gcodeFlavor').isIn(['marlin', 'klipper', 'reprap', 'smoothie', 'repetier']).withMessage('Invalid G-code flavor'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const printer = new Printer({
      ...req.body,
      createdBy: req.user!._id,
    });

    await printer.save();

    res.status(201).json({
      success: true,
      printer,
      message: 'Printer created successfully',
    });
  } catch (error: any) {
    console.error('Create printer error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Printer with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create printer' });
  }
});

/**
 * PUT /api/admin/printers/:id
 * Update printer
 */
router.put('/:id', [
  param('id').isMongoId(),
  body('name').optional().trim().notEmpty(),
  body('manufacturer').optional().trim().notEmpty(),
  body('buildVolume.x').optional().isFloat({ min: 0 }),
  body('nozzle.diameter').optional().isFloat({ min: 0.1, max: 2.0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const printer = await Printer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    res.json({
      success: true,
      printer,
      message: 'Printer updated successfully',
    });
  } catch (error) {
    console.error('Update printer error:', error);
    res.status(500).json({ error: 'Failed to update printer' });
  }
});

/**
 * DELETE /api/admin/printers/:id
 * Delete printer
 */
router.delete('/:id', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid printer ID', errors: errors.array() });
    }

    const printer = await Printer.findById(req.params.id);

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    if (printer.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default printer' });
    }

    await printer.deleteOne();

    res.json({
      success: true,
      message: 'Printer deleted successfully',
    });
  } catch (error) {
    console.error('Delete printer error:', error);
    res.status(500).json({ error: 'Failed to delete printer' });
  }
});

/**
 * PATCH /api/admin/printers/:id/toggle-active
 * Toggle printer active status
 */
router.patch('/:id/toggle-active', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
    const printer = await Printer.findById(req.params.id);

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    printer.isActive = !printer.isActive;
    await printer.save();

    res.json({
      success: true,
      printer,
      message: `Printer ${printer.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Toggle printer error:', error);
    res.status(500).json({ error: 'Failed to toggle printer status' });
  }
});

/**
 * PATCH /api/admin/printers/:id/set-default
 * Set printer as default
 */
router.patch('/:id/set-default', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
    const printer = await Printer.findById(req.params.id);

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    printer.isDefault = true;
    await printer.save(); // Pre-save hook will handle unsetting other defaults

    res.json({
      success: true,
      printer,
      message: 'Printer set as default successfully',
    });
  } catch (error) {
    console.error('Set default printer error:', error);
    res.status(500).json({ error: 'Failed to set default printer' });
  }
});

export default router;
