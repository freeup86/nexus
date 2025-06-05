import { Router, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const prisma = new PrismaClient();

// Initialize Anthropic for AI analysis
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

const PROMPT_TYPES = ['daily_reflection', 'habit_success', 'habit_skip', 'weekly_summary', 'custom'];

// ============== JOURNAL ENDPOINTS ==============

// Create journal entry
router.post('/entry',
  [
    body('habitId').optional().isUUID(),
    body('promptType').isIn(PROMPT_TYPES),
    body('promptText').trim().isLength({ min: 1, max: 1000 }),
    body('userResponse').trim().isLength({ min: 1, max: 5000 }),
    body('isVoiceEntry').optional().isBoolean()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // If habitId provided, verify it belongs to user
      if (req.body.habitId) {
        const habit = await prisma.habit.findFirst({
          where: {
            id: req.body.habitId,
            userId
          }
        });

        if (!habit) {
          res.status(404).json({ error: 'Habit not found' });
          return;
        }
      }

      // Create journal entry
      const entry = await prisma.journalEntry.create({
        data: {
          userId,
          habitId: req.body.habitId,
          promptType: req.body.promptType,
          promptText: req.body.promptText,
          userResponse: req.body.userResponse,
          isVoiceEntry: req.body.isVoiceEntry || false
        }
      });

      // Generate AI analysis
      let aiAnalysis = null;
      if (anthropic) {
        try {
          aiAnalysis = await analyzeJournalEntry(entry, req.body.habitId);
          
          // Update entry with AI analysis
          await prisma.journalEntry.update({
            where: { id: entry.id },
            data: { aiAnalysis }
          });
        } catch (error) {
          console.error('AI analysis failed:', error);
        }
      }

      res.status(201).json({ 
        entry: {
          ...entry,
          aiAnalysis
        }
      });
    } catch (error) {
      console.error('Create journal entry error:', error);
      res.status(500).json({ error: 'Failed to create journal entry' });
    }
  }
);

// Get journal entries
router.get('/entries',
  [
    query('habitId').optional().isUUID(),
    query('promptType').optional().isIn(PROMPT_TYPES),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { habitId, promptType, startDate, endDate, limit } = req.query;
      const where: any = { userId };

      if (habitId) where.habitId = habitId as string;
      if (promptType) where.promptType = promptType as string;
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const entries = await prisma.journalEntry.findMany({
        where,
        include: {
          habit: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit ? parseInt(limit as string) : 50
      });

      res.json({ entries });
    } catch (error) {
      console.error('Get journal entries error:', error);
      res.status(500).json({ error: 'Failed to get journal entries' });
    }
  }
);

// Get today's prompts
router.get('/prompts/today',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const prompts = await generateTodayPrompts(userId);
      res.json({ prompts });
    } catch (error) {
      console.error('Get today prompts error:', error);
      res.status(500).json({ error: 'Failed to get today\'s prompts' });
    }
  }
);

// Analyze journal entry with AI
router.post('/analyze',
  [
    body('text').trim().isLength({ min: 10, max: 5000 }),
    body('context').optional().isObject()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!anthropic) {
        res.status(503).json({ error: 'AI analysis not available' });
        return;
      }

      const analysis = await performTextAnalysis(req.body.text, req.body.context);
      res.json({ analysis });
    } catch (error) {
      console.error('Analyze text error:', error);
      res.status(500).json({ error: 'Failed to analyze text' });
    }
  }
);

// Get weekly insights
router.get('/insights/weekly',
  [query('week').optional().isISO8601()],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const weekStart = req.query.week ? new Date(req.query.week as string) : getWeekStart();
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const insights = await generateWeeklyInsights(userId, weekStart, weekEnd);
      res.json({ insights });
    } catch (error) {
      console.error('Get weekly insights error:', error);
      res.status(500).json({ error: 'Failed to get weekly insights' });
    }
  }
);

// ============== HELPER FUNCTIONS ==============

