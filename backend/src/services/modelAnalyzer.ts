import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import stl from 'node-stl';
import { ModelAnalysis } from '../types/slicing.js';

const execPromise = promisify(exec);

export class ModelAnalyzer {
  /**
   * Analyze a 3D model file (STL, OBJ, 3MF)
   */
  async analyzeModel(filePath: string): Promise<ModelAnalysis> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.stl':
        return this.analyzeSTL(filePath);
      case '.obj':
        return this.analyzeOBJ(filePath);
      case '.3mf':
        return this.analyze3MF(filePath);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * Analyze STL file
   */
  private async analyzeSTL(filePath: string): Promise<ModelAnalysis> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const stlModel = stl.toObject(fileBuffer);

      // Calculate bounding box
      const boundingBox = this.calculateBoundingBox(stlModel);

      // Calculate volume (using signed volume of triangles)
      const volume = this.calculateVolume(stlModel);

      // Calculate surface area
      const surfaceArea = this.calculateSurfaceArea(stlModel);

      // Detect overhangs
      const overhangs = this.detectOverhangs(stlModel);

      // Detect thin walls (simplified check)
      const thinWalls = this.detectThinWalls(stlModel, boundingBox);

      // Detect bridging needs
      const bridging = this.detectBridging(stlModel);

      return {
        volume,
        surfaceArea,
        boundingBox,
        overhangs,
        thinWalls,
        bridging,
        estimatedPrintTime: this.estimatePrintTime(volume, surfaceArea),
        estimatedMaterialUsage: this.estimateMaterialUsage(volume),
      };
    } catch (error) {
      console.error('STL analysis error:', error);
      throw new Error('Failed to analyze STL file');
    }
  }

  /**
   * Calculate bounding box from STL data
   */
  private calculateBoundingBox(stlModel: any): { x: number; y: number; z: number } {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    if (stlModel.facets && Array.isArray(stlModel.facets)) {
      for (const facet of stlModel.facets) {
        if (facet.verts) {
          for (const vert of facet.verts) {
            minX = Math.min(minX, vert[0]);
            maxX = Math.max(maxX, vert[0]);
            minY = Math.min(minY, vert[1]);
            maxY = Math.max(maxY, vert[1]);
            minZ = Math.min(minZ, vert[2]);
            maxZ = Math.max(maxZ, vert[2]);
          }
        }
      }
    }

    return {
      x: Math.abs(maxX - minX),
      y: Math.abs(maxY - minY),
      z: Math.abs(maxZ - minZ),
    };
  }

  /**
   * Calculate volume using signed volume of triangles method
   */
  private calculateVolume(stlModel: any): number {
    let volume = 0;

    if (stlModel.facets && Array.isArray(stlModel.facets)) {
      for (const facet of stlModel.facets) {
        if (facet.verts && facet.verts.length === 3) {
          const [v1, v2, v3] = facet.verts;

          // Signed volume of tetrahedron formula
          const signedVolume = (
            v1[0] * (v2[1] * v3[2] - v2[2] * v3[1]) +
            v1[1] * (v2[2] * v3[0] - v2[0] * v3[2]) +
            v1[2] * (v2[0] * v3[1] - v2[1] * v3[0])
          ) / 6;

          volume += signedVolume;
        }
      }
    }

    return Math.abs(volume);
  }

  /**
   * Calculate surface area
   */
  private calculateSurfaceArea(stlModel: any): number {
    let area = 0;

    if (stlModel.facets && Array.isArray(stlModel.facets)) {
      for (const facet of stlModel.facets) {
        if (facet.verts && facet.verts.length === 3) {
          const [v1, v2, v3] = facet.verts;

          // Calculate triangle area using cross product
          const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
          const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];

          const cross = [
            edge1[1] * edge2[2] - edge1[2] * edge2[1],
            edge1[2] * edge2[0] - edge1[0] * edge2[2],
            edge1[0] * edge2[1] - edge1[1] * edge2[0],
          ];

          const magnitude = Math.sqrt(cross[0] ** 2 + cross[1] ** 2 + cross[2] ** 2);
          area += magnitude / 2;
        }
      }
    }

    return area;
  }

  /**
   * Detect overhangs (surfaces with steep angles)
   */
  private detectOverhangs(stlModel: any): Array<{ angle: number; area: number }> {
    const overhangs: Array<{ angle: number; area: number }> = [];
    const overhangThreshold = 45; // degrees

    if (stlModel.facets && Array.isArray(stlModel.facets)) {
      for (const facet of stlModel.facets) {
        if (facet.normal) {
          // Calculate angle from vertical (Z axis)
          const normal = facet.normal;
          const angleFromVertical = Math.acos(Math.abs(normal[2])) * (180 / Math.PI);

          if (angleFromVertical > overhangThreshold && facet.verts && facet.verts.length === 3) {
            const [v1, v2, v3] = facet.verts;
            const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
            const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
            const cross = [
              edge1[1] * edge2[2] - edge1[2] * edge2[1],
              edge1[2] * edge2[0] - edge1[0] * edge2[2],
              edge1[0] * edge2[1] - edge1[1] * edge2[0],
            ];
            const area = Math.sqrt(cross[0] ** 2 + cross[1] ** 2 + cross[2] ** 2) / 2;

            overhangs.push({
              angle: angleFromVertical,
              area,
            });
          }
        }
      }
    }

    // Group nearby overhangs
    return this.groupOverhangs(overhangs);
  }

  /**
   * Group overhangs by proximity
   */
  private groupOverhangs(overhangs: Array<{ angle: number; area: number }>): Array<{ angle: number; area: number }> {
    if (overhangs.length === 0) return [];

    // Simple grouping by angle range
    const grouped: { [key: string]: { angle: number; area: number } } = {};

    for (const overhang of overhangs) {
      const angleKey = Math.floor(overhang.angle / 5) * 5; // Group by 5-degree increments
      if (!grouped[angleKey]) {
        grouped[angleKey] = { angle: angleKey, area: 0 };
      }
      grouped[angleKey].area += overhang.area;
    }

    return Object.values(grouped);
  }

  /**
   * Detect thin walls (simplified)
   */
  private detectThinWalls(stlModel: any, boundingBox: { x: number; y: number; z: number }): boolean {
    // Simple heuristic: if any dimension is very small compared to others
    const minDimension = Math.min(boundingBox.x, boundingBox.y, boundingBox.z);
    const maxDimension = Math.max(boundingBox.x, boundingBox.y, boundingBox.z);

    return minDimension < maxDimension * 0.05; // Less than 5% of largest dimension
  }

  /**
   * Detect bridging needs
   */
  private detectBridging(stlModel: any): boolean {
    // Check for horizontal surfaces that are not at the bottom
    if (stlModel.facets && Array.isArray(stlModel.facets)) {
      let hasHorizontalNonBase = false;
      let minZ = Infinity;

      // Find minimum Z
      for (const facet of stlModel.facets) {
        if (facet.verts) {
          for (const vert of facet.verts) {
            minZ = Math.min(minZ, vert[2]);
          }
        }
      }

      // Check for horizontal surfaces above base
      for (const facet of stlModel.facets) {
        if (facet.normal && facet.verts) {
          const avgZ = facet.verts.reduce((sum: number, v: number[]) => sum + v[2], 0) / facet.verts.length;
          const isHorizontal = Math.abs(facet.normal[2]) > 0.9; // Nearly horizontal
          const isAboveBase = avgZ > minZ + 1; // More than 1mm above base

          if (isHorizontal && isAboveBase) {
            hasHorizontalNonBase = true;
            break;
          }
        }
      }

      return hasHorizontalNonBase;
    }

    return false;
  }

  /**
   * Estimate print time (rough calculation)
   */
  private estimatePrintTime(volume: number, surfaceArea: number): number {
    // Very rough estimate based on volume and surface area
    // Assumes average print speed of 50mm/s and 20% infill
    const volumeTime = (volume * 0.2) / 50; // seconds for infill
    const shellTime = (surfaceArea * 0.4) / 40; // seconds for shell
    return Math.round(volumeTime + shellTime);
  }

  /**
   * Estimate material usage (grams)
   */
  private estimateMaterialUsage(volume: number): number {
    // Assuming PLA density of 1.24 g/cm³ and 20% infill
    const density = 1.24; // g/cm³
    const infillFactor = 0.2;
    const volumeCm3 = volume / 1000; // Convert mm³ to cm³
    return Math.round(volumeCm3 * density * infillFactor * 10) / 10;
  }

  /**
   * Analyze OBJ file (simplified - would need proper OBJ parser)
   */
  private async analyzeOBJ(filePath: string): Promise<ModelAnalysis> {
    // For now, return basic analysis
    // In production, would parse OBJ format properly
    return {
      volume: 10000,
      surfaceArea: 5000,
      boundingBox: { x: 50, y: 50, z: 30 },
      overhangs: [],
      thinWalls: false,
      bridging: false,
      estimatedPrintTime: 3600,
      estimatedMaterialUsage: 20,
    };
  }

  /**
   * Analyze 3MF file (would need proper 3MF parser)
   */
  private async analyze3MF(filePath: string): Promise<ModelAnalysis> {
    // For now, return basic analysis
    // In production, would parse 3MF format properly
    return {
      volume: 10000,
      surfaceArea: 5000,
      boundingBox: { x: 50, y: 50, z: 30 },
      overhangs: [],
      thinWalls: false,
      bridging: false,
      estimatedPrintTime: 3600,
      estimatedMaterialUsage: 20,
    };
  }
}
