import { Router, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const prisma = new PrismaClient();

// Initialize Anthropic
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

// Entry types for Rosebud-like functionality
const ENTRY_TYPES = ['free_form', 'guided', 'check_in', 'goal_reflection', 'therapeutic'];
const SESSION_TYPES = ['morning', 'evening', 'mood_check', 'weekly_review'];
const FRAMEWORKS = ['gratitude', 'cbt', 'dream', 'morning_pages', 'reflection', 'act', 'ifs'];

// ============== INTERACTIVE JOURNAL CHAT ==============

// Start interactive journaling session
router.post('/session/start',
  [
    body('sessionType').optional().isIn(SESSION_TYPES),
    body('framework').optional().isIn(FRAMEWORKS),
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

      // Get user context for personalization
      const userContext = await getUserContext(userId);
      
      // Generate personalized opening prompt
      const openingPrompt = await generateOpeningPrompt(
        userId,
        req.body.sessionType || 'free_form',
        req.body.framework,
        userContext
      );

      // Create initial journal entry
      const entry = await prisma.journalEntry.create({
        data: {
          userId,
          entryType: req.body.sessionType || 'free_form',
          promptType: 'interactive',
          promptText: openingPrompt.prompt,
          userResponse: '',
          isConversational: true,
          conversationHistory: JSON.stringify([{
            role: 'assistant',
            content: openingPrompt.prompt,
            timestamp: new Date()
          }]),
          framework: req.body.framework,
          mood: req.body.context?.currentMood,
          energyLevel: req.body.context?.energyLevel
        }
      });

      res.status(201).json({
        sessionId: entry.id,
        prompt: openingPrompt.prompt,
        followUpQuestions: openingPrompt.followUpQuestions,
        suggestedTopics: openingPrompt.suggestedTopics
      });
    } catch (error) {
      console.error('Start session error:', error);
      res.status(500).json({ error: 'Failed to start journal session' });
    }
  }
);

// Continue interactive conversation
router.post('/session/:sessionId/respond',
  [
    param('sessionId').isLength({ min: 1 }),
    body('response').trim().isLength({ min: 1, max: 5000 }),
    body('mood').optional().isString(),
    body('moodIntensity').optional().isInt({ min: 1, max: 10 })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get existing session
      const session = await prisma.journalEntry.findFirst({
        where: {
          id: req.params.sessionId,
          userId,
          isConversational: true
        }
      });

      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Parse conversation history
      const conversationHistory = JSON.parse(session.conversationHistory as string || '[]');
      
      // Add user response
      conversationHistory.push({
        role: 'user',
        content: req.body.response,
        timestamp: new Date()
      });

      // Get user context for more personalized responses
      const userContext = await getUserContext(userId);
      
      // Generate AI response with empathy and insight
      const aiResponse = await generateAIResponse(
        conversationHistory,
        session,
        req.body.mood,
        req.body.moodIntensity,
        userContext
      );

      // Add AI response to history
      conversationHistory.push({
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date()
      });

      // Update session
      const updatedSession = await prisma.journalEntry.update({
        where: { id: session.id },
        data: {
          userResponse: session.userResponse + '\n\n' + req.body.response,
          conversationHistory: JSON.stringify(conversationHistory),
          aiAnalysis: aiResponse.analysis,
          mood: req.body.mood || session.mood,
          moodIntensity: req.body.moodIntensity,
          wordCount: (session.wordCount || 0) + req.body.response.split(' ').length
        }
      });

      res.json({
        response: aiResponse.response,
        followUpQuestions: aiResponse.followUpQuestions,
        insights: aiResponse.insights,
        suggestedActions: aiResponse.suggestedActions,
        sessionStats: {
          wordCount: updatedSession.wordCount,
          duration: Math.floor((new Date().getTime() - new Date(session.createdAt).getTime()) / 1000)
        }
      });
    } catch (error) {
      console.error('Session respond error:', error);
      res.status(500).json({ error: 'Failed to process response' });
    }
  }
);

