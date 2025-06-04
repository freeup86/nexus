import { Router, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const prisma = new PrismaClient();

// Initialize Anthropic Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Validation middleware
const validateRequest = (req: AuthRequest, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Create a new decision
router.post('/create',
  [
    body('title').notEmpty().trim().isLength({ max: 255 }),
    body('description').optional().trim()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { title, description } = req.body;

      const decision = await prisma.decision.create({
        data: {
          userId,
          title,
          description,
          options: [],
          criteria: []
        }
      });

      res.status(201).json({ decision });
    } catch (error) {
      console.error('Create decision error:', error);
      res.status(500).json({ error: 'Failed to create decision' });
    }
  }
);

// Get decision by ID
router.get('/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      const decision = await prisma.decision.findFirst({
        where: { id, userId }
      });

      if (!decision) {
        res.status(404).json({ error: 'Decision not found' });
        return;
      }

      res.json({ decision });
    } catch (error) {
      console.error('Get decision error:', error);
      res.status(500).json({ error: 'Failed to get decision' });
    }
  }
);

// Update decision
router.put('/:id',
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ max: 255 }),
    body('description').optional().trim(),
    body('status').optional().isIn(['active', 'completed', 'archived'])
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const updates = req.body;

      const decision = await prisma.decision.updateMany({
        where: { id, userId },
        data: updates
      });

      if (decision.count === 0) {
        res.status(404).json({ error: 'Decision not found' });
        return;
      }

      res.json({ message: 'Decision updated successfully' });
    } catch (error) {
      console.error('Update decision error:', error);
      res.status(500).json({ error: 'Failed to update decision' });
    }
  }
);

// Add criteria to decision
router.post('/:id/criteria',
  [
    param('id').isUUID(),
    body('criteria').isArray(),
    body('criteria.*.name').notEmpty().trim(),
    body('criteria.*.weight').isFloat({ min: 0, max: 1 }),
    body('criteria.*.description').optional().trim()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { criteria } = req.body;

      // Verify decision ownership
      const decision = await prisma.decision.findFirst({
        where: { id, userId }
      });

      if (!decision) {
        res.status(404).json({ error: 'Decision not found' });
        return;
      }

      // Update decision with new criteria
      const currentCriteria = decision.criteria as any[] || [];
      const updatedDecision = await prisma.decision.update({
        where: { id },
        data: {
          criteria: [...currentCriteria, ...criteria]
        }
      });

      res.status(201).json({ 
        message: 'Criteria added successfully',
        count: criteria.length,
        decision: updatedDecision
      });
    } catch (error) {
      console.error('Add criteria error:', error);
      res.status(500).json({ error: 'Failed to add criteria' });
    }
  }
);

// Add options to decision
router.post('/:id/options',
  [
    param('id').isUUID(),
    body('options').isArray(),
    body('options.*.name').notEmpty().trim(),
    body('options.*.description').optional().trim()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { options } = req.body;

      // Verify decision ownership
      const decision = await prisma.decision.findFirst({
        where: { id, userId }
      });

      if (!decision) {
        res.status(404).json({ error: 'Decision not found' });
        return;
      }

      // Update decision with new options
      const currentOptions = decision.options as any[] || [];
      const updatedDecision = await prisma.decision.update({
        where: { id },
        data: {
          options: [...currentOptions, ...options]
        }
      });

      res.status(201).json({ 
        message: 'Options added successfully',
        count: options.length,
        decision: updatedDecision
      });
    } catch (error) {
      console.error('Add options error:', error);
      res.status(500).json({ error: 'Failed to add options' });
    }
  }
);

// Update scores
router.post('/:id/scores',
  [
    param('id').isUUID(),
    body('scores').isArray(),
    body('scores.*.optionId').isUUID(),
    body('scores.*.criteriaId').isUUID(),
    body('scores.*.score').isFloat({ min: 0, max: 10 })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { scores } = req.body;

      // Verify decision ownership
      const decision = await prisma.decision.findFirst({
        where: { id, userId }
      });

      if (!decision) {
        res.status(404).json({ error: 'Decision not found' });
        return;
      }

      // Store scores in the analysis field as part of the decision
      const updatedDecision = await prisma.decision.update({
        where: { id },
        data: {
          analysis: {
            ...(decision.analysis as any || {}),
            scores: scores
          }
        }
      });

      res.json({ 
        message: 'Scores updated successfully',
        decision: updatedDecision
      });
    } catch (error) {
      console.error('Update scores error:', error);
      res.status(500).json({ error: 'Failed to update scores' });
    }
  }
);

// Run MCDA analysis
router.post('/:id/analyze',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      // Get decision with all data
      const decision = await prisma.decision.findFirst({
        where: { id, userId }
      });

      if (!decision) {
        res.status(404).json({ error: 'Decision not found' });
        return;
      }

      // Perform Weighted Sum Model (WSM) calculation
      const results = calculateWSM(decision);

      // Generate AI recommendations
      const aiRecommendation = await generateAIRecommendation(decision, results);

      // Save analysis in the decision
      const updatedDecision = await prisma.decision.update({
        where: { id },
        data: {
          analysis: {
            ...(decision.analysis as any || {}),
            mcdaResults: results,
            aiRecommendation: aiRecommendation.recommendation,
            confidenceScore: aiRecommendation.confidence,
            analyzedAt: new Date()
          },
          recommendation: aiRecommendation.recommendation
        }
      });

      res.json({ 
        analysis: {
          mcdaResults: results,
          aiRecommendation: aiRecommendation,
          decision: updatedDecision
        }
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: 'Failed to run analysis' });
    }
  }
);

