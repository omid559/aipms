import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { TrainingExample, SlicingHistory } from '../models/learning.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TrainingDataPoint {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

export class TrainingDataManager {
  private trainingDataDir: string;

  constructor() {
    this.trainingDataDir = path.join(__dirname, '../../../training_data');
  }

  /**
   * Create training example from user feedback
   */
  async createFromFeedback(
    slicingHistory: any,
    feedback: string,
    correctedSettings?: any
  ): Promise<any> {
    try {
      const trainingExample = new TrainingExample({
        source: 'user_feedback',
        modelCharacteristics: {
          volume: slicingHistory.modelInfo.analysis.volume,
          surfaceArea: slicingHistory.modelInfo.analysis.surfaceArea,
          boundingBox: slicingHistory.modelInfo.analysis.boundingBox,
          features: this.extractFeatures(slicingHistory.modelInfo.analysis),
        },
        material: slicingHistory.material.name,
        materialType: slicingHistory.material.type,
        printerType: slicingHistory.printer.name,
        optimalSettings: correctedSettings || slicingHistory.settings,
        reasoning: feedback,
        quality: this.determineQuality(feedback),
      });

      await trainingExample.save();
      return trainingExample;
    } catch (error) {
      console.error('Error creating training example from feedback:', error);
      throw error;
    }
  }

  /**
   * Import training data from standard 3MF file with annotations
   */
  async importFrom3MF(
    filePath: string,
    annotations: {
      description: string;
      expertNotes: string;
      quality: string;
    }
  ): Promise<any> {
    try {
      // Parse 3MF to extract settings
      const settings = await this.parse3MFSettings(filePath);

      const trainingExample = new TrainingExample({
        source: 'imported_3mf',
        optimalSettings: settings,
        reasoning: annotations.description,
        expertNotes: annotations.expertNotes,
        quality: annotations.quality,
        validated: true,
      });

      await trainingExample.save();
      return trainingExample;
    } catch (error) {
      console.error('Error importing from 3MF:', error);
      throw error;
    }
  }

  /**
   * Parse 3MF file to extract slicing settings
   */
  private async parse3MFSettings(filePath: string): Promise<any> {
    // TODO: Implement actual 3MF parsing
    // For now, return a placeholder
    return {
      layerHeight: 0.2,
      infillDensity: 20,
      // ... other settings
    };
  }

  /**
   * Convert training examples to OpenAI fine-tuning format (JSONL)
   */
  async prepareFineTuningData(
    minQuality: string = 'good',
    limit?: number
  ): Promise<string> {
    try {
      // Fetch quality training examples
      const query: any = {
        quality: { $in: ['excellent', 'good'] },
        validated: true,
      };

      if (minQuality === 'excellent') {
        query.quality = 'excellent';
      }

      const examples = await TrainingExample.find(query)
        .limit(limit || 1000)
        .sort({ timestamp: -1 });

      console.log(`Found ${examples.length} training examples`);

      // Convert to fine-tuning format
      const trainingData: TrainingDataPoint[] = examples.map(example =>
        this.convertToFineTuningFormat(example)
      );

      // Save as JSONL
      const timestamp = Date.now();
      const filename = `training_data_${timestamp}.jsonl`;
      const filepath = path.join(this.trainingDataDir, filename);

      // Ensure directory exists
      await fs.mkdir(this.trainingDataDir, { recursive: true });

      // Write JSONL file
      const jsonlContent = trainingData
        .map(data => JSON.stringify(data))
        .join('\n');

      await fs.writeFile(filepath, jsonlContent, 'utf-8');

      console.log(`Training data saved to: ${filepath}`);
      return filepath;

    } catch (error) {
      console.error('Error preparing fine-tuning data:', error);
      throw error;
    }
  }