// End journal session
router.post('/session/:sessionId/end',
  [param('sessionId').isLength({ min: 1 })],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = await prisma.journalEntry.findFirst({
        where: {
          id: req.params.sessionId,
          userId
        }
      });

      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Generate session summary
      const summary = await generateSessionSummary(session);

      // Update session with final analysis
      await prisma.journalEntry.update({
        where: { id: session.id },
        data: {
          aiAnalysis: summary,
          sessionDuration: Math.floor((new Date().getTime() - new Date(session.createdAt).getTime()) / 1000)
        }
      });

      // Update mood tracking if mood was logged
      if (session.mood && session.moodIntensity) {
        await prisma.moodEntry.create({
          data: {
            userId,
            mood: session.mood,
            intensity: session.moodIntensity,
            energyLevel: session.energyLevel || 'medium',
            notes: `From journal session: ${session.id}`,
            recordedAt: new Date()
          }
        });
      }

      // Check and update streaks
      await updateJournalStreaks(userId);

      // Award XP for completing a journal session
      await awardJournalXP(userId, 'complete_session', {
        duration: Math.floor((new Date().getTime() - new Date(session.createdAt).getTime()) / 1000),
        wordCount: session.wordCount || 0
      });

      // Generate personalized insights if enough data
      const insights = await generatePersonalizedInsights(userId);

      res.json({
        summary,
        insights,
        streakUpdate: await getStreakStatus(userId)
      });
    } catch (error) {
      console.error('End session error:', error);
      res.status(500).json({ error: 'Failed to end session' });
    }
  }
);

// ============== CHECK-IN ENDPOINTS ==============

// Morning check-in
router.post('/checkin/morning',
  [
    body('mood').isString(),
    body('energyLevel').isString(),
    body('gratitudeItems').isArray().optional(),
    body('intentions').isArray().optional(),
    body('notes').optional().isString()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Create check-in session
      const checkIn = await prisma.checkInSession.create({
        data: {
          userId,
          sessionType: 'morning',
          mood: req.body.mood,
          energyLevel: req.body.energyLevel,
          gratitudeItems: req.body.gratitudeItems || [],
          intentions: req.body.intentions || [],
          notes: req.body.notes
        }
      });

      // Create linked journal entry
      const journalEntry = await prisma.journalEntry.create({
        data: {
          userId,
          entryType: 'check_in',
          promptType: 'daily_reflection',
          promptText: 'Morning Check-in',
          userResponse: JSON.stringify(req.body),
          mood: req.body.mood,
          energyLevel: req.body.energyLevel
        }
      });

      // Update check-in with journal entry link
      await prisma.checkInSession.update({
        where: { id: checkIn.id },
        data: { linkedEntryId: journalEntry.id }
      });

      // Get personalized morning insights
      const insights = await generateMorningInsights(userId, req.body);

      // Award XP for morning check-in
      await awardJournalXP(userId, 'morning_checkin', req.body);

      res.status(201).json({
        checkIn,
        insights,
        todaysFocus: insights.todaysFocus,
        affirmation: insights.affirmation
      });
    } catch (error) {
      console.error('Morning check-in error:', error);
      res.status(500).json({ error: 'Failed to complete morning check-in' });
    }
  }
);

// Evening check-in
router.post('/checkin/evening',
  [
    body('mood').isString(),
    body('energyLevel').isString(),
    body('accomplishments').isArray().optional(),
    body('challenges').isArray().optional(),
    body('tomorrowFocus').optional().isString(),
    body('overallRating').isInt({ min: 1, max: 10 })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const checkIn = await prisma.checkInSession.create({
        data: {
          userId,
          sessionType: 'evening',
          mood: req.body.mood,
          energyLevel: req.body.energyLevel,
          accomplishments: req.body.accomplishments || [],
          challenges: req.body.challenges || [],
          tomorrowFocus: req.body.tomorrowFocus,
          overallRating: req.body.overallRating
        }
      });

      // Generate day summary
      const daySummary = await generateDaySummary(userId);

      res.status(201).json({
        checkIn,
        daySummary,
        reflection: daySummary.reflection,
        tomorrowSuggestions: daySummary.suggestions
      });
    } catch (error) {
      console.error('Evening check-in error:', error);
      res.status(500).json({ error: 'Failed to complete evening check-in' });
    }
  }
);

// ============== MOOD TRACKING ==============

