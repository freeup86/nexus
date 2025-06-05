import { Router, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';
import { param, query, validationResult } from 'express-validator';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const prisma = new PrismaClient();

// Initialize Anthropic for AI predictions
const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Validation middleware
const validateRequest = (req: AuthRequest, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// ============== PREDICTION ENDPOINTS ==============

// Generate today's predictions for all habits
router.get('/today',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get user's active habits
      const habits = await prisma.habit.findMany({
        where: {
          userId,
          isActive: true
        },
        include: {
          logs: {
            orderBy: { completedAt: 'desc' },
            take: 30 // Last 30 logs for pattern analysis
          }
        }
      });

      const predictions = await Promise.all(
        habits.map(async (habit) => {
          try {
            const prediction = await generateHabitPrediction(habit, today);
            return prediction;
          } catch (error) {
            console.error(`Error generating prediction for habit ${habit.id}:`, error);
            return {
              habitId: habit.id,
              habitName: habit.name,
              skipRiskScore: 0.5,
              recommendedTimes: [habit.targetTime || '09:00'],
              riskFactors: {},
              confidence: 0.3
            };
          }
        })
      );

      res.json({ predictions });
    } catch (error) {
      console.error('Get today predictions error:', error);
      res.status(500).json({ error: 'Failed to get predictions' });
    }
  }
);

// Get optimal times for specific habit
router.get('/:habitId/optimal-times',
  [param('habitId').isUUID()],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const habit = await prisma.habit.findFirst({
        where: {
          id: req.params.habitId,
          userId
        },
        include: {
          logs: {
            where: { completionStatus: 'completed' },
            orderBy: { completedAt: 'desc' },
            take: 100
          }
        }
      });

      if (!habit) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }

      const optimalTimes = calculateOptimalTimes(habit.logs);

      res.json({ 
        habitId: habit.id,
        optimalTimes,
        recommendation: {
          primaryTime: optimalTimes[0] || habit.targetTime || '09:00',
          alternativeTimes: optimalTimes.slice(1, 3),
          reasoning: `Based on ${habit.logs.length} successful completions`
        }
      });
    } catch (error) {
      console.error('Get optimal times error:', error);
      res.status(500).json({ error: 'Failed to get optimal times' });
    }
  }
);

// Get prediction history for habit
router.get('/:habitId/history',
  [
    param('habitId').isUUID(),
    query('days').optional().isInt({ min: 1, max: 90 })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const habit = await prisma.habit.findFirst({
        where: {
          id: req.params.habitId,
          userId
        }
      });

      if (!habit) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }

      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const predictions = await prisma.habitPrediction.findMany({
        where: {
          habitId: req.params.habitId,
          predictionDate: {
            gte: startDate
          }
        },
        orderBy: { predictionDate: 'desc' }
      });

      // Calculate prediction accuracy
      const accurateCount = predictions.filter(p => {
        if (!p.actualOutcome) return false;
        const wasSkipped = p.actualOutcome === 'skipped';
        const predictedSkip = p.skipRiskScore > 0.5;
        return wasSkipped === predictedSkip;
      }).length;

      const totalWithOutcome = predictions.filter(p => p.actualOutcome).length;
      const accuracy = totalWithOutcome > 0 ? (accurateCount / totalWithOutcome) * 100 : 0;

      res.json({ 
        predictions,
        accuracy: Math.round(accuracy),
        totalPredictions: predictions.length,
        evaluatedPredictions: totalWithOutcome
      });
    } catch (error) {
      console.error('Get prediction history error:', error);
      res.status(500).json({ error: 'Failed to get prediction history' });
    }
  }
);

// ============== HELPER FUNCTIONS ==============

// Calculate optimal times based on successful completions
function calculateOptimalTimes(logs: any[]): string[] {
  const timeFrequency: { [key: string]: number } = {};

  logs.forEach(log => {
    const time = new Date(log.completedAt);
    const hourMinute = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    timeFrequency[hourMinute] = (timeFrequency[hourMinute] || 0) + 1;
  });

  // Sort by frequency and return top times
  return Object.entries(timeFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([time]) => time);
}

