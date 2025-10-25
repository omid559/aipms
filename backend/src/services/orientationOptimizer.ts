import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GAPGPT_API_KEY || '',
  baseURL: process.env.GAPGPT_BASE_URL || 'https://api.gapgpt.app/v1',
});

export interface OrientationScore {
  rotation: THREE.Euler;
  rotationMatrix: number[][];
  score: number;
  supportVolume: number;
  overhangArea: number;
  printTime: number;
  surfaceQuality: number;
  stability: number;
  reasoning: string;
}

export interface OrientationResult {
  bestOrientation: OrientationScore;
  alternatives: OrientationScore[];
  analysis: string;
  appliedRotation: THREE.Matrix4;
}

export class OrientationOptimizer {
  private readonly overhangAngle = 45; // degrees
  private readonly samplingDensity = 24; // number of test orientations

  /**
   * Find the optimal orientation for a 3D model
   */
  async optimizeOrientation(
    modelPath: string,
    materialType?: string,
    printerBedSize?: { x: number; y: number; z: number }
  ): Promise<OrientationResult> {
    console.log('🔄 Starting orientation optimization...');

    // Load the STL model
    const geometry = await this.loadSTL(modelPath);

    // Generate candidate orientations
    const candidates = this.generateCandidateOrientations();
    console.log(`📊 Testing ${candidates.length} candidate orientations...`);

    // Score each orientation
    const scoredOrientations: OrientationScore[] = [];
    for (const rotation of candidates) {
      const score = await this.scoreOrientation(geometry, rotation, materialType);
      scoredOrientations.push(score);
    }

    // Sort by score (higher is better)
    scoredOrientations.sort((a, b) => b.score - a.score);

    const best = scoredOrientations[0];
    const alternatives = scoredOrientations.slice(1, 4); // Top 3 alternatives

    // Use AI to provide detailed analysis
    const analysis = await this.generateAIAnalysis(best, alternatives, materialType);

    // Create the rotation matrix
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(best.rotation);

    console.log(`✅ Best orientation found: ${best.reasoning}`);
    console.log(`   Score: ${best.score.toFixed(2)}, Support: ${best.supportVolume.toFixed(2)}mm³`);

    return {
      bestOrientation: best,
      alternatives,
      analysis,
      appliedRotation: rotationMatrix,
    };
  }

