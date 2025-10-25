import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GAPGPT_API_KEY || '',
  baseURL: process.env.GAPGPT_BASE_URL || 'https://api.gapgpt.app/v1',
});

export interface PrintQualityAnalysis {
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number; // 0-100
  detectedIssues: Array<{
    issue: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    possibleCauses: string[];
    suggestedFixes: string[];
  }>;
  aiAnalysis: string;
  recommendations: string[];
}

export class VisionAnalyzer {
  /**
   * Analyze print quality from image using GPT-4 Vision
   */
  async analyzePrintQuality(imageUrl: string, context?: {
    modelInfo?: any;
    settings?: any;
    material?: string;
  }): Promise<PrintQualityAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(context);

      const response = await openai.chat.completions.create({
        model: process.env.GAPGPT_VISION_MODEL || 'deepseek-reasoner', // Note: Vision support depends on GapGPT capabilities
        messages: [
          {
            role: 'system',
            content: `You are an expert 3D printing quality inspector. Analyze print quality from images and identify defects, their causes, and solutions. Provide detailed, actionable feedback.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const analysisText = response.choices[0].message.content || '';
      return this.parseAnalysisResponse(analysisText);

    } catch (error) {
      console.error('Vision analysis error:', error);
      throw new Error('Failed to analyze print quality');
    }
  }

  /**
   * Analyze multiple images for comprehensive quality assessment
   */
  async analyzeMultipleImages(imageUrls: string[], context?: any): Promise<PrintQualityAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(context);

      const content: any[] = [
        {
          type: 'text',
          text: prompt + '\n\nAnalyze all provided images and give a comprehensive assessment.'
        }
      ];

      // Add all images
      for (const imageUrl of imageUrls) {
        content.push({
          type: 'image_url',
          image_url: { url: imageUrl }
        });
      }

      const response = await openai.chat.completions.create({
        model: process.env.GAPGPT_VISION_MODEL || 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: `You are an expert 3D printing quality inspector. Analyze multiple images of the same print from different angles to provide comprehensive quality assessment.`
          },
          {
            role: 'user',
            content
          }
        ],
        max_tokens: 2500,
        temperature: 0.3,
      });

      const analysisText = response.choices[0].message.content || '';
      return this.parseAnalysisResponse(analysisText);

    } catch (error) {
      console.error('Multi-image analysis error:', error);
      throw new Error('Failed to analyze multiple images');
    }
  }

  /**
   * Compare settings with print result to learn what works
   */
  async compareSettingsWithResult(
    imageUrl: string,
    settings: any,
    expectedQuality: string
  ): Promise<{
    settingsEffectiveness: string;
    settingsToAdjust: Array<{
      setting: string;
      currentValue: any;
      suggestedValue: any;
      reason: string;
    }>;
    learningInsights: string[];
  }> {
    try {
      const prompt = `Analyze this 3D print and compare it with the slicing settings used:

SETTINGS USED:
${JSON.stringify(settings, null, 2)}

EXPECTED QUALITY: ${expectedQuality}

Tasks:
1. Assess if the settings were appropriate for this print
2. Identify which settings worked well and which didn't
3. Suggest specific adjustments to improve quality
4. Provide learning insights for future similar prints

Return your analysis in this JSON format:
{
  "settingsEffectiveness": "excellent|good|fair|poor",
  "settingsToAdjust": [
    {
      "setting": "setting name",
      "currentValue": current value,
      "suggestedValue": suggested value,
      "reason": "explanation"
    }
  ],
  "learningInsights": ["insight 1", "insight 2", ...]
}`;

      const response = await openai.chat.completions.create({
        model: process.env.GAPGPT_VISION_MODEL || 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: 'You are an expert 3D printing engineer analyzing print results and settings.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const content = response.choices[0].message.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {
        settingsEffectiveness: 'unknown',
        settingsToAdjust: [],
        learningInsights: []
      };

    } catch (error) {
      console.error('Settings comparison error:', error);
      throw error;
    }
  }

  /**
   * Build analysis prompt with context
   */
  private buildAnalysisPrompt(context?: any): string {
    let prompt = `Analyze the quality of this 3D printed object. Look for common print defects and quality issues:

INSPECT FOR:
- Layer adhesion and layer lines
- Stringing and oozing
- Warping and lifting
- Under/over extrusion
- Support marks and quality
- Surface finish
- Dimensional accuracy
- Bridging quality
- Overhang quality
- First layer adhesion

`;

    if (context?.modelInfo) {
      prompt += `\nMODEL INFO:
- Size: ${context.modelInfo.boundingBox?.x || '?'} x ${context.modelInfo.boundingBox?.y || '?'} x ${context.modelInfo.boundingBox?.z || '?'} mm
- Complexity: ${context.modelInfo.complexity || 'unknown'}
`;
    }

    if (context?.settings) {
      prompt += `\nSETTINGS USED:
- Layer Height: ${context.settings.layerHeight}mm
- Infill: ${context.settings.infillDensity}%
- Print Speed: ${context.settings.printSpeed}mm/s
- Temperature: ${context.settings.printingTemperature}°C
- Material: ${context.settings.material}
`;
    }

    prompt += `\nProvide your analysis in this JSON format:
{
  "overallQuality": "excellent|good|fair|poor",
  "score": 0-100,
  "detectedIssues": [
    {
      "issue": "issue name",
      "severity": "high|medium|low",
      "description": "detailed description",
      "possibleCauses": ["cause 1", "cause 2"],
      "suggestedFixes": ["fix 1", "fix 2"]
    }
  ],
  "aiAnalysis": "comprehensive analysis text",
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    return prompt;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAnalysisResponse(analysisText: string): PrintQualityAnalysis {
    try {
      // Try to extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overallQuality: parsed.overallQuality || 'good',
          score: parsed.score || 75,
          detectedIssues: parsed.detectedIssues || [],
          aiAnalysis: parsed.aiAnalysis || analysisText,
          recommendations: parsed.recommendations || [],
        };
      }

      // Fallback: return text analysis
      return {
        overallQuality: 'good',
        score: 75,
        detectedIssues: [],
        aiAnalysis: analysisText,
        recommendations: [],
      };

    } catch (error) {
      console.error('Failed to parse analysis response:', error);
      return {
        overallQuality: 'good',
        score: 75,
        detectedIssues: [],
        aiAnalysis: analysisText,
        recommendations: [],
      };
    }
  }

  /**
   * Extract learning data from successful prints
   */
  async extractLearningData(
    imageUrl: string,
    settings: any,
    modelInfo: any
  ): Promise<{
    isGoodExample: boolean;
    confidence: number;
    keyFactors: string[];
    recommendAsTrainingData: boolean;
  }> {
    try {
      const prompt = `Analyze this 3D print to determine if it's a good training example:

MODEL: ${JSON.stringify(modelInfo, null, 2)}
SETTINGS: ${JSON.stringify(settings, null, 2)}

Determine:
1. Is this a successful, high-quality print?
2. What were the key factors that made it successful?
3. Should this be used as a training example for the AI?

Return JSON:
{
  "isGoodExample": true/false,
  "confidence": 0-100,
  "keyFactors": ["factor 1", "factor 2"],
  "recommendAsTrainingData": true/false
}`;

      const response = await openai.chat.completions.create({
        model: process.env.GAPGPT_VISION_MODEL || 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: 'You are evaluating 3D prints to build a training dataset for an AI model.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {
        isGoodExample: false,
        confidence: 0,
        keyFactors: [],
        recommendAsTrainingData: false
      };

    } catch (error) {
      console.error('Learning data extraction error:', error);
      throw error;
    }
  }
}