// Generate habit prediction using AI and pattern analysis
async function generateHabitPrediction(habit: any, targetDate: Date): Promise<any> {
  const logs = habit.logs;
  const recentLogs = logs.slice(0, 7); // Last 7 days
  
  // Calculate basic statistics
  const completionRate = logs.length > 0 ? 
    logs.filter(log => log.completionStatus === 'completed').length / logs.length : 0;
  
  const recentCompletionRate = recentLogs.length > 0 ? 
    recentLogs.filter(log => log.completionStatus === 'completed').length / recentLogs.length : 0;

  // Day of week pattern
  const dayOfWeek = targetDate.getDay();
  const dayLogs = logs.filter(log => new Date(log.completedAt).getDay() === dayOfWeek);
  const dayCompletionRate = dayLogs.length > 0 ? 
    dayLogs.filter(log => log.completionStatus === 'completed').length / dayLogs.length : completionRate;

  // Calculate base skip risk
  let skipRiskScore = 1 - (completionRate * 0.4 + recentCompletionRate * 0.4 + dayCompletionRate * 0.2);
  
  // Risk factors
  const riskFactors: any = {};
  
  // Recent trend
  if (recentCompletionRate < completionRate - 0.2) {
    skipRiskScore += 0.2;
    riskFactors.declining_trend = 0.2;
  }
  
  // Day of week effect
  if (dayCompletionRate < completionRate - 0.1) {
    skipRiskScore += 0.1;
    riskFactors.day_of_week = 0.1;
  }

  // Frequency type considerations
  if (habit.frequencyType === 'weekly' && dayOfWeek === 0) { // Sunday
    skipRiskScore += 0.1;
    riskFactors.weekend_effect = 0.1;
  }

  // Clamp between 0 and 1
  skipRiskScore = Math.max(0, Math.min(1, skipRiskScore));

  // Generate recommended times
  const optimalTimes = calculateOptimalTimes(logs.filter(log => log.completionStatus === 'completed'));
  const recommendedTimes = optimalTimes.length > 0 ? optimalTimes.slice(0, 3) : [habit.targetTime || '09:00'];

  // Use AI for more sophisticated analysis if available
  let aiInsights = null;
  if (anthropic && logs.length >= 5) {
    try {
      aiInsights = await generateAIInsights(habit, logs, targetDate);
    } catch (error) {
      console.error('AI insights generation failed:', error);
    }
  }

  // Store prediction in database
  const prediction = await prisma.habitPrediction.create({
    data: {
      habitId: habit.id,
      predictionDate: targetDate,
      skipRiskScore,
      recommendedTimes,
      riskFactors,
      confidence: logs.length >= 10 ? 0.8 : Math.min(0.7, logs.length * 0.1)
    }
  });

  return {
    habitId: habit.id,
    habitName: habit.name,
    skipRiskScore,
    recommendedTimes,
    riskFactors,
    confidence: prediction.confidence,
    aiInsights,
    suggestion: generateSuggestion(skipRiskScore, habit, riskFactors)
  };
}

// Generate AI insights using Anthropic
async function generateAIInsights(habit: any, logs: any[], targetDate: Date): Promise<any> {
  if (!anthropic) return null;

  const recentLogs = logs.slice(0, 14).map(log => ({
    date: new Date(log.completedAt).toISOString().split('T')[0],
    status: log.completionStatus,
    quality: log.qualityRating,
    mood: log.mood,
    energy: log.energyLevel,
    skipReason: log.skipReason
  }));

  const prompt = `Analyze this habit tracking data and provide insights:

Habit: ${habit.name}
Category: ${habit.category}
Target time: ${habit.targetTime || 'Not set'}

Recent 14 days data:
${JSON.stringify(recentLogs, null, 2)}

Provide insights in JSON format:
{
  "pattern_analysis": "Key patterns observed",
  "risk_factors": ["factor1", "factor2"],
  "success_factors": ["factor1", "factor2"],
  "recommendations": ["rec1", "rec2"],
  "confidence": 0.8
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      temperature: 0.3,
      system: 'You are a habit analysis expert. Provide insights in the exact JSON format requested.',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    return JSON.parse(responseText);
  } catch (error) {
    console.error('AI insights error:', error);
    return null;
  }
}

// Generate human-readable suggestion
function generateSuggestion(skipRiskScore: number, habit: any, riskFactors: any): string {
  if (skipRiskScore < 0.3) {
    return `You're on track with ${habit.name}! Keep up the momentum.`;
  } else if (skipRiskScore < 0.6) {
    const factors = Object.keys(riskFactors);
    if (factors.includes('declining_trend')) {
      return `${habit.name} completion has been declining lately. Consider setting a reminder or finding an accountability partner.`;
    }
    return `Moderate skip risk for ${habit.name}. Consider doing it earlier in the day when energy is higher.`;
  } else {
    return `High skip risk for ${habit.name}. Try a smaller version today - even 5 minutes counts!`;
  }
}

export default router;