// Generate today's contextual prompts
async function generateTodayPrompts(userId: string): Promise<any[]> {
  const prompts = [];
  
  // Get today's habit logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todayLogs = await prisma.habitLog.findMany({
    where: {
      userId,
      completedAt: {
        gte: today,
        lt: tomorrow
      }
    },
    include: {
      habit: true
    }
  });

  // Generate prompts based on today's activity
  for (const log of todayLogs) {
    if (log.completionStatus === 'completed') {
      prompts.push({
        type: 'habit_success',
        habitId: log.habitId,
        promptText: `Great job completing "${log.habit.name}"! ${log.qualityRating ? `You rated it ${log.qualityRating}/5. ` : ''}What helped you succeed today?`,
        priority: 'high'
      });
    } else if (log.completionStatus === 'skipped') {
      prompts.push({
        type: 'habit_skip',
        habitId: log.habitId,
        promptText: `You skipped "${log.habit.name}" today${log.skipReason ? ` (${log.skipReason})` : ''}. What could help you tackle this tomorrow?`,
        priority: 'medium'
      });
    }
  }

  // Add daily reflection prompt
  prompts.push({
    type: 'daily_reflection',
    promptText: 'How are you feeling about your habits today? What patterns do you notice?',
    priority: 'low'
  });

  // Check if it's end of week for weekly summary
  if (today.getDay() === 0) { // Sunday
    prompts.push({
      type: 'weekly_summary',
      promptText: 'Looking back at your week, what habits served you well? What would you like to adjust for next week?',
      priority: 'high'
    });
  }

  return prompts.sort((a, b) => {
    const priority = { high: 3, medium: 2, low: 1 };
    return priority[b.priority] - priority[a.priority];
  });
}

// Analyze journal entry with AI
async function analyzeJournalEntry(entry: any, habitId?: string): Promise<any> {
  if (!anthropic) return null;

  let context = '';
  if (habitId) {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: {
        logs: {
          orderBy: { completedAt: 'desc' },
          take: 5
        }
      }
    });

    if (habit) {
      const recentCompletionRate = habit.logs.length > 0 ? 
        habit.logs.filter(log => log.completionStatus === 'completed').length / habit.logs.length : 0;
      
      context = `This entry is about the habit "${habit.name}" (${habit.category}). Recent completion rate: ${Math.round(recentCompletionRate * 100)}%.`;
    }
  }

  const prompt = `Analyze this habit tracking journal entry:

Entry: "${entry.userResponse}"
Prompt type: ${entry.promptType}
${context}

Provide analysis in JSON format:
{
  "sentiment": "positive|neutral|negative",
  "key_themes": ["theme1", "theme2", "theme3"],
  "actionable_insights": ["insight1", "insight2"],
  "concerns": ["concern1", "concern2"],
  "motivation_level": "high|medium|low",
  "confidence_score": 0.8
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 400,
      temperature: 0.3,
      system: 'You are a habit and behavioral analysis expert. Provide insights in the exact JSON format requested.',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    return JSON.parse(responseText);
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
}

// Perform general text analysis
async function performTextAnalysis(text: string, context?: any): Promise<any> {
  if (!anthropic) return null;

  const prompt = `Analyze this text for habit-related insights:

Text: "${text}"
${context ? `Context: ${JSON.stringify(context)}` : ''}

Provide analysis in JSON format:
{
  "sentiment": "positive|neutral|negative",
  "key_themes": ["theme1", "theme2"],
  "actionable_insights": ["insight1", "insight2"],
  "suggested_prompts": ["prompt1", "prompt2"]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      temperature: 0.3,
      system: 'You are a text analysis expert focused on personal development and habits.',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Text analysis error:', error);
    return null;
  }
}