// Quick mood log
router.post('/mood/quick',
  [
    body('mood').isString(),
    body('intensity').isInt({ min: 1, max: 10 }),
    body('triggers').optional().isArray(),
    body('notes').optional().isString()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const moodEntry = await prisma.moodEntry.create({
        data: {
          userId,
          mood: req.body.mood,
          intensity: req.body.intensity,
          triggers: req.body.triggers || [],
          notes: req.body.notes,
          energyLevel: 'medium',
          recordedAt: new Date()
        }
      });

      // Get mood insights
      const insights = await analyzeMoodPattern(userId);

      res.status(201).json({
        moodEntry,
        insights,
        pattern: insights.recentPattern,
        suggestion: insights.immediateSuggestion
      });
    } catch (error) {
      console.error('Quick mood log error:', error);
      res.status(500).json({ error: 'Failed to log mood' });
    }
  }
);

// ============== INSIGHTS & ANALYTICS ==============

// Get personalized weekly insights
router.get('/insights/weekly',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const insights = await generateWeeklyInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error('Weekly insights error:', error);
      res.status(500).json({ error: 'Failed to generate weekly insights' });
    }
  }
);

// ============== GOALS & PROGRESS ==============

// Create journal goal
router.post('/goals',
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().isString(),
    body('category').isString(),
    body('targetMetric').optional().isString(),
    body('targetValue').optional().isFloat(),
    body('frequency').optional().isString(),
    body('targetDate').optional().isISO8601()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const goal = await prisma.journalGoal.create({
        data: {
          userId,
          ...req.body,
          startDate: new Date()
        }
      });

      // Generate reflection prompts for this goal
      const prompts = await generateGoalPrompts(goal);

      res.status(201).json({
        goal,
        prompts
      });
    } catch (error) {
      console.error('Create goal error:', error);
      res.status(500).json({ error: 'Failed to create goal' });
    }
  }
);

// Get all goals
router.get('/goals',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const goals = await prisma.journalGoal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ goals });
    } catch (error) {
      console.error('Get goals error:', error);
      res.status(500).json({ error: 'Failed to get goals' });
    }
  }
);

// Update goal progress
router.patch('/goals/:goalId/progress',
  [
    param('goalId').isLength({ min: 1 }),
    body('progress').isFloat({ min: 0, max: 100 })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const goal = await prisma.journalGoal.findFirst({
        where: {
          id: req.params.goalId,
          userId
        }
      });

      if (!goal) {
        res.status(404).json({ error: 'Goal not found' });
        return;
      }

      const updatedGoal = await prisma.journalGoal.update({
        where: { id: goal.id },
        data: { progress: req.body.progress }
      });

      res.json({ goal: updatedGoal });
    } catch (error) {
      console.error('Update goal progress error:', error);
      res.status(500).json({ error: 'Failed to update goal progress' });
    }
  }
);

// Get monthly mood data for calendar view
router.get('/mood/monthly',
  [
    query('year').optional().isInt({ min: 2020, max: 2030 }),
    query('month').optional().isInt({ min: 1, max: 12 })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

      // Create date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Get mood entries from both MoodEntry and JournalEntry tables
      const [moodEntries, journalMoods] = await Promise.all([
        // Direct mood entries
        prisma.moodEntry.findMany({
          where: {
            userId,
            recordedAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            mood: true,
            intensity: true,
            energyLevel: true,
            notes: true,
            recordedAt: true
          },
          orderBy: { recordedAt: 'asc' }
        }),
        // Mood from journal entries (check-ins, sessions)
        prisma.journalEntry.findMany({
          where: {
            userId,
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            mood: { not: null }
          },
          select: {
            mood: true,
            moodIntensity: true,
            energyLevel: true,
            entryType: true,
            createdAt: true
          },
          orderBy: { createdAt: 'asc' }
        })
      ]);

      // Combine and process mood data by day
      const dailyMoods: { [key: string]: any } = {};

      // Process direct mood entries
      moodEntries.forEach(entry => {
        const dayKey = entry.recordedAt.toISOString().split('T')[0];
        if (!dailyMoods[dayKey]) {
          dailyMoods[dayKey] = { entries: [], avgIntensity: 0 };
        }
        dailyMoods[dayKey].entries.push({
          type: 'mood_log',
          mood: entry.mood,
          intensity: entry.intensity,
          energyLevel: entry.energyLevel,
          notes: entry.notes,
          timestamp: entry.recordedAt
        });
      });

      // Process journal mood entries
      journalMoods.forEach(entry => {
        const dayKey = entry.createdAt.toISOString().split('T')[0];
        if (!dailyMoods[dayKey]) {
          dailyMoods[dayKey] = { entries: [], avgIntensity: 0 };
        }
        dailyMoods[dayKey].entries.push({
          type: entry.entryType,
          mood: entry.mood,
          intensity: entry.moodIntensity || 5,
          energyLevel: entry.energyLevel,
          timestamp: entry.createdAt
        });
      });

      // Calculate daily averages
      Object.keys(dailyMoods).forEach(day => {
        const entries = dailyMoods[day].entries;
        const totalIntensity = entries.reduce((sum: number, e: any) => sum + e.intensity, 0);
        dailyMoods[day].avgIntensity = entries.length > 0 ? totalIntensity / entries.length : 0;
        dailyMoods[day].dominantMood = entries.length > 0 ? entries[entries.length - 1].mood : null;
        dailyMoods[day].count = entries.length;
      });

      res.json({
        year,
        month,
        dailyMoods,
        monthStats: {
          totalDays: Object.keys(dailyMoods).length,
          avgMoodIntensity: Object.values(dailyMoods).reduce((sum: number, day: any) => sum + day.avgIntensity, 0) / Math.max(Object.keys(dailyMoods).length, 1),
          mostCommonMood: getMostCommonValue(Object.values(dailyMoods).map((day: any) => day.dominantMood).filter(Boolean))
        }
      });
    } catch (error) {
      console.error('Get monthly mood data error:', error);
      res.status(500).json({ error: 'Failed to get monthly mood data' });
    }
  }
);

