export interface SlicingSettings {
  // Print Settings
  layerHeight: number;
  initialLayerHeight: number;
  lineWidth: number;
  wallThickness: number;
  topBottomThickness: number;

  // Infill Settings
  infillDensity: number;
  infillPattern: 'grid' | 'lines' | 'triangles' | 'tri-hexagon' | 'cubic' | 'gyroid' | 'honeycomb';
  infillLineWidth: number;

  // Speed Settings
  printSpeed: number;
  infillSpeed: number;
  wallSpeed: number;
  topBottomSpeed: number;
  travelSpeed: number;
  initialLayerSpeed: number;

  // Temperature Settings
  printingTemperature: number;
  buildPlateTemperature: number;
  initialLayerTemperature: number;

  // Support Settings
  supportEnabled: boolean;
  supportDensity: number;
  supportPattern: 'grid' | 'lines' | 'zigzag';
  supportOverhangAngle: number;

  // Cooling Settings
  fanSpeed: number;
  initialLayerFanSpeed: number;
  regularFanSpeedAtHeight: number;

  // Retraction Settings
  retractionEnabled: boolean;
  retractionDistance: number;
  retractionSpeed: number;

  // Material Settings
  material: string;
  materialDiameter: number;
  flowRate: number;
}

export interface PrinterProfile {
  id: string;
  name: string;
  buildVolumeX: number;
  buildVolumeY: number;
  buildVolumeZ: number;
  nozzleDiameter: number;
  maxPrintSpeed: number;
  maxTravelSpeed: number;
  maxTemperature: number;
}

export interface MaterialProfile {
  id: string;
  name: string;
  type: 'PLA' | 'ABS' | 'PETG' | 'TPU' | 'Nylon' | 'Other';
  printTemperature: number;
  bedTemperature: number;
  fanSpeed: number;
  retraction: {
    distance: number;
    speed: number;
  };
  recommended: Partial<SlicingSettings>;
}

export interface ModelAnalysis {
  volume: number;
  surfaceArea: number;
  boundingBox: {
    x: number;
    y: number;
    z: number;
  };
  overhangs: Array<{
    angle: number;
    area: number;
  }>;
  thinWalls: boolean;
  bridging: boolean;
  estimatedPrintTime?: number;
  estimatedMaterialUsage?: number;
}
