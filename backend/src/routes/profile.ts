import { Router } from 'express';
import { MaterialProfile, PrinterProfile } from '../types/slicing.js';

const router = Router();

// Default material profiles
const defaultMaterials: MaterialProfile[] = [
  {
    id: 'pla-standard',
    name: 'PLA Standard',
    type: 'PLA',
    printTemperature: 200,
    bedTemperature: 60,
    fanSpeed: 100,
    retraction: {
      distance: 5,
      speed: 45
    },
    recommended: {
      layerHeight: 0.2,
      printSpeed: 60,
      infillDensity: 20
    }
  },
  {
    id: 'abs-standard',
    name: 'ABS Standard',
    type: 'ABS',
    printTemperature: 240,
    bedTemperature: 100,
    fanSpeed: 30,
    retraction: {
      distance: 5,
      speed: 45
    },
    recommended: {
      layerHeight: 0.2,
      printSpeed: 50,
      infillDensity: 25
    }
  },
  {
    id: 'petg-standard',
    name: 'PETG Standard',
    type: 'PETG',
    printTemperature: 235,
    bedTemperature: 80,
    fanSpeed: 50,
    retraction: {
      distance: 6,
      speed: 40
    },
    recommended: {
      layerHeight: 0.2,
      printSpeed: 50,
      infillDensity: 20
    }
  },
  {
    id: 'tpu-flexible',
    name: 'TPU Flexible',
    type: 'TPU',
    printTemperature: 220,
    bedTemperature: 50,
    fanSpeed: 80,
    retraction: {
      distance: 2,
      speed: 30
    },
    recommended: {
      layerHeight: 0.2,
      printSpeed: 30,
      infillDensity: 15
    }
  }
];

// Default printer profiles
const defaultPrinters: PrinterProfile[] = [
  {
    id: 'ender3-v2',
    name: 'Creality Ender 3 V2',
    buildVolumeX: 220,
    buildVolumeY: 220,
    buildVolumeZ: 250,
    nozzleDiameter: 0.4,
    maxPrintSpeed: 150,
    maxTravelSpeed: 200,
    maxTemperature: 260
  },
  {
    id: 'prusa-mk3s',
    name: 'Prusa i3 MK3S+',
    buildVolumeX: 250,
    buildVolumeY: 210,
    buildVolumeZ: 210,
    nozzleDiameter: 0.4,
    maxPrintSpeed: 200,
    maxTravelSpeed: 250,
    maxTemperature: 300
  },
  {
    id: 'cr10',
    name: 'Creality CR-10',
    buildVolumeX: 300,
    buildVolumeY: 300,
    buildVolumeZ: 400,
    nozzleDiameter: 0.4,
    maxPrintSpeed: 150,
    maxTravelSpeed: 200,
    maxTemperature: 275
  }
];

// Get all material profiles
router.get('/materials', (req, res) => {
  res.json({
    success: true,
    materials: defaultMaterials
  });
});

// Get specific material profile
router.get('/materials/:id', (req, res) => {
  const material = defaultMaterials.find(m => m.id === req.params.id);

  if (!material) {
    return res.status(404).json({ error: 'Material profile not found' });
  }

  res.json({
    success: true,
    material
  });
});

// Get all printer profiles
router.get('/printers', (req, res) => {
  res.json({
    success: true,
    printers: defaultPrinters
  });
});

// Get specific printer profile
router.get('/printers/:id', (req, res) => {
  const printer = defaultPrinters.find(p => p.id === req.params.id);

  if (!printer) {
    return res.status(404).json({ error: 'Printer profile not found' });
  }

  res.json({
    success: true,
    printer
  });
});

// Create custom material profile
router.post('/materials', (req, res) => {
  try {
    const newMaterial: MaterialProfile = {
      id: `custom-${Date.now()}`,
      ...req.body
    };

    defaultMaterials.push(newMaterial);

    res.json({
      success: true,
      material: newMaterial
    });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Failed to create material profile' });
  }
});

// Create custom printer profile
router.post('/printers', (req, res) => {
  try {
    const newPrinter: PrinterProfile = {
      id: `custom-${Date.now()}`,
      ...req.body
    };

    defaultPrinters.push(newPrinter);

    res.json({
      success: true,
      printer: newPrinter
    });
  } catch (error) {
    console.error('Create printer error:', error);
    res.status(500).json({ error: 'Failed to create printer profile' });
  }
});

export default router;