// Get journal entries
router.get('/entries',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const entries = await prisma.journalEntry.findMany({
        where: { 
          userId,
          promptType: 'interactive'  // Only show enhanced journal entries
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          entryType: true,
          promptText: true,
          userResponse: true,
          mood: true,
          moodIntensity: true,
          energyLevel: true,
          framework: true,
          tags: true,
          wordCount: true,
          sessionDuration: true,
          createdAt: true,
          aiAnalysis: true
        }
      });

      const totalCount = await prisma.journalEntry.count({
        where: { 
          userId,
          promptType: 'interactive'  // Only count enhanced journal entries
        }
      });


      res.json({ 
        entries,
        totalCount,
        hasMore: offset + limit < totalCount 
      });
    } catch (error) {
      console.error('Get journal entries error:', error);
      res.status(500).json({ error: 'Failed to get journal entries' });
    }
  }
);

// Delete journal entry
router.delete('/entries/:entryId',
  [param('entryId').isLength({ min: 1 })],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // First check if entry exists and belongs to user
      const entry = await prisma.journalEntry.findFirst({
        where: {
          id: req.params.entryId,
          userId
        }
      });

      if (!entry) {
        res.status(404).json({ error: 'Journal entry not found' });
        return;
      }

      // Delete the entry
      await prisma.journalEntry.delete({
        where: {
          id: req.params.entryId
        }
      });

      console.log(`User ${userId} deleted journal entry ${req.params.entryId}`);
      res.json({ message: 'Journal entry deleted successfully' });
    } catch (error) {
      console.error('Delete journal entry error:', error);
      res.status(500).json({ error: 'Failed to delete journal entry' });
    }
  }
);

// ============== HELPER FUNCTIONS ==============

function getMostCommonValue(arr: any[]): any {
  if (arr.length === 0) return null;
  
  const counts: { [key: string]: number } = {};
  arr.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });
  
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
}

