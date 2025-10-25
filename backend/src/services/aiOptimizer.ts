import OpenAI from 'openai';
import { SlicingSettings, ModelAnalysis, MaterialProfile, PrinterProfile } from '../types/slicing.js';

const openai = new OpenAI({
  apiKey: process.env.GAPGPT_API_KEY || '',
  baseURL: process.env.GAPGPT_BASE_URL || 'https://api.gapgpt.app/v1',
});

export class AIOptimizer {
  /**
   * Optimize slicing settings using AI based on model analysis, material, and printer
   */
  async optimizeSettings(
    modelAnalysis: ModelAnalysis,
    materialProfile: MaterialProfile,
    printerProfile: PrinterProfile,
    userPreferences?: Partial<SlicingSettings>
  ): Promise<SlicingSettings> {
    const prompt = this.buildOptimizationPrompt(
      modelAnalysis,
      materialProfile,
      printerProfile,
      userPreferences
    );

    try {
      const response = await openai.chat.completions.create({
        model: process.env.GAPGPT_MODEL || 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: `You are an expert 3D printing engineer specializing in optimizing slicing parameters.
            Analyze the provided model characteristics, material properties, and printer capabilities to
            recommend optimal slicing settings. Respond ONLY with a valid JSON object containing the settings.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content || '';
      const settings = this.parseAIResponse(content, materialProfile, printerProfile);

      return settings;
    } catch (error) {
      console.error('AI Optimization error:', error);
      // Fallback to rule-based optimization
      return this.ruleBasedOptimization(modelAnalysis, materialProfile, printerProfile);
    }
  }

  private buildOptimizationPrompt(
    analysis: ModelAnalysis,
    material: MaterialProfile,
    printer: PrinterProfile,
    preferences?: Partial<SlicingSettings>
  ): string {
    return `Optimize 3D printing slicing settings for the following:

MODEL ANALYSIS:
- Volume: ${analysis.volume.toFixed(2)} mm³
- Surface Area: ${analysis.surfaceArea.toFixed(2)} mm²
- Bounding Box: ${analysis.boundingBox.x}×${analysis.boundingBox.y}×${analysis.boundingBox.z} mm
- Has Overhangs: ${analysis.overhangs.length > 0 ? 'Yes' : 'No'}
${analysis.overhangs.length > 0 ? `- Maximum Overhang Angle: ${Math.max(...analysis.overhangs.map(o => o.angle))}°` : ''}
- Thin Walls Detected: ${analysis.thinWalls ? 'Yes' : 'No'}
- Bridging Required: ${analysis.bridging ? 'Yes' : 'No'}

MATERIAL: ${material.name} (${material.type})
- Recommended Print Temperature: ${material.printTemperature}°C
- Recommended Bed Temperature: ${material.bedTemperature}°C

PRINTER: ${printer.name}
- Build Volume: ${printer.buildVolumeX}×${printer.buildVolumeY}×${printer.buildVolumeZ} mm
- Nozzle Diameter: ${printer.nozzleDiameter} mm
- Max Print Speed: ${printer.maxPrintSpeed} mm/s

${preferences ? `USER PREFERENCES: ${JSON.stringify(preferences, null, 2)}` : ''}

Provide optimized settings considering:
1. Print quality vs. speed balance
2. Material characteristics
3. Model complexity (overhangs, thin walls, bridging)
4. Support structure requirements
5. Cooling and temperature management

Return ONLY a JSON object with these exact fields:
{
  "layerHeight": number (0.1-0.3),
  "initialLayerHeight": number,
  "lineWidth": number,
  "wallThickness": number,
  "topBottomThickness": number,
  "infillDensity": number (0-100),
  "infillPattern": "grid|lines|triangles|tri-hexagon|cubic|gyroid|honeycomb",
  "infillLineWidth": number,
  "printSpeed": number,
  "infillSpeed": number,
  "wallSpeed": number,
  "topBottomSpeed": number,
  "travelSpeed": number,
  "initialLayerSpeed": number,
  "printingTemperature": number,
  "buildPlateTemperature": number,
  "initialLayerTemperature": number,
  "supportEnabled": boolean,
  "supportDensity": number,
  "supportPattern": "grid|lines|zigzag",
  "supportOverhangAngle": number,
  "fanSpeed": number,
  "initialLayerFanSpeed": number,
  "regularFanSpeedAtHeight": number,
  "retractionEnabled": boolean,
  "retractionDistance": number,
  "retractionSpeed": number,
  "material": "${material.name}",
  "materialDiameter": number,
  "flowRate": number
}`;
  }

  private parseAIResponse(
    content: string,
    material: MaterialProfile,
    printer: PrinterProfile
  ): SlicingSettings {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      const settings = JSON.parse(jsonStr);

      // Validate and apply constraints
      return this.validateSettings(settings, material, printer);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw error;
    }
  }

  private validateSettings(
    settings: any,
    material: MaterialProfile,
    printer: PrinterProfile
  ): SlicingSettings {
    // Apply constraints and validation
    return {
      layerHeight: Math.min(Math.max(settings.layerHeight || 0.2, 0.05), 0.4),
      initialLayerHeight: settings.initialLayerHeight || settings.layerHeight || 0.2,
      lineWidth: settings.lineWidth || printer.nozzleDiameter,
      wallThickness: Math.max(settings.wallThickness || 0.8, printer.nozzleDiameter),
      topBottomThickness: settings.topBottomThickness || 0.8,
      infillDensity: Math.min(Math.max(settings.infillDensity || 20, 0), 100),
      infillPattern: settings.infillPattern || 'grid',
      infillLineWidth: settings.infillLineWidth || printer.nozzleDiameter,
      printSpeed: Math.min(settings.printSpeed || 50, printer.maxPrintSpeed),
      infillSpeed: Math.min(settings.infillSpeed || 60, printer.maxPrintSpeed),
      wallSpeed: Math.min(settings.wallSpeed || 40, printer.maxPrintSpeed),
      topBottomSpeed: Math.min(settings.topBottomSpeed || 30, printer.maxPrintSpeed),
      travelSpeed: Math.min(settings.travelSpeed || 120, printer.maxTravelSpeed),
      initialLayerSpeed: settings.initialLayerSpeed || 20,
      printingTemperature: settings.printingTemperature || material.printTemperature,
      buildPlateTemperature: settings.buildPlateTemperature || material.bedTemperature,
      initialLayerTemperature: settings.initialLayerTemperature || material.printTemperature + 5,
      supportEnabled: settings.supportEnabled !== undefined ? settings.supportEnabled : false,
      supportDensity: Math.min(Math.max(settings.supportDensity || 15, 0), 100),
      supportPattern: settings.supportPattern || 'grid',
      supportOverhangAngle: Math.min(Math.max(settings.supportOverhangAngle || 45, 0), 90),
      fanSpeed: Math.min(Math.max(settings.fanSpeed || material.fanSpeed, 0), 100),
      initialLayerFanSpeed: settings.initialLayerFanSpeed || 0,
      regularFanSpeedAtHeight: settings.regularFanSpeedAtHeight || 0.5,
      retractionEnabled: settings.retractionEnabled !== undefined ? settings.retractionEnabled : true,
      retractionDistance: settings.retractionDistance || material.retraction.distance,
      retractionSpeed: settings.retractionSpeed || material.retraction.speed,
      material: material.name,
      materialDiameter: settings.materialDiameter || 1.75,
      flowRate: Math.min(Math.max(settings.flowRate || 100, 80), 120),
    };
  }

  private ruleBasedOptimization(
    analysis: ModelAnalysis,
    material: MaterialProfile,
    printer: PrinterProfile
  ): SlicingSettings {
    // Fallback rule-based optimization
    const hasOverhangs = analysis.overhangs.length > 0;
    const needsSupport = analysis.overhangs.some(o => o.angle > 45);

    return {
      layerHeight: 0.2,
      initialLayerHeight: 0.2,
      lineWidth: printer.nozzleDiameter,
      wallThickness: printer.nozzleDiameter * 2,
      topBottomThickness: 0.8,
      infillDensity: analysis.thinWalls ? 30 : 20,
      infillPattern: 'grid',
      infillLineWidth: printer.nozzleDiameter,
      printSpeed: 50,
      infillSpeed: 60,
      wallSpeed: 40,
      topBottomSpeed: 30,
      travelSpeed: 120,
      initialLayerSpeed: 20,
      printingTemperature: material.printTemperature,
      buildPlateTemperature: material.bedTemperature,
      initialLayerTemperature: material.printTemperature + 5,
      supportEnabled: needsSupport,
      supportDensity: 15,
      supportPattern: 'grid',
      supportOverhangAngle: 45,
      fanSpeed: material.fanSpeed,
      initialLayerFanSpeed: 0,
      regularFanSpeedAtHeight: 0.5,
      retractionEnabled: true,
      retractionDistance: material.retraction.distance,
      retractionSpeed: material.retraction.speed,
      material: material.name,
      materialDiameter: 1.75,
      flowRate: 100,
    };
  }
}