  /**
   * Load STL file and return geometry
   */
  private async loadSTL(filePath: string): Promise<THREE.BufferGeometry> {
    return new Promise((resolve, reject) => {
      const loader = new STLLoader();
      const fileBuffer = fs.readFileSync(filePath);

      try {
        const geometry = loader.parse(fileBuffer.buffer);
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        resolve(geometry);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate candidate orientations to test
   * Uses a combination of:
   * - Flat faces (most stable)
   * - Standard rotations (0°, 90°, 180°, 270°)
   * - Diagonal orientations
   */
  private generateCandidateOrientations(): THREE.Euler[] {
    const orientations: THREE.Euler[] = [];

    // Standard orientations (6 main faces)
    const standardAngles = [0, 90, 180, 270];

    for (const x of [0, 90, 180, 270]) {
      for (const z of [0, 90, 180, 270]) {
        orientations.push(new THREE.Euler(
          THREE.MathUtils.degToRad(x),
          0,
          THREE.MathUtils.degToRad(z),
          'XYZ'
        ));
      }
    }

    // Add some diagonal orientations
    const diagonalAngles = [45, 135, 225, 315];
    for (const x of diagonalAngles) {
      for (const z of [0, 90, 180, 270]) {
        orientations.push(new THREE.Euler(
          THREE.MathUtils.degToRad(x),
          0,
          THREE.MathUtils.degToRad(z),
          'XYZ'
        ));
      }
    }

    return orientations;
  }

  /**
   * Score an orientation based on multiple factors
   */
  private async scoreOrientation(
    geometry: THREE.BufferGeometry,
    rotation: THREE.Euler,
    materialType?: string
  ): Promise<OrientationScore> {
    // Clone and rotate geometry
    const testGeometry = geometry.clone();
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(rotation);
    testGeometry.applyMatrix4(rotationMatrix);
    testGeometry.computeVertexNormals();
    testGeometry.computeBoundingBox();

    // Calculate metrics
    const supportVolume = this.calculateSupportVolume(testGeometry);
    const overhangArea = this.calculateOverhangArea(testGeometry);
    const stability = this.calculateStability(testGeometry);
    const surfaceQuality = this.calculateSurfaceQuality(testGeometry, rotation);
    const printTime = this.estimatePrintTime(testGeometry, supportVolume);

    // Weighted scoring (0-100)
    const weights = {
      support: 0.35,      // Minimize support material (very important)
      overhang: 0.25,     // Minimize overhangs
      stability: 0.15,    // Maximize bed adhesion/stability
      surface: 0.15,      // Maximize surface quality
      time: 0.10,         // Minimize print time
    };

    // Normalize scores (inverse for metrics we want to minimize)
    const maxSupport = 10000; // mm³ (arbitrary max)
    const maxOverhang = 5000; // mm² (arbitrary max)
    const maxTime = 1000; // minutes (arbitrary max)

    const supportScore = Math.max(0, 100 - (supportVolume / maxSupport) * 100);
    const overhangScore = Math.max(0, 100 - (overhangArea / maxOverhang) * 100);
    const stabilityScore = stability * 100;
    const surfaceScore = surfaceQuality * 100;
    const timeScore = Math.max(0, 100 - (printTime / maxTime) * 100);

    const totalScore =
      weights.support * supportScore +
      weights.overhang * overhangScore +
      weights.stability * stabilityScore +
      weights.surface * surfaceScore +
      weights.time * timeScore;

    // Generate reasoning
    const reasoning = this.generateReasoning(
      supportScore,
      overhangScore,
      stabilityScore,
      surfaceScore,
      timeScore
    );

    // Convert rotation to matrix
    const matrix = new THREE.Matrix4().makeRotationFromEuler(rotation);
    const matrixArray = matrix.toArray();
    const rotationMatrix = [
      [matrixArray[0], matrixArray[1], matrixArray[2]],
      [matrixArray[4], matrixArray[5], matrixArray[6]],
      [matrixArray[8], matrixArray[9], matrixArray[10]],
    ];

    return {
      rotation,
      rotationMatrix,
      score: totalScore,
      supportVolume,
      overhangArea,
      printTime,
      surfaceQuality,
      stability,
      reasoning,
    };
  }

  /**
   * Calculate required support material volume
   */
  private calculateSupportVolume(geometry: THREE.BufferGeometry): number {
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    let supportVolume = 0;

    // Check each triangle
    for (let i = 0; i < positions.count; i += 3) {
      // Get triangle normal (average of vertex normals)
      const nx = (normals.getX(i) + normals.getX(i + 1) + normals.getX(i + 2)) / 3;
      const ny = (normals.getY(i) + normals.getY(i + 1) + normals.getY(i + 2)) / 3;
      const nz = (normals.getZ(i) + normals.getZ(i + 1) + normals.getZ(i + 2)) / 3;

      // Calculate angle with vertical (Z-axis pointing up)
      const angleWithVertical = Math.acos(Math.abs(nz) / Math.sqrt(nx * nx + ny * ny + nz * nz));
      const angleInDegrees = THREE.MathUtils.radToDeg(angleWithVertical);

      // If angle > overhang threshold and facing down, needs support
      if (angleInDegrees > this.overhangAngle && nz < 0) {
        // Get triangle area
        const v1 = new THREE.Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        );
        const v2 = new THREE.Vector3(
          positions.getX(i + 1),
          positions.getY(i + 1),
          positions.getZ(i + 1)
        );
        const v3 = new THREE.Vector3(
          positions.getX(i + 2),
          positions.getY(i + 2),
          positions.getZ(i + 2)
        );

        const edge1 = new THREE.Vector3().subVectors(v2, v1);
        const edge2 = new THREE.Vector3().subVectors(v3, v1);
        const cross = new THREE.Vector3().crossVectors(edge1, edge2);
        const area = cross.length() / 2;

        // Estimate support volume (area × average height from bed)
        const avgZ = (v1.z + v2.z + v3.z) / 3;
        const bbox = geometry.boundingBox!;
        const heightFromBed = avgZ - bbox.min.z;

        supportVolume += area * heightFromBed;
      }
    }

    return supportVolume;
  }

  /**
   * Calculate total overhang area
   */
  private calculateOverhangArea(geometry: THREE.BufferGeometry): number {
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    let overhangArea = 0;

    for (let i = 0; i < positions.count; i += 3) {
      const nx = (normals.getX(i) + normals.getX(i + 1) + normals.getX(i + 2)) / 3;
      const ny = (normals.getY(i) + normals.getY(i + 1) + normals.getY(i + 2)) / 3;
      const nz = (normals.getZ(i) + normals.getZ(i + 1) + normals.getZ(i + 2)) / 3;

      const angleWithVertical = Math.acos(Math.abs(nz) / Math.sqrt(nx * nx + ny * ny + nz * nz));
      const angleInDegrees = THREE.MathUtils.radToDeg(angleWithVertical);

      if (angleInDegrees > this.overhangAngle) {
        const v1 = new THREE.Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        );
        const v2 = new THREE.Vector3(
          positions.getX(i + 1),
          positions.getY(i + 1),
          positions.getZ(i + 1)
        );
        const v3 = new THREE.Vector3(
          positions.getX(i + 2),
          positions.getY(i + 2),
          positions.getZ(i + 2)
        );

        const edge1 = new THREE.Vector3().subVectors(v2, v1);
        const edge2 = new THREE.Vector3().subVectors(v3, v1);
        const cross = new THREE.Vector3().crossVectors(edge1, edge2);
        overhangArea += cross.length() / 2;
      }
    }

    return overhangArea;
  }

  /**
   * Calculate stability score based on base area and center of gravity
   */
  private calculateStability(geometry: THREE.BufferGeometry): number {
    const bbox = geometry.boundingBox!;
    const positions = geometry.attributes.position;

    // Calculate base area (footprint on bed)
    const baseThreshold = bbox.min.z + (bbox.max.z - bbox.min.z) * 0.05; // Bottom 5%
    let baseArea = 0;
    let totalVolume = 0;
    let centerOfGravityZ = 0;

    for (let i = 0; i < positions.count; i += 3) {
      const v1 = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      const v2 = new THREE.Vector3(
        positions.getX(i + 1),
        positions.getY(i + 1),
        positions.getZ(i + 1)
      );
      const v3 = new THREE.Vector3(
        positions.getX(i + 2),
        positions.getY(i + 2),
        positions.getZ(i + 2)
      );

      const avgZ = (v1.z + v2.z + v3.z) / 3;

      // If triangle is near the base
      if (avgZ <= baseThreshold) {
        const edge1 = new THREE.Vector3().subVectors(v2, v1);
        const edge2 = new THREE.Vector3().subVectors(v3, v1);
        const cross = new THREE.Vector3().crossVectors(edge1, edge2);
        baseArea += cross.length() / 2;
      }

      // Accumulate for center of gravity
      const triangleArea = new THREE.Vector3().crossVectors(
        new THREE.Vector3().subVectors(v2, v1),
        new THREE.Vector3().subVectors(v3, v1)
      ).length() / 2;

      totalVolume += triangleArea;
      centerOfGravityZ += avgZ * triangleArea;
    }

    if (totalVolume > 0) {
      centerOfGravityZ /= totalVolume;
    }

    const height = bbox.max.z - bbox.min.z;
    const width = Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y);

    // Stability score: larger base area is better, lower center of gravity is better
    const baseScore = Math.min(1, baseArea / (width * width)); // Normalize
    const cogScore = height > 0 ? Math.max(0, 1 - (centerOfGravityZ - bbox.min.z) / height) : 0.5;

    return (baseScore * 0.7 + cogScore * 0.3); // Weight base area more
  }

  /**
   * Calculate surface quality score
   */
  private calculateSurfaceQuality(geometry: THREE.BufferGeometry, rotation: THREE.Euler): number {
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    let verticalFaceArea = 0;
    let totalArea = 0;

    for (let i = 0; i < positions.count; i += 3) {
      const v1 = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      const v2 = new THREE.Vector3(
        positions.getX(i + 1),
        positions.getY(i + 1),
        positions.getZ(i + 1)
      );
      const v3 = new THREE.Vector3(
        positions.getX(i + 2),
        positions.getY(i + 2),
        positions.getZ(i + 2)
      );

      const edge1 = new THREE.Vector3().subVectors(v2, v1);
      const edge2 = new THREE.Vector3().subVectors(v3, v1);
      const cross = new THREE.Vector3().crossVectors(edge1, edge2);
      const area = cross.length() / 2;
      totalArea += area;

      const nx = (normals.getX(i) + normals.getX(i + 1) + normals.getX(i + 2)) / 3;
      const ny = (normals.getY(i) + normals.getY(i + 1) + normals.getY(i + 2)) / 3;
      const nz = (normals.getZ(i) + normals.getZ(i + 1) + normals.getZ(i + 2)) / 3;

      // Vertical or horizontal faces print better
      const angleWithVertical = Math.acos(Math.abs(nz) / Math.sqrt(nx * nx + ny * ny + nz * nz));
      const angleInDegrees = THREE.MathUtils.radToDeg(angleWithVertical);

      if (angleInDegrees < 10 || angleInDegrees > 80) {
        verticalFaceArea += area;
      }
    }

    return totalArea > 0 ? verticalFaceArea / totalArea : 0;
  }

  /**
   * Estimate print time
   */
  private estimatePrintTime(geometry: THREE.BufferGeometry, supportVolume: number): number {
    const bbox = geometry.boundingBox!;
    const height = bbox.max.z - bbox.min.z;

    // Simple estimation based on height and support
    // Assume 0.2mm layer height, 60mm/s print speed
    const layers = height / 0.2;
    const baseTime = layers * 2; // ~2 minutes per layer (very rough)
    const supportTime = supportVolume / 1000; // Additional time for supports

    return baseTime + supportTime;
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    supportScore: number,
    overhangScore: number,
    stabilityScore: number,
    surfaceScore: number,
    timeScore: number
  ): string {
    const parts: string[] = [];

    if (supportScore > 80) parts.push('minimal support needed');
    else if (supportScore > 50) parts.push('moderate support required');
    else parts.push('significant support required');

    if (stabilityScore > 80) parts.push('excellent bed adhesion');
    else if (stabilityScore > 50) parts.push('good stability');
    else parts.push('may need brim/raft');

    if (surfaceScore > 70) parts.push('good surface quality');
    if (overhangScore > 70) parts.push('few overhangs');

    return parts.join(', ');
  }

  /**
   * Use AI to provide detailed analysis
   */
  private async generateAIAnalysis(
    best: OrientationScore,
    alternatives: OrientationScore[],
    materialType?: string
  ): Promise<string> {
    const prompt = `You are a 3D printing expert. Analyze this orientation optimization result:

Best Orientation:
- Score: ${best.score.toFixed(2)}/100
- Support Volume: ${best.supportVolume.toFixed(2)} mm³
- Overhang Area: ${best.overhangArea.toFixed(2)} mm²
- Stability: ${(best.stability * 100).toFixed(2)}%
- Surface Quality: ${(best.surfaceQuality * 100).toFixed(2)}%
- Estimated Print Time: ${best.printTime.toFixed(0)} minutes
- Rotation: X=${THREE.MathUtils.radToDeg(best.rotation.x).toFixed(1)}°, Y=${THREE.MathUtils.radToDeg(best.rotation.y).toFixed(1)}°, Z=${THREE.MathUtils.radToDeg(best.rotation.z).toFixed(1)}°

${materialType ? `Material: ${materialType}` : ''}

Alternative orientations scored: ${alternatives.map(a => a.score.toFixed(2)).join(', ')}

Provide a brief (2-3 sentences) professional analysis in both English and Persian (Farsi) explaining:
1. Why this orientation is optimal
2. Any potential challenges
3. Recommendations for printing

Format:
**English:** [analysis]
**فارسی:** [تحلیل]`;

    try {
      const response = await openai.chat.completions.create({
        model: process.env.GAPGPT_MODEL || 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in 3D printing optimization and FDM/FFF printing technology.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || 'Analysis not available';
    } catch (error) {
      console.error('Failed to generate AI analysis:', error);
      return `**English:** This orientation minimizes support material (${best.supportVolume.toFixed(2)}mm³) while maintaining good bed adhesion and surface quality. ${best.reasoning}.\n\n**فارسی:** این جهت‌گیری حجم ساپورت را به حداقل می‌رساند (${best.supportVolume.toFixed(2)}mm³) در حالی که چسبندگی خوب به بستر و کیفیت سطح را حفظ می‌کند.`;
    }
  }

  /**
   * Apply rotation to an STL file and save it
   */
  async applyRotationToFile(
    inputPath: string,
    outputPath: string,
    rotationMatrix: THREE.Matrix4
  ): Promise<void> {
    const geometry = await this.loadSTL(inputPath);
    geometry.applyMatrix4(rotationMatrix);

    // Export as binary STL
    const bufferGeometry = geometry;
    const vertices = bufferGeometry.attributes.position.array;
    const normals = bufferGeometry.attributes.normal.array;

    // Binary STL format
    const triangles = vertices.length / 9;
    const bufferLength = 84 + triangles * 50;
    const buffer = Buffer.alloc(bufferLength);

    // Header (80 bytes)
    buffer.write('Binary STL created by AIPMS Orientation Optimizer', 0);

    // Number of triangles
    buffer.writeUInt32LE(triangles, 80);

    let offset = 84;
    for (let i = 0; i < triangles; i++) {
      const idx = i * 9;

      // Normal vector
      buffer.writeFloatLE(normals[i * 9], offset);
      buffer.writeFloatLE(normals[i * 9 + 1], offset + 4);
      buffer.writeFloatLE(normals[i * 9 + 2], offset + 8);

      // Vertices
      for (let j = 0; j < 3; j++) {
        buffer.writeFloatLE(vertices[idx + j * 3], offset + 12 + j * 12);
        buffer.writeFloatLE(vertices[idx + j * 3 + 1], offset + 16 + j * 12);
        buffer.writeFloatLE(vertices[idx + j * 3 + 2], offset + 20 + j * 12);
      }

      // Attribute byte count (unused)
      buffer.writeUInt16LE(0, offset + 48);

      offset += 50;
    }

    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Rotated model saved to: ${outputPath}`);
  }
}

export default new OrientationOptimizer();