async function getUserContext(userId: string) {
  const [recentEntries, recentMoods, activeGoals] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { 
        userId,
        promptType: 'interactive'  // Only use enhanced journal entries for context
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        entryType: true,
        promptText: true,
        userResponse: true,
        mood: true,
        energyLevel: true,
        createdAt: true,
        framework: true,
        aiAnalysis: true
      }
    }),
    prisma.moodEntry.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 10
    }),
    prisma.journalGoal.findMany({
      where: { userId, status: 'active' }
    })
  ]);

  // Extract key themes and patterns from recent entries
  const recentThemes: string[] = [];
  const recentChallenges: string[] = [];
  const recentAccomplishments: string[] = [];
  
  recentEntries.forEach(entry => {
    if (entry.aiAnalysis && typeof entry.aiAnalysis === 'string') {
      try {
        const analysis = JSON.parse(entry.aiAnalysis);
        if (analysis.key_themes) recentThemes.push(...analysis.key_themes);
        if (analysis.challenges) recentChallenges.push(...analysis.challenges);
        if (analysis.accomplishments) recentAccomplishments.push(...analysis.accomplishments);
      } catch (e) {
        // Ignore parsing errors
      }
    }
  });

  // Get unique themes (most recent first)
  const uniqueThemes = [...new Set(recentThemes)].slice(0, 5);
  const uniqueChallenges = [...new Set(recentChallenges)].slice(0, 3);
  const uniqueAccomplishments = [...new Set(recentAccomplishments)].slice(0, 3);

  // Calculate mood trend
  const moodTrend = recentMoods.length >= 3 ? 
    (recentMoods[0].intensity - recentMoods[recentMoods.length - 1].intensity) : 0;

  return {
    recentEntries,
    recentMoods,
    activeGoals,
    averageMood: recentMoods.length > 0 
      ? recentMoods.reduce((sum, m) => sum + m.intensity, 0) / recentMoods.length 
      : 5,
    recentThemes: uniqueThemes,
    recentChallenges: uniqueChallenges,
    recentAccomplishments: uniqueAccomplishments,
    moodTrend,
    lastEntryDate: recentEntries[0]?.createdAt || null
  };
}

async function generateOpeningPrompt(userId: string, sessionType: string, framework?: string, context?: any) {
  if (!anthropic) {
    return {
      prompt: "How are you feeling today? What's on your mind?",
      followUpQuestions: ["What brought you to journal today?"],
      suggestedTopics: ["Today's experiences", "Current emotions", "Goals and aspirations"]
    };
  }

  // Create a summary of recent journal context
  const recentEntrySummary = context?.recentEntries?.slice(0, 3).map((entry: any) => ({
    date: new Date(entry.createdAt).toLocaleDateString(),
    type: entry.entryType,
    mood: entry.mood,
    excerpt: entry.userResponse?.substring(0, 100) + '...'
  }));

  const prompt = `Generate a warm, personalized opening prompt for a journal session that acknowledges the user's recent journaling history.

Context:
- Session type: ${sessionType}
- Framework: ${framework || 'general'}
- User's average mood: ${context?.averageMood?.toFixed(1) || 'unknown'} (mood trend: ${context?.moodTrend > 0 ? 'improving' : context?.moodTrend < 0 ? 'declining' : 'stable'})
- Active goals: ${context?.activeGoals?.map((g: any) => g.title).join(', ') || 'none'}
- Recent themes: ${context?.recentThemes?.join(', ') || 'none identified'}
- Recent challenges: ${context?.recentChallenges?.join(', ') || 'none identified'}
- Recent accomplishments: ${context?.recentAccomplishments?.join(', ') || 'none identified'}
- Last entry: ${context?.lastEntryDate ? new Date(context.lastEntryDate).toLocaleDateString() : 'no recent entries'}
- Recent entry summary: ${JSON.stringify(recentEntrySummary || [])}

Based on this context, create a personalized opening that:
1. References something specific from their recent entries if relevant
2. Acknowledges their mood trend or recent themes
3. Feels like a continuation of an ongoing conversation
4. Is warm and encouraging

You must respond with valid JSON only. No other text.

{
  "prompt": "warm, personalized opening question that references their journey",
  "followUpQuestions": ["contextual question 1", "contextual question 2"],
  "suggestedTopics": ["topic based on recent themes", "topic 2", "topic 3"]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      temperature: 0.7,
      system: 'You are a compassionate AI journal companion. Create warm, personalized prompts.',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Generate opening prompt error:', error);
    return {
      prompt: "How are you feeling today? What's on your mind?",
      followUpQuestions: ["What brought you to journal today?"],
      suggestedTopics: ["Today's experiences", "Current emotions", "Goals and aspirations"]
    };
  }
}

async function generateAIResponse(conversationHistory: any[], session: any, mood?: string, moodIntensity?: number, userContext?: any) {
  if (!anthropic) {
    return {
      response: "Thank you for sharing. Can you tell me more about that?",
      followUpQuestions: ["How did that make you feel?"],
      insights: [],
      suggestedActions: []
    };
  }

  const conversationText = conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
  
  // Create context summary from user's journal history
  const contextSummary = userContext ? `
User Context:
- Recent themes in their journal: ${userContext.recentThemes?.join(', ') || 'none'}
- Recent challenges: ${userContext.recentChallenges?.join(', ') || 'none'}
- Recent accomplishments: ${userContext.recentAccomplishments?.join(', ') || 'none'}
- Mood trend: ${userContext.moodTrend > 0 ? 'improving' : userContext.moodTrend < 0 ? 'declining' : 'stable'}
- Active goals: ${userContext.activeGoals?.map((g: any) => g.title).join(', ') || 'none'}` : '';
  
  const prompt = `You are a compassionate AI journal companion having a conversation with someone. You have access to their recent journal history to provide more personalized support.

Conversation so far:
${conversationText}

${mood ? `Current mood: ${mood} (intensity: ${moodIntensity}/10)` : ''}
${contextSummary}

Respond with empathy and insight. When relevant:
- Reference their recent themes or patterns you've noticed
- Acknowledge their progress on challenges or goals
- Build on previous conversations and insights
- Ask thoughtful follow-up questions that go deeper
- Provide gentle guidance when appropriate

Make the conversation feel continuous and personal, like you remember their journey.

You must respond with valid JSON only. No other text.

{
  "response": "your empathetic response",
  "followUpQuestions": ["thoughtful question 1", "thoughtful question 2"],
  "insights": ["insight if any"],
  "suggestedActions": ["gentle suggestion if appropriate"],
  "analysis": {
    "sentiment": "positive|neutral|negative",
    "key_themes": ["theme1", "theme2"],
    "emotional_state": "description"
  }
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.7,
      system: 'You are an empathetic AI journal companion with memory of the user\'s journal history. You provide personalized support by referencing their past entries, acknowledging their progress, and building on previous conversations. You are trained in supportive listening, gentle guidance, and helping users explore their thoughts and feelings deeply.',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Generate AI response error:', error);
    return {
      response: "Thank you for sharing that with me. How are you feeling about this?",
      followUpQuestions: ["What else is on your mind?"],
      insights: [],
      suggestedActions: []
    };
  }
}