// Generate weekly insights
async function generateWeeklyInsights(userId: string, weekStart: Date, weekEnd: Date): Promise<any> {
  // Get week's data
  const [habits, logs, journalEntries] = await Promise.all([
    prisma.habit.findMany({
      where: { userId, isActive: true }
    }),
    prisma.habitLog.findMany({
      where: {
        userId,
        completedAt: {
          gte: weekStart,
          lt: weekEnd
        }
      },
      include: { habit: true }
    }),
    prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: {
          gte: weekStart,
          lt: weekEnd
        }
      }
    })
  ]);

  // Calculate statistics
  const stats = {
    totalHabits: habits.length,
    totalLogs: logs.length,
    completedHabits: logs.filter(log => log.completionStatus === 'completed').length,
    skippedHabits: logs.filter(log => log.completionStatus === 'skipped').length,
    averageQuality: logs.filter(log => log.qualityRating).length > 0 ? 
      logs.filter(log => log.qualityRating).reduce((sum, log) => sum + log.qualityRating!, 0) / 
      logs.filter(log => log.qualityRating).length : 0,
    journalEntries: journalEntries.length
  };

  // Group by habit
  const habitStats = habits.map(habit => {
    const habitLogs = logs.filter(log => log.habitId === habit.id);
    const completed = habitLogs.filter(log => log.completionStatus === 'completed').length;
    const total = habitLogs.length;
    
    return {
      habitId: habit.id,
      habitName: habit.name,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalLogs: total,
      averageQuality: habitLogs.filter(log => log.qualityRating).length > 0 ? 
        habitLogs.filter(log => log.qualityRating).reduce((sum, log) => sum + log.qualityRating!, 0) / 
        habitLogs.filter(log => log.qualityRating).length : 0
    };
  });

  // Generate AI insights if available
  let aiInsights = null;
  if (anthropic && logs.length > 0) {
    try {
      aiInsights = await generateWeeklyAIInsights(stats, habitStats, journalEntries);
    } catch (error) {
      console.error('Weekly AI insights failed:', error);
    }
  }

  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    summary: stats,
    habitBreakdown: habitStats,
    aiInsights,
    recommendations: generateWeeklyRecommendations(stats, habitStats)
  };
}

// Generate AI insights for weekly summary
async function generateWeeklyAIInsights(stats: any, habitStats: any[], journalEntries: any[]): Promise<any> {
  if (!anthropic) return null;

  const prompt = `Analyze this week's habit tracking data:

Overall Stats:
- Total habits: ${stats.totalHabits}
- Completion rate: ${Math.round((stats.completedHabits / stats.totalLogs) * 100)}%
- Average quality: ${stats.averageQuality.toFixed(1)}/5
- Journal entries: ${stats.journalEntries}

Habit Performance:
${habitStats.map(h => `- ${h.habitName}: ${h.completionRate}% completion, ${h.totalLogs} attempts`).join('\n')}

Provide insights in JSON format:
{
  "key_successes": ["success1", "success2"],
  "areas_for_improvement": ["area1", "area2"],
  "patterns_observed": ["pattern1", "pattern2"],
  "recommendations": ["rec1", "rec2"],
  "overall_trend": "improving|stable|declining"
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 400,
      temperature: 0.3,
      system: 'You are a habit coach providing weekly insights.',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Weekly AI insights error:', error);
    return null;
  }
}

// Generate weekly recommendations
function generateWeeklyRecommendations(stats: any, habitStats: any[]): string[] {
  const recommendations = [];
  
  const overallCompletion = stats.totalLogs > 0 ? (stats.completedHabits / stats.totalLogs) * 100 : 0;
  
  if (overallCompletion < 50) {
    recommendations.push('Consider reducing the number of habits or making them smaller to build momentum');
  } else if (overallCompletion > 80) {
    recommendations.push('Great consistency! Consider adding a new challenging habit');
  }

  const strugglingHabits = habitStats.filter(h => h.completionRate < 30);
  if (strugglingHabits.length > 0) {
    recommendations.push(`Focus on improving: ${strugglingHabits.map(h => h.habitName).join(', ')}`);
  }

  if (stats.averageQuality < 3) {
    recommendations.push('Consider adjusting habits to be more enjoyable or meaningful');
  }

  if (stats.journalEntries < 3) {
    recommendations.push('Try journaling more regularly to identify patterns and insights');
  }

  return recommendations;
}

// Get start of current week (Monday)
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default router;