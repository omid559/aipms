import { Router } from 'express';
import printersRouter from './printers.js';
import materialsRouter from './materials.js';
import slicerSettingsRouter from './slicerSettings.js';

const router = Router();

// Mount sub-routes
router.use('/printers', printersRouter);
router.use('/materials', materialsRouter);
router.use('/slicer-settings', slicerSettingsRouter);

export default router;