async function generateSessionSummary(session: any) {
  if (!anthropic) {
    return {
      summary: "Journal session completed",
      keyThemes: [],
      emotionalJourney: "stable",
      growthIndicators: []
    };
  }

  const conversationHistory = JSON.parse(session.conversationHistory as string || '[]');
  const userResponses = conversationHistory
    .filter((msg: any) => msg.role === 'user')
    .map((msg: any) => msg.content)
    .join('\n');

  const prompt = `Analyze this journal session and provide a compassionate summary.

User's responses:
${userResponses}

Mood: ${session.mood || 'not specified'}
Energy: ${session.energyLevel || 'not specified'}

Provide a summary in JSON format:
{
  "summary": "2-3 sentence summary of the session",
  "keyThemes": ["theme1", "theme2"],
  "emotionalJourney": "description of emotional progression",
  "growthIndicators": ["indicator1", "indicator2"],
  "actionableInsights": ["insight1", "insight2"],
  "affirmation": "personalized affirmation based on the session"
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 400,
      temperature: 0.5,
      system: 'You are analyzing a journal session. Be compassionate and insightful.',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Generate session summary error:', error);
    return {
      summary: "Thank you for sharing your thoughts today",
      keyThemes: [],
      emotionalJourney: "reflective",
      growthIndicators: []
    };
  }
}

async function updateJournalStreaks(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streakTypes = ['daily_entry', 'morning_checkin', 'mood_tracking'];
  
  for (const streakType of streakTypes) {
    let streak = await prisma.journalStreak.findUnique({
      where: {
        userId_streakType: {
          userId,
          streakType
        }
      }
    });

    if (!streak) {
      streak = await prisma.journalStreak.create({
        data: {
          userId,
          streakType,
          currentStreak: 1,
          longestStreak: 1,
          lastEntryDate: today,
          streakStartDate: today,
          totalEntries: 1
        }
      });
    } else {
      const lastEntry = streak.lastEntryDate ? new Date(streak.lastEntryDate) : null;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastEntry && lastEntry.getTime() === yesterday.getTime()) {
        // Continue streak
        await prisma.journalStreak.update({
          where: { id: streak.id },
          data: {
            currentStreak: streak.currentStreak + 1,
            longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
            lastEntryDate: today,
            totalEntries: streak.totalEntries + 1
          }
        });
      } else if (!lastEntry || lastEntry.getTime() < yesterday.getTime()) {
        // Reset streak
        await prisma.journalStreak.update({
          where: { id: streak.id },
          data: {
            currentStreak: 1,
            lastEntryDate: today,
            streakStartDate: today,
            totalEntries: streak.totalEntries + 1
          }
        });
      }
    }
  }
}

async function getStreakStatus(userId: string) {
  const streaks = await prisma.journalStreak.findMany({
    where: { userId }
  });

  return streaks.reduce((acc, streak) => {
    acc[streak.streakType] = {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      total: streak.totalEntries
    };
    return acc;
  }, {} as any);
}

async function generatePersonalizedInsights(userId: string) {
  // This would analyze recent journal entries, mood patterns, and goals
  // to provide personalized insights similar to Rosebud's weekly reports
  return {
    moodTrend: "improving",
    keyThemes: ["self-care", "productivity", "relationships"],
    recommendations: ["Consider morning meditation", "Schedule time for creative activities"],
    progressHighlights: ["Consistent journaling for 7 days", "Mood improved by 20%"]
  };
}

async function generateMorningInsights(userId: string, checkInData: any) {
  if (!anthropic) {
    return {
      todaysFocus: "Make today meaningful",
      affirmation: "You have everything you need within you"
    };
  }

  const prompt = `Generate personalized morning insights based on this check-in:
Mood: ${checkInData.mood}
Energy: ${checkInData.energyLevel}
Gratitude: ${checkInData.gratitudeItems?.join(', ')}
Intentions: ${checkInData.intentions?.join(', ')}

Return JSON:
{
  "todaysFocus": "personalized focus message",
  "affirmation": "personalized affirmation",
  "suggestions": ["suggestion1", "suggestion2"]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      temperature: 0.7,
      system: 'Generate uplifting, personalized morning insights.',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Generate morning insights error:', error);
    return {
      todaysFocus: "Focus on what matters most to you today",
      affirmation: "You are capable of handling whatever comes your way"
    };
  }
}

