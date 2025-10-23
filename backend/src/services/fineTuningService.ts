import OpenAI from 'openai';
import fs from 'fs';
import { FineTuningJob, ModelPerformance } from '../models/learning.js';
import { TrainingDataManager } from './trainingDataManager.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export class FineTuningService {
  private trainingDataManager: TrainingDataManager;

  constructor() {
    this.trainingDataManager = new TrainingDataManager();
  }

  /**
   * Start a new fine-tuning job
   */
  async startFineTuning(options: {
    baseModel?: string;
    minQuality?: string;
    epochs?: number;
    learningRate?: number;
  } = {}): Promise<any> {
    try {
      console.log('Preparing training data...');

      // Prepare training data
      const trainingFilePath = await this.trainingDataManager.prepareFineTuningData(
        options.minQuality || 'good'
      );

      // Upload training file to OpenAI
      console.log('Uploading training file to OpenAI...');
      const trainingFile = await openai.files.create({
        file: fs.createReadStream(trainingFilePath),
        purpose: 'fine-tune',
      });

      console.log(`Training file uploaded: ${trainingFile.id}`);

      // Create fine-tuning job
      const baseModel = options.baseModel || 'gpt-4o-mini-2024-07-18';

      console.log(`Creating fine-tuning job with base model: ${baseModel}`);

      const fineTuneJob = await openai.fineTuning.jobs.create({
        training_file: trainingFile.id,
        model: baseModel,
        hyperparameters: {
          n_epochs: options.epochs || 3,
        },
        suffix: 'aipms-slicer',
      });

      console.log(`Fine-tuning job created: ${fineTuneJob.id}`);

      // Save job to database
      const jobRecord = new FineTuningJob({
        openAIJobId: fineTuneJob.id,
        modelName: `aipms-slicer-${Date.now()}`,
        baseModel,
        trainingFileId: trainingFile.id,
        status: fineTuneJob.status,
      });

      await jobRecord.save();

      return {
        jobId: fineTuneJob.id,
        status: fineTuneJob.status,
        databaseId: jobRecord._id,
        message: 'Fine-tuning job started successfully',
      };

    } catch (error) {
      console.error('Error starting fine-tuning:', error);
      throw error;
    }
  }

  /**
   * Check status of fine-tuning job
   */
  async checkJobStatus(jobId: string): Promise<any> {
    try {
      // Get status from OpenAI
      const job = await openai.fineTuning.jobs.retrieve(jobId);

      // Update database
      await FineTuningJob.findOneAndUpdate(
        { openAIJobId: jobId },
        {
          status: job.status,
          fineTunedModel: job.fine_tuned_model,
          trainingMetrics: job.result_files || [],
        }
      );

      return {
        jobId: job.id,
        status: job.status,
        fineTunedModel: job.fine_tuned_model,
        createdAt: job.created_at,
        finishedAt: job.finished_at,
        error: job.error,
      };

    } catch (error) {
      console.error('Error checking job status:', error);
      throw error;
    }
  }

  /**
   * List all fine-tuning jobs
   */
  async listJobs(limit: number = 10): Promise<any[]> {
    try {
      const jobs = await FineTuningJob.find()
        .sort({ timestamp: -1 })
        .limit(limit);

      return jobs;
    } catch (error) {
      console.error('Error listing jobs:', error);
      throw error;
    }
  }

  /**
   * Deploy a fine-tuned model
   */
  async deployModel(jobId: string): Promise<any> {
    try {
      const job = await FineTuningJob.findOne({ openAIJobId: jobId });

      if (!job) {
        throw new Error('Job not found');
      }

      if (job.status !== 'succeeded') {
        throw new Error('Job has not completed successfully');
      }

      if (!job.fineTunedModel) {
        throw new Error('Fine-tuned model not available');
      }

      // Mark as deployed
      job.deployed = true;
      job.deploymentTimestamp = new Date();
      await job.save();

      // Update environment or configuration to use this model
      // In production, you would update your config service here

      return {
        success: true,
        modelId: job.fineTunedModel,
        message: 'Model deployed successfully',
      };

    } catch (error) {
      console.error('Error deploying model:', error);
      throw error;
    }
  }

  /**
   * Get currently deployed model
   */
  async getDeployedModel(): Promise<string | null> {
    try {
      const deployedJob = await FineTuningJob.findOne({ deployed: true })
        .sort({ deploymentTimestamp: -1 });

      return deployedJob?.fineTunedModel || null;
    } catch (error) {
      console.error('Error getting deployed model:', error);
      return null;
    }
  }

  /**
   * Use fine-tuned model for optimization
   */
  async optimizeWithFineTunedModel(
    modelAnalysis: any,
    materialProfile: any,
    printerProfile: any
  ): Promise<any> {
    try {
      const deployedModel = await this.getDeployedModel();

      if (!deployedModel) {
        throw new Error('No fine-tuned model deployed. Using base model.');
      }

      const prompt = this.buildOptimizationPrompt(
        modelAnalysis,
        materialProfile,
        printerProfile
      );

      const response = await openai.chat.completions.create({
        model: deployedModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert 3D printing engineer. Analyze and optimize slicing parameters.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content || '';
      return this.parseOptimizationResponse(content);

    } catch (error) {
      console.error('Error using fine-tuned model:', error);
      throw error;
    }
  }

  /**
   * Build optimization prompt
   */
  private buildOptimizationPrompt(
    analysis: any,
    material: any,
    printer: any
  ): string {
    return `Optimize 3D printing slicing settings:

MODEL CHARACTERISTICS:
- Volume: ${analysis.volume?.toFixed(2) || 0} mm³
- Surface Area: ${analysis.surfaceArea?.toFixed(2) || 0} mm²
- Dimensions: ${analysis.boundingBox?.x || 0}×${analysis.boundingBox?.y || 0}×${analysis.boundingBox?.z || 0} mm
- Overhangs: ${analysis.overhangs?.length > 0 ? 'Yes' : 'No'}
- Thin Walls: ${analysis.thinWalls ? 'Yes' : 'No'}
- Bridging: ${analysis.bridging ? 'Yes' : 'No'}

MATERIAL: ${material.name} (${material.type})
PRINTER: ${printer.name}

Provide optimized settings in JSON format.`;
  }

  /**
   * Parse optimization response
   */
  private parseOptimizationResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Error parsing response:', error);
      throw error;
    }
  }

  /**
   * Track model performance
   */
  async trackPerformance(modelId: string, metrics: {
    successful: boolean;
    userRating?: number;
    issues?: string[];
  }): Promise<void> {
    try {
      let performance = await ModelPerformance.findOne({ modelId });

      if (!performance) {
        performance = new ModelPerformance({
          modelId,
          modelVersion: modelId,
          metrics: {
            totalPredictions: 0,
            successfulPrints: 0,
            failedPrints: 0,
            averageUserRating: 0,
            commonIssues: [],
          },
        });
      }

      // Update metrics
      performance.metrics.totalPredictions += 1;

      if (metrics.successful) {
        performance.metrics.successfulPrints += 1;
      } else {
        performance.metrics.failedPrints += 1;
      }

      if (metrics.userRating) {
        const currentAvg = performance.metrics.averageUserRating || 0;
        const total = performance.metrics.totalPredictions;
        performance.metrics.averageUserRating =
          (currentAvg * (total - 1) + metrics.userRating) / total;
      }

      if (metrics.issues) {
        for (const issue of metrics.issues) {
          const existing = performance.metrics.commonIssues.find(
            (i: any) => i.issue === issue
          );
          if (existing) {
            existing.frequency += 1;
          } else {
            performance.metrics.commonIssues.push({ issue, frequency: 1 });
          }
        }
      }

      await performance.save();

    } catch (error) {
      console.error('Error tracking performance:', error);
    }
  }

  /**
   * Get model performance metrics
   */
  async getPerformanceMetrics(modelId?: string): Promise<any> {
    try {
      let query: any = {};
      if (modelId) {
        query.modelId = modelId;
      }

      const performances = await ModelPerformance.find(query)
        .sort({ timestamp: -1 })
        .limit(10);

      return performances;
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Cancel a fine-tuning job
   */
  async cancelJob(jobId: string): Promise<any> {
    try {
      await openai.fineTuning.jobs.cancel(jobId);

      await FineTuningJob.findOneAndUpdate(
        { openAIJobId: jobId },
        { status: 'cancelled' }
      );

      return { success: true, message: 'Job cancelled' };
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw error;
    }
  }
}