  /**
   * Convert training example to OpenAI format
   */
  private convertToFineTuningFormat(example: any): TrainingDataPoint {
    const systemPrompt = `You are an expert 3D printing engineer specializing in optimizing slicing parameters.
Analyze the provided model characteristics, material properties, and printer capabilities to
recommend optimal slicing settings. Your recommendations should maximize print quality while
considering efficiency and material usage.`;

    const userPrompt = this.buildUserPrompt(example);
    const assistantResponse = this.buildAssistantResponse(example);

    return {
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        },
        {
          role: 'assistant',
          content: assistantResponse
        }
      ]
    };
  }

  /**
   * Build user prompt from training example
   */
  private buildUserPrompt(example: any): string {
    let prompt = `Optimize 3D printing slicing settings for the following:\n\n`;

    if (example.modelCharacteristics) {
      prompt += `MODEL CHARACTERISTICS:\n`;
      if (example.modelCharacteristics.volume) {
        prompt += `- Volume: ${example.modelCharacteristics.volume.toFixed(2)} mm³\n`;
      }
      if (example.modelCharacteristics.surfaceArea) {
        prompt += `- Surface Area: ${example.modelCharacteristics.surfaceArea.toFixed(2)} mm²\n`;
      }
      if (example.modelCharacteristics.boundingBox) {
        const bb = example.modelCharacteristics.boundingBox;
        prompt += `- Dimensions: ${bb.x}×${bb.y}×${bb.z} mm\n`;
      }
      if (example.modelCharacteristics.features && example.modelCharacteristics.features.length > 0) {
        prompt += `- Features: ${example.modelCharacteristics.features.join(', ')}\n`;
      }
      prompt += `\n`;
    }

    if (example.material) {
      prompt += `MATERIAL: ${example.material}`;
      if (example.materialType) {
        prompt += ` (${example.materialType})`;
      }
      prompt += `\n\n`;
    }

    if (example.printerType) {
      prompt += `PRINTER: ${example.printerType}\n\n`;
    }

    if (example.reasoning) {
      prompt += `CONTEXT: ${example.reasoning}\n\n`;
    }

    prompt += `Provide optimized slicing settings in JSON format.`;

    return prompt;
  }

  /**
   * Build assistant response from training example
   */
  private buildAssistantResponse(example: any): string {
    let response = '';

    if (example.expertNotes) {
      response += `${example.expertNotes}\n\n`;
    }

    response += `Here are the optimized settings:\n\n`;
    response += `\`\`\`json\n${JSON.stringify(example.optimalSettings, null, 2)}\n\`\`\``;

    return response;
  }

  /**
   * Extract features from model analysis
   */
  private extractFeatures(analysis: any): string[] {
    const features: string[] = [];

    if (analysis.overhangs && analysis.overhangs.length > 0) {
      features.push('overhangs');
    }
    if (analysis.thinWalls) {
      features.push('thin_walls');
    }
    if (analysis.bridging) {
      features.push('bridging');
    }

    // Determine complexity based on features
    if (features.length === 0) {
      features.push('simple');
    } else if (features.length >= 2) {
      features.push('complex');
    }

    return features;
  }

  /**
   * Determine quality from feedback text
   */
  private determineQuality(feedback: string): string {
    const lower = feedback.toLowerCase();

    if (lower.includes('excellent') || lower.includes('perfect') || lower.includes('amazing')) {
      return 'excellent';
    }
    if (lower.includes('good') || lower.includes('well') || lower.includes('nice')) {
      return 'good';
    }
    if (lower.includes('acceptable') || lower.includes('okay')) {
      return 'acceptable';
    }
    if (lower.includes('poor') || lower.includes('bad') || lower.includes('failed')) {
      return 'poor';
    }

    return 'good'; // default
  }

  /**
   * Get training data statistics
   */
  async getStatistics(): Promise<{
    totalExamples: number;
    bySource: any;
    byQuality: any;
    byMaterial: any;
    validated: number;
    usedInTraining: number;
  }> {
    try {
      const totalExamples = await TrainingExample.countDocuments();

      const bySource = await TrainingExample.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ]);

      const byQuality = await TrainingExample.aggregate([
        { $group: { _id: '$quality', count: { $sum: 1 } } }
      ]);

      const byMaterial = await TrainingExample.aggregate([
        { $group: { _id: '$materialType', count: { $sum: 1 } } },
        { $limit: 10 }
      ]);

      const validated = await TrainingExample.countDocuments({ validated: true });
      const usedInTraining = await TrainingExample.countDocuments({ usedInTraining: true });

      return {
        totalExamples,
        bySource: bySource.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byQuality: byQuality.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byMaterial: byMaterial.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        validated,
        usedInTraining,
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Validate training example
   */
  async validateExample(exampleId: string, validatedBy: string): Promise<any> {
    try {
      const example = await TrainingExample.findByIdAndUpdate(
        exampleId,
        {
          validated: true,
          validatedBy,
        },
        { new: true }
      );

      return example;
    } catch (error) {
      console.error('Error validating example:', error);
      throw error;
    }
  }

  /**
   * Remove low-quality or duplicate examples
   */
  async cleanupTrainingData(): Promise<{
    removed: number;
    duplicatesRemoved: number;
  }> {
    try {
      // Remove poor quality examples
      const poorResult = await TrainingExample.deleteMany({
        quality: 'poor',
        validated: false,
      });

      // TODO: Implement duplicate detection and removal

      return {
        removed: poorResult.deletedCount || 0,
        duplicatesRemoved: 0,
      };
    } catch (error) {
      console.error('Error cleaning up training data:', error);
      throw error;
    }
  }
}