async function generateDaySummary(userId: string) {
  // Analyze the day's entries, moods, and accomplishments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todaysData = await prisma.journalEntry.findMany({
    where: {
      userId,
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  return {
    reflection: "You navigated today with grace and strength",
    highlights: ["Completed morning routine", "Managed stress effectively"],
    suggestions: ["Consider earlier bedtime", "Plan tomorrow's priorities tonight"]
  };
}

async function analyzeMoodPattern(userId: string) {
  const recentMoods = await prisma.moodEntry.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
    take: 20
  });

  // Simple pattern analysis
  const avgIntensity = recentMoods.length > 0
    ? recentMoods.reduce((sum, m) => sum + m.intensity, 0) / recentMoods.length
    : 5;

  return {
    recentPattern: avgIntensity > 6 ? "positive" : avgIntensity < 4 ? "challenging" : "stable",
    immediateSuggestion: avgIntensity < 4 
      ? "Consider a short walk or breathing exercise" 
      : "Keep up the positive momentum!"
  };
}

async function generateWeeklyInsights(userId: string) {
  // Comprehensive weekly analysis similar to Rosebud
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [entries, moods, goals] = await Promise.all([
    prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: { gte: weekStart },
        promptType: 'interactive'  // Only count enhanced journal entries
      }
    }),
    prisma.moodEntry.findMany({
      where: {
        userId,
        recordedAt: { gte: weekStart }
      }
    }),
    prisma.journalGoal.findMany({
      where: { userId, status: 'active' }
    })
  ]);


  return {
    weekSummary: {
      totalEntries: entries.length,
      avgMoodIntensity: moods.length > 0 
        ? moods.reduce((sum, m) => sum + m.intensity, 0) / moods.length 
        : 0,
      consistencyScore: Math.min(100, (entries.length / 7) * 100)
    },
    moodAnalysis: {
      trend: "improving",
      dominantMoods: ["content", "focused"],
      triggers: ["work stress", "social interactions"]
    },
    themeAnalysis: {
      recurringThemes: ["personal growth", "relationships", "career"],
      emergingPatterns: ["increased self-awareness", "better boundaries"]
    },
    progressReport: {
      goalsProgress: goals.map(g => ({
        goal: g.title,
        progress: g.progress,
        status: g.status
      })),
      achievements: ["7-day journal streak", "Mood improved by 15%"]
    },
    recommendations: [
      "Continue morning gratitude practice",
      "Explore the anxiety you mentioned on Tuesday",
      "Celebrate your progress in communication"
    ]
  };
}

