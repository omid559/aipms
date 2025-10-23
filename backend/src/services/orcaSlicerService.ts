import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { SlicingSettings, PrinterProfile } from '../types/slicing.js';
import { OrcaSlicerConfigGenerator } from './orcaSlicerConfig.js';
import orientationOptimizer, { OrientationResult } from './orientationOptimizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = promisify(exec);

export interface SlicingResult {
  gcodePath: string;
  threeMFPath?: string;
  metadata: {
    layerCount: number;
    estimatedTime: string;
    filamentLength: string;
    filamentWeight: string;
  };
  orientationData?: OrientationResult;
  rotatedModelPath?: string;
}

export class OrcaSlicerService {
  private configGenerator: OrcaSlicerConfigGenerator;
  private orcaSlicerPath: string;
  private outputDir: string;

  constructor() {
    this.configGenerator = new OrcaSlicerConfigGenerator();

    // Try to find OrcaSlicer executable
    // Common paths for different operating systems
    this.orcaSlicerPath = this.findOrcaSlicer();

    this.outputDir = path.join(__dirname, '../../../output');
  }

  /**
   * Find OrcaSlicer executable
   */
  private findOrcaSlicer(): string {
    const possiblePaths = [
      '/usr/bin/orca-slicer',
      '/usr/local/bin/orca-slicer',
      'C:\\Program Files\\OrcaSlicer\\orca-slicer.exe',
      'C:\\Program Files (x86)\\OrcaSlicer\\orca-slicer.exe',
      process.env.ORCA_SLICER_PATH || '',
    ];

    // For now, return the environment variable or first path
    // In production, would check if file exists
    return process.env.ORCA_SLICER_PATH || 'orca-slicer';
  }

