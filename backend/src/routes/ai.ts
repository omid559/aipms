import { Router } from 'express';
import { AIOptimizer } from '../services/aiOptimizer.js';
import { ModelAnalysis, MaterialProfile, PrinterProfile, SlicingSettings } from '../types/slicing.js';
import { optionalAuth, checkQuota } from '../middleware/auth.js';

const router = Router();
const aiOptimizer = new AIOptimizer();

// Optimize slicing settings using AI
router.post('/optimize', optionalAuth, checkQuota('ai'), async (req, res) => {
  try {
    const { modelAnalysis, materialProfile, printerProfile, userPreferences } = req.body;

    if (!modelAnalysis || !materialProfile || !printerProfile) {
      return res.status(400).json({
        error: 'Missing required parameters: modelAnalysis, materialProfile, printerProfile'
      });
    }

    const optimizedSettings = await aiOptimizer.optimizeSettings(
      modelAnalysis as ModelAnalysis,
      materialProfile as MaterialProfile,
      printerProfile as PrinterProfile,
      userPreferences as Partial<SlicingSettings>
    );

    // Update AI quota for authenticated users
    if (req.user) {
      req.user.quota.usedAICalls += 1;
      await req.user.save();
    }

    res.json({
      success: true,
      settings: optimizedSettings,
      message: 'Settings optimized successfully using AI'
    });
  } catch (error) {
    console.error('AI Optimization error:', error);
    res.status(500).json({
      error: 'Failed to optimize settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get AI recommendations for specific aspects
router.post('/recommend', async (req, res) => {
  try {
    const { aspect, context } = req.body;

    // This can be extended for specific recommendations
    // like "best infill pattern for this model" or "optimal layer height"

    res.json({
      success: true,
      recommendations: {
        aspect,
        suggestions: []
      }
    });
  } catch (error) {
    console.error('AI Recommendation error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

export default router;