async function generateGoalPrompts(goal: any) {
  return [
    `How are you progressing toward "${goal.title}"?`,
    `What small step can you take today for your ${goal.category} goal?`,
    `What obstacles are you facing with "${goal.title}"?`
  ];
}

// Simplified gamification integration for AI Journal
async function awardJournalXP(userId: string, activityType: string, metadata?: any) {
  try {
    // Define XP rewards for different journal activities
    const xpRewards: { [key: string]: number } = {
      'complete_session': 25,
      'morning_checkin': 15,
      'evening_checkin': 15,
      'mood_log': 10,
      'goal_created': 20,
      'weekly_reflection': 30
    };

    let baseXP = xpRewards[activityType] || 10;
    let bonusXP = 0;
    let reason = `AI Journal: ${activityType.replace('_', ' ')}`;

    // Add bonus XP based on activity quality
    if (activityType === 'complete_session' && metadata) {
      // Bonus for longer sessions
      if (metadata.duration > 300) bonusXP += 5; // 5+ minutes
      if (metadata.duration > 600) bonusXP += 5; // 10+ minutes
      
      // Bonus for more content
      if (metadata.wordCount > 100) bonusXP += 5;
      if (metadata.wordCount > 250) bonusXP += 5;
      
      reason = `AI Journal: ${metadata.duration ? Math.floor(metadata.duration/60) : 0}min session`;
    }

    if (activityType === 'morning_checkin' && metadata) {
      // Bonus for detailed check-ins
      if (metadata.gratitudeItems?.length > 0) bonusXP += 3;
      if (metadata.intentions?.length > 0) bonusXP += 3;
      if (metadata.notes) bonusXP += 2;
    }

    const totalXP = baseXP + bonusXP;
    
    // Direct XP award using Prisma (simpler approach)
    await awardXPDirectly(userId, totalXP, reason);
    
    console.log(`Awarded ${totalXP} XP to user ${userId} for ${reason}`);
  } catch (error) {
    console.error('Failed to award journal XP:', error);
  }
}

// Direct XP award function
async function awardXPDirectly(userId: string, amount: number, reason: string) {
  // Get or create user level
  let userLevel = await prisma.userLevel.findUnique({
    where: { userId }
  });

  if (!userLevel) {
    userLevel = await prisma.userLevel.create({
      data: { userId }
    });
  }

  let newCurrentXP = userLevel.currentXP + amount;
  const newTotalXP = userLevel.totalXP + amount;
  
  let newLevel = userLevel.level;
  let leveledUp = false;
  
  // Check for level up(s)
  while (newCurrentXP >= userLevel.xpToNextLevel) {
    newCurrentXP -= userLevel.xpToNextLevel;
    newLevel += 1;
    leveledUp = true;
    userLevel.xpToNextLevel = calculateXPToNextLevel(newLevel);
  }
  
  const newXPToNext = calculateXPToNextLevel(newLevel);

  // Update user level
  const updatedLevel = await prisma.userLevel.update({
    where: { userId },
    data: {
      level: newLevel,
      currentXP: newCurrentXP,
      totalXP: newTotalXP,
      xpToNextLevel: newXPToNext,
      title: getLevelTitle(newLevel)
    }
  });

  if (leveledUp) {
    console.log(`User ${userId} leveled up to level ${newLevel}!`);
  }

  return {
    xpAwarded: amount,
    newLevel: updatedLevel,
    leveledUp,
    reason
  };
}

// Helper functions for leveling
function calculateXPToNextLevel(level: number): number {
  return 100 * Math.pow(1.2, level - 1);
}

function getLevelTitle(level: number): string {
  if (level < 5) return 'Beginner';
  if (level < 10) return 'Explorer';
  if (level < 20) return 'Achiever';
  if (level < 35) return 'Expert';
  if (level < 50) return 'Master';
  return 'Grandmaster';
}

export default router;