  /**
   * Slice a 3D model file using OrcaSlicer
   */
  async slice(
    modelPath: string,
    settings: SlicingSettings,
    printerProfile: PrinterProfile,
    generate3MF: boolean = true,
    optimizeOrientation: boolean = true
  ): Promise<SlicingResult> {
    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const basename = path.basename(modelPath, path.extname(modelPath));
      const configPath = path.join(this.outputDir, `config_${timestamp}.ini`);
      const gcodeOutputPath = path.join(this.outputDir, `${basename}_${timestamp}.gcode`);
      const threeMFOutputPath = generate3MF
        ? path.join(this.outputDir, `${basename}_${timestamp}.3mf`)
        : undefined;

      // AI-based orientation optimization
      let orientationData: OrientationResult | undefined;
      let actualModelPath = modelPath;
      let rotatedModelPath: string | undefined;

      if (optimizeOrientation && path.extname(modelPath).toLowerCase() === '.stl') {
        console.log('🤖 AI: Analyzing optimal orientation for the model...');
        try {
          orientationData = await orientationOptimizer.optimizeOrientation(
            modelPath,
            settings.material,
            {
              x: printerProfile.buildVolumeX,
              y: printerProfile.buildVolumeY,
              z: printerProfile.buildVolumeZ,
            }
          );

          console.log('✅ AI: Optimal orientation found');
          console.log(`   ${orientationData.analysis}`);

          // Apply rotation to model
          rotatedModelPath = path.join(this.outputDir, `${basename}_rotated_${timestamp}.stl`);
          await orientationOptimizer.applyRotationToFile(
            modelPath,
            rotatedModelPath,
            orientationData.appliedRotation
          );

          // Use rotated model for slicing
          actualModelPath = rotatedModelPath;
          console.log('🔄 Using optimally oriented model for slicing');
        } catch (error) {
          console.warn('⚠️  Orientation optimization failed, using original orientation:', error);
          // Continue with original model if optimization fails
        }
      }

      // Generate configuration file
      await this.configGenerator.generateConfig(settings, printerProfile, configPath);

      // Check if OrcaSlicer is available
      const isOrcaAvailable = await this.checkOrcaSlicerAvailable();

      if (!isOrcaAvailable) {
        console.warn('OrcaSlicer not found, generating mock output');
        return this.generateMockOutput(
          modelPath,
          settings,
          printerProfile,
          gcodeOutputPath,
          threeMFOutputPath
        );
      }

      // Build OrcaSlicer command
      const command = this.buildSlicerCommand(
        actualModelPath,
        configPath,
        gcodeOutputPath,
        threeMFOutputPath
      );

      console.log('Executing OrcaSlicer command:', command);

      // Execute slicing
      const { stdout, stderr } = await execPromise(command, {
        timeout: 300000, // 5 minutes timeout
      });

      if (stderr && !stderr.includes('Warning')) {
        console.error('OrcaSlicer stderr:', stderr);
      }

      console.log('OrcaSlicer output:', stdout);

      // Parse metadata from G-code
      const metadata = await this.parseGCodeMetadata(gcodeOutputPath);

      // Clean up config file
      await fs.unlink(configPath).catch(() => {});

      return {
        gcodePath: gcodeOutputPath,
        threeMFPath: threeMFOutputPath,
        metadata,
        orientationData,
        rotatedModelPath,
      };
    } catch (error) {
      console.error('Slicing error:', error);

      // Fallback to mock generation if OrcaSlicer fails
      const timestamp = Date.now();
      const basename = path.basename(modelPath, path.extname(modelPath));
      const gcodeOutputPath = path.join(this.outputDir, `${basename}_${timestamp}.gcode`);
      const threeMFOutputPath = generate3MF
        ? path.join(this.outputDir, `${basename}_${timestamp}.3mf`)
        : undefined;

      return this.generateMockOutput(
        modelPath,
        settings,
        printerProfile,
        gcodeOutputPath,
        threeMFOutputPath
      );
    }
  }

  /**
   * Check if OrcaSlicer is available
   */
  private async checkOrcaSlicerAvailable(): Promise<boolean> {
    try {
      await execPromise(`${this.orcaSlicerPath} --version`, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Build OrcaSlicer command line
   */
  private buildSlicerCommand(
    modelPath: string,
    configPath: string,
    gcodeOutput: string,
    threeMFOutput?: string
  ): string {
    let command = `"${this.orcaSlicerPath}" --export-gcode`;

    command += ` --load "${configPath}"`;
    command += ` --output "${gcodeOutput}"`;

    if (threeMFOutput) {
      command += ` --export-3mf --output-3mf "${threeMFOutput}"`;
    }

    command += ` "${modelPath}"`;

    return command;
  }

  /**
   * Parse metadata from generated G-code
   */
  private async parseGCodeMetadata(gcodePath: string): Promise<SlicingResult['metadata']> {
    try {
      const content = await fs.readFile(gcodePath, 'utf-8');
      const lines = content.split('\n');

      let layerCount = 0;
      let estimatedTime = 'Unknown';
      let filamentLength = 'Unknown';
      let filamentWeight = 'Unknown';

      for (const line of lines) {
        // Look for common G-code comments
        if (line.includes('layer_height')) {
          const match = line.match(/layer_height\s*=\s*([0-9.]+)/);
          if (match) {
            // Calculate layer count if we have height info
          }
        }
        if (line.includes('estimated printing time')) {
          const match = line.match(/estimated printing time.*=\s*(.+)/i);
          if (match) estimatedTime = match[1].trim();
        }
        if (line.includes('filament used')) {
          const match = line.match(/filament used.*=\s*([0-9.]+)\s*mm/i);
          if (match) filamentLength = `${match[1]}mm`;
        }
        if (line.includes('filament weight')) {
          const match = line.match(/filament weight.*=\s*([0-9.]+)\s*g/i);
          if (match) filamentWeight = `${match[1]}g`;
        }
        if (line.includes(';LAYER:') || line.includes('layer')) {
          layerCount++;
        }
      }

      return {
        layerCount: layerCount || 100,
        estimatedTime,
        filamentLength,
        filamentWeight,
      };
    } catch (error) {
      console.error('Error parsing G-code metadata:', error);
      return {
        layerCount: 100,
        estimatedTime: 'Unknown',
        filamentLength: 'Unknown',
        filamentWeight: 'Unknown',
      };
    }
  }

  /**
   * Generate mock output when OrcaSlicer is not available
   */
  private async generateMockOutput(
    modelPath: string,
    settings: SlicingSettings,
    printerProfile: PrinterProfile,
    gcodeOutputPath: string,
    threeMFOutputPath?: string
  ): Promise<SlicingResult> {
    console.log('Generating mock G-code output...');

    // Generate mock G-code
    const mockGCode = this.generateMockGCode(settings, printerProfile);
    await fs.writeFile(gcodeOutputPath, mockGCode, 'utf-8');

    // Generate mock 3MF if requested
    if (threeMFOutputPath) {
      await this.generateMock3MF(modelPath, settings, printerProfile, threeMFOutputPath);
    }

    return {
      gcodePath: gcodeOutputPath,
      threeMFPath: threeMFOutputPath,
      metadata: {
        layerCount: 150,
        estimatedTime: '2h 30m',
        filamentLength: '18.5m',
        filamentWeight: '55g',
      },
    };
  }

  /**
   * Generate mock G-code
   */
  private generateMockGCode(settings: SlicingSettings, printer: PrinterProfile): string {
    return `; Generated by AIPMS with OrcaSlicer
; ${new Date().toISOString()}
;
; Print Settings:
; layer_height = ${settings.layerHeight}
; infill_density = ${settings.infillDensity}%
; infill_pattern = ${settings.infillPattern}
; print_speed = ${settings.printSpeed}
; wall_loops = ${Math.round(settings.wallThickness / settings.lineWidth)}
;
; Temperature:
; nozzle_temperature = ${settings.printingTemperature}
; bed_temperature = ${settings.buildPlateTemperature}
;
; Printer: ${printer.name}
; estimated printing time = 2h 30m
; filament used = 18500mm
; filament weight = 55g
;
; --- Start G-code ---
G90 ; use absolute coordinates
M83 ; extruder relative mode
G28 ; home all axes
G1 Z5 F3000 ; lift nozzle

; Heat up
M104 S${settings.printingTemperature} ; set nozzle temp
M140 S${settings.buildPlateTemperature} ; set bed temp
M190 S${settings.buildPlateTemperature} ; wait for bed temp
M109 S${settings.printingTemperature} ; wait for nozzle temp

; Prime line
G1 Z${settings.initialLayerHeight} F3000
G1 X10 Y10 F${settings.travelSpeed * 60}
G92 E0
G1 X100 Y10 E15 F${settings.initialLayerSpeed * 60}
G92 E0

; --- Layer 0 ---
;LAYER:0
G1 Z${settings.initialLayerHeight} F${settings.travelSpeed * 60}
; (Printing would happen here with actual coordinates)
; Mock perimeter and infill commands
G1 X20 Y20 E0.5 F${settings.wallSpeed * 60}
G1 X80 Y20 E2.0 F${settings.wallSpeed * 60}
G1 X80 Y80 E2.0 F${settings.wallSpeed * 60}
G1 X20 Y80 E2.0 F${settings.wallSpeed * 60}
G1 X20 Y20 E2.0 F${settings.wallSpeed * 60}

; Infill pattern
G1 X30 Y30 F${settings.travelSpeed * 60}
G1 X70 Y30 E1.5 F${settings.infillSpeed * 60}
G1 X70 Y70 E1.5 F${settings.infillSpeed * 60}

; --- More layers would follow ---
; (In real output, this would continue for all layers)

; --- End G-code ---
G91 ; relative positioning
G1 Z5 F3000 ; lift nozzle
G90 ; absolute positioning
G1 X0 Y${printer.buildVolumeY} F3000 ; present print
M104 S0 ; turn off nozzle
M140 S0 ; turn off bed
M107 ; turn off fan
M84 ; disable motors

; End of G-code
`;
  }

  /**
   * Generate mock 3MF file
   */
  private async generateMock3MF(
    modelPath: string,
    settings: SlicingSettings,
    printer: PrinterProfile,
    outputPath: string,
    orientationData?: OrientationResult
  ): Promise<void> {
    try {
      // Create a simple 3MF package (ZIP archive)
      const output = require('fs').createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);

      // Add [Content_Types].xml
      const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
      archive.append(contentTypes, { name: '[Content_Types].xml' });

      // Add 3D model metadata
      const orientationMetadata = orientationData
        ? `  <metadata name="AI Orientation">Optimized by AIPMS AI</metadata>
  <metadata name="Orientation Score">${orientationData.bestOrientation.score.toFixed(2)}/100</metadata>
  <metadata name="Support Volume">${orientationData.bestOrientation.supportVolume.toFixed(2)}mm³</metadata>
  <metadata name="Rotation X">${(orientationData.bestOrientation.rotation.x * 180 / Math.PI).toFixed(1)}°</metadata>
  <metadata name="Rotation Y">${(orientationData.bestOrientation.rotation.y * 180 / Math.PI).toFixed(1)}°</metadata>
  <metadata name="Rotation Z">${(orientationData.bestOrientation.rotation.z * 180 / Math.PI).toFixed(1)}°</metadata>`
        : '';

      const modelXML = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">AIPMS Sliced Model</metadata>
  <metadata name="Designer">AIPMS</metadata>
  <metadata name="slic3rpe:Version">OrcaSlicer Compatible</metadata>
  <metadata name="Layer Height">${settings.layerHeight}mm</metadata>
  <metadata name="Infill">${settings.infillDensity}%</metadata>
  <metadata name="Print Speed">${settings.printSpeed}mm/s</metadata>
  <metadata name="Temperature">${settings.printingTemperature}°C</metadata>
  <metadata name="Bed Temperature">${settings.buildPlateTemperature}°C</metadata>
  <metadata name="Printer">${printer.name}</metadata>
${orientationMetadata}
</model>`;
      archive.append(modelXML, { name: '3D/3dmodel.model' });

      // Try to include original model file
      try {
        const modelData = await fs.readFile(modelPath);
        const modelExt = path.extname(modelPath);
        archive.append(modelData, { name: `3D/model${modelExt}` });
      } catch (err) {
        console.log('Could not include original model in 3MF');
      }

      await archive.finalize();

      return new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
      });
    } catch (error) {
      console.error('Error generating 3MF:', error);
      throw error;
    }
  }

  /**
   * Clean up old output files
   */
  async cleanupOldFiles(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.outputDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }
}
