import { SlicingSettings, PrinterProfile } from '../types/slicing.js';
import fs from 'fs/promises';
import path from 'path';
import ini from 'ini';

export class OrcaSlicerConfigGenerator {
  /**
   * Generate OrcaSlicer configuration file from settings
   */
  async generateConfig(
    settings: SlicingSettings,
    printerProfile: PrinterProfile,
    outputPath: string
  ): Promise<string> {
    const config = this.buildConfigObject(settings, printerProfile);
    const configContent = ini.stringify(config);

    await fs.writeFile(outputPath, configContent, 'utf-8');
    return outputPath;
  }

  /**
   * Build configuration object for OrcaSlicer
   */
  private buildConfigObject(settings: SlicingSettings, printer: PrinterProfile): any {
    return {
      print: {
        // Layer settings
        layer_height: settings.layerHeight,
        first_layer_height: settings.initialLayerHeight,
        line_width: settings.lineWidth,

        // Wall settings
        wall_loops: Math.round(settings.wallThickness / settings.lineWidth),
        top_shell_layers: Math.round(settings.topBottomThickness / settings.layerHeight),
        bottom_shell_layers: Math.round(settings.topBottomThickness / settings.layerHeight),

        // Infill settings
        sparse_infill_density: `${settings.infillDensity}%`,
        sparse_infill_pattern: this.mapInfillPattern(settings.infillPattern),
        sparse_infill_line_width: settings.infillLineWidth,

        // Speed settings
        outer_wall_speed: settings.wallSpeed,
        inner_wall_speed: settings.printSpeed,
        sparse_infill_speed: settings.infillSpeed,
        top_surface_speed: settings.topBottomSpeed,
        initial_layer_speed: settings.initialLayerSpeed,
        travel_speed: settings.travelSpeed,

        // Temperature settings
        nozzle_temperature_initial_layer: settings.initialLayerTemperature,
        nozzle_temperature: settings.printingTemperature,
        bed_temperature_initial_layer_single: settings.buildPlateTemperature,
        bed_temperature: settings.buildPlateTemperature,

        // Support settings
        enable_support: settings.supportEnabled ? 1 : 0,
        support_type: 'normal',
        support_style: this.mapSupportPattern(settings.supportPattern),
        support_threshold_angle: settings.supportOverhangAngle,
        support_interface_spacing: settings.supportDensity / 100,

        // Cooling settings
        fan_cooling_layer_time: settings.regularFanSpeedAtHeight,
        fan_min_speed: settings.initialLayerFanSpeed,
        fan_max_speed: settings.fanSpeed,

        // Retraction settings
        retraction_length: settings.retractionEnabled ? settings.retractionDistance : 0,
        retraction_speed: settings.retractionSpeed,

        // Material settings
        filament_type: this.extractMaterialType(settings.material),
        filament_diameter: settings.materialDiameter,
        filament_flow_ratio: settings.flowRate / 100,

        // Quality settings
        wall_infill_order: 'inner wall/outer wall/infill',
        seam_position: 'nearest',

        // Advanced settings
        ironing_type: 'no ironing',
        xy_contour_compensation: 0,
        elefant_foot_compensation: 0.2,
      },

      printer: {
        printer_model: printer.name,
        printable_area: `0x0,${printer.buildVolumeX}x0,${printer.buildVolumeX}x${printer.buildVolumeY},0x${printer.buildVolumeY}`,
        printable_height: printer.buildVolumeZ,
        nozzle_diameter: printer.nozzleDiameter,
        max_print_speed: printer.maxPrintSpeed,

        // Machine limits
        machine_max_speed_x: printer.maxTravelSpeed,
        machine_max_speed_y: printer.maxTravelSpeed,
        machine_max_speed_z: 10,
        machine_max_speed_e: 60,

        // Start/End G-code
        machine_start_gcode: this.generateStartGCode(settings),
        machine_end_gcode: this.generateEndGCode(),
      },

      filament: {
        filament_type: this.extractMaterialType(settings.material),
        filament_colour: '#FF8000',
        filament_diameter: settings.materialDiameter,

        // Temperature
        temperature: settings.printingTemperature,
        bed_temperature: settings.buildPlateTemperature,

        // Cooling
        fan_min_speed: settings.initialLayerFanSpeed,
        fan_max_speed: settings.fanSpeed,

        // Retraction
        retract_length: settings.retractionDistance,
        retract_speed: settings.retractionSpeed,
        retract_lift: 0.2,
      }
    };
  }

  /**
   * Map infill pattern name to OrcaSlicer format
   */
  private mapInfillPattern(pattern: string): string {
    const patternMap: { [key: string]: string } = {
      'grid': 'grid',
      'lines': 'rectilinear',
      'triangles': 'triangles',
      'tri-hexagon': 'trihexagon',
      'cubic': 'cubic',
      'gyroid': 'gyroid',
      'honeycomb': 'honeycomb',
    };
    return patternMap[pattern] || 'grid';
  }

  /**
   * Map support pattern to OrcaSlicer format
   */
  private mapSupportPattern(pattern: string): string {
    const patternMap: { [key: string]: string } = {
      'grid': 'grid',
      'lines': 'rectilinear',
      'zigzag': 'rectilinear',
    };
    return patternMap[pattern] || 'grid';
  }

  /**
   * Extract material type from material name
   */
  private extractMaterialType(materialName: string): string {
    const name = materialName.toUpperCase();
    if (name.includes('PLA')) return 'PLA';
    if (name.includes('ABS')) return 'ABS';
    if (name.includes('PETG')) return 'PETG';
    if (name.includes('TPU')) return 'TPU';
    if (name.includes('NYLON')) return 'PA';
    return 'PLA';
  }

  /**
   * Generate start G-code
   */
  private generateStartGCode(settings: SlicingSettings): string {
    return `
; OrcaSlicer Start G-code
G90 ; use absolute coordinates
M83 ; extruder relative mode
G28 ; home all axes
G1 Z5 F3000 ; lift nozzle
M104 S${settings.printingTemperature} ; set nozzle temp
M140 S${settings.buildPlateTemperature} ; set bed temp
M190 S${settings.buildPlateTemperature} ; wait for bed temp
M109 S${settings.printingTemperature} ; wait for nozzle temp
G1 Z0.2 F3000 ; move to start position
G92 E0 ; reset extruder
G1 X60 E9 F1000 ; intro line
G1 X100 E12.5 F1000 ; intro line
G92 E0 ; reset extruder
    `.trim();
  }

  /**
   * Generate end G-code
   */
  private generateEndGCode(): string {
    return `
; OrcaSlicer End G-code
G91 ; relative positioning
G1 Z5 F3000 ; lift nozzle
G90 ; absolute positioning
G1 X0 Y200 F3000 ; present print
M104 S0 ; turn off nozzle
M140 S0 ; turn off bed
M84 ; disable motors
    `.trim();
  }

  /**
   * Generate 3MF project config
   */
  async generate3MFConfig(
    settings: SlicingSettings,
    printer: PrinterProfile,
    modelPath: string
  ): Promise<any> {
    return {
      settings: this.buildConfigObject(settings, printer),
      model: {
        path: modelPath,
        transform: {
          x: 0,
          y: 0,
          z: 0,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      },
    };
  }
}