// Get user's decisions
router.get('/user/:userId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const requestedUserId = req.params.userId;

      // Users can only view their own decisions
      if (userId !== requestedUserId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const decisions = await prisma.decision.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ decisions });
    } catch (error) {
      console.error('Get user decisions error:', error);
      res.status(500).json({ error: 'Failed to get decisions' });
    }
  }
);

// Helper function: Calculate Weighted Sum Model
function calculateWSM(decision: any) {
  const options = decision.options as any[] || [];
  const criteria = decision.criteria as any[] || [];
  const scores = (decision.analysis as any)?.scores || [];
  
  // Create score matrix
  const scoreMatrix: { [key: string]: { [key: string]: number } } = {};
  scores.forEach((s: any) => {
    const optionKey = s.optionId || s.optionName;
    const criteriaKey = s.criteriaId || s.criteriaName;
    if (!scoreMatrix[optionKey]) scoreMatrix[optionKey] = {};
    scoreMatrix[optionKey][criteriaKey] = s.score;
  });

  // Calculate weighted scores for each option
  const optionScores = options.map((option: any, optionIndex: number) => {
    let totalScore = 0;
    const optionKey = option.id || option.name || `option_${optionIndex}`;
    let weightedScore = 0;

    criteria.forEach((criterion: any, criteriaIndex: number) => {
      const criteriaKey = criterion.id || criterion.name || `criteria_${criteriaIndex}`;
      const score = scoreMatrix[optionKey]?.[criteriaKey] || 0;
      const weight = criterion.weight || 1;
      weightedScore += score * weight;
      totalScore += score;
    });

    return {
      optionId: option.id || optionKey,
      optionName: option.name,
      totalScore,
      weightedScore,
      averageScore: criteria.length > 0 ? totalScore / criteria.length : 0
    };
  });

  // Sort by weighted score
  optionScores.sort((a: any, b: any) => b.weightedScore - a.weightedScore);

  // Calculate sensitivity analysis
  const sensitivity = criteria.map((criterion: any, index: number) => {
    const criterionKey = criterion.id || criterion.name || `criteria_${index}`;
    const impact = calculateCriterionImpact(criterion, criterionKey, options, scoreMatrix);
    return {
      criterionId: criterion.id || criterionKey,
      criterionName: criterion.name,
      weight: criterion.weight || 1,
      impact
    };
  });

  return {
    ranking: optionScores,
    sensitivity,
    timestamp: new Date().toISOString()
  };
}

// Helper function: Calculate criterion impact
function calculateCriterionImpact(criterion: any, criterionKey: string, options: any[], scoreMatrix: any) {
  // Calculate how much each criterion affects the final ranking
  let totalVariance = 0;
  const scores = options.map((o, index) => {
    const optionKey = o.id || o.name || `option_${index}`;
    return scoreMatrix[optionKey]?.[criterionKey] || 0;
  });
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  scores.forEach(score => {
    totalVariance += Math.pow(score - mean, 2);
  });
  
  return Math.sqrt(totalVariance / scores.length) * criterion.weight;
}

// Helper function: Generate AI recommendation
async function generateAIRecommendation(decision: any, results: any) {
  const systemPrompt = `You are a decision analysis expert. Based on the Multi-Criteria Decision Analysis (MCDA) results, provide a clear recommendation and insights.

Analyze the decision results and provide:
1. A clear recommendation of which option to choose
2. Key strengths of the recommended option
3. Potential risks or weaknesses to consider
4. Implementation suggestions
5. A confidence score (0-100) for your recommendation

Format your response as JSON with this structure:
{
  "recommendation": "Clear recommendation text",
  "recommendedOption": "Name of recommended option",
  "strengths": ["strength1", "strength2", ...],
  "risks": ["risk1", "risk2", ...],
  "implementation": ["step1", "step2", ...],
  "confidence": 85
}`;

  try {
    const decisionContext = {
      title: decision.title,
      description: decision.description,
      criteria: decision.criteria.map((c: any) => ({
        name: c.name,
        weight: c.weight,
        description: c.description
      })),
      options: decision.options.map((o: any) => ({
        name: o.name,
        description: o.description
      })),
      results: results
    };

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        { 
          role: 'user', 
          content: `Analyze this decision:\n\n${JSON.stringify(decisionContext, null, 2)}` 
        }
      ]
    });

    const response = message.content[0].type === 'text' ? message.content[0].text : null;
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse response
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanResponse);
    return {
      recommendation: parsed.recommendation || 'Unable to generate recommendation',
      recommendedOption: parsed.recommendedOption,
      strengths: parsed.strengths || [],
      risks: parsed.risks || [],
      implementation: parsed.implementation || [],
      confidence: parsed.confidence || 50
    };
  } catch (error) {
    console.error('AI recommendation error:', error);
    return {
      recommendation: 'Unable to generate AI recommendation at this time.',
      confidence: 0
    };
  }
}

// Delete a decision
router.delete('/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      // Verify decision ownership
      const decision = await prisma.decision.findFirst({
        where: { id, userId }
      });

      if (!decision) {
        res.status(404).json({ error: 'Decision not found' });
        return;
      }

      // Delete the decision (cascading deletes will handle related records)
      await prisma.decision.delete({
        where: { id }
      });

      res.json({ message: 'Decision deleted successfully' });
    } catch (error) {
      console.error('Delete decision error:', error);
      res.status(500).json({ error: 'Failed to delete decision' });
    }
  }
);

export default router;