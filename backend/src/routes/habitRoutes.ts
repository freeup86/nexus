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

// Habit Categories
const HABIT_CATEGORIES = [
  'health', 'productivity', 'mindfulness', 'learning', 'social', 
  'creative', 'financial', 'personal_care', 'environment', 'other'
];

const MOOD_OPTIONS = ['happy', 'neutral', 'stressed', 'tired', 'energetic'];
const ENERGY_LEVELS = ['low', 'medium', 'high'];

// ============== HABITS ENDPOINTS ==============

// Create new habit
router.post('/',
  [
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('category').isIn(HABIT_CATEGORIES),
    body('frequencyType').isIn(['daily', 'weekly', 'custom']),
    body('frequencyDetails').optional().isObject(),
    body('microHabits').optional().isArray(),
    body('targetTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('reminderEnabled').optional().isBoolean()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const habit = await prisma.habit.create({
        data: {
          userId,
          name: req.body.name,
          description: req.body.description,
          category: req.body.category,
          frequencyType: req.body.frequencyType,
          frequencyDetails: req.body.frequencyDetails || {},
          microHabits: req.body.microHabits || [],
          targetTime: req.body.targetTime,
          reminderEnabled: req.body.reminderEnabled ?? true
        }
      });

      res.status(201).json({ habit });
    } catch (error) {
      console.error('Create habit error:', error);
      res.status(500).json({ error: 'Failed to create habit' });
    }
  }
);

// Get user's habits
router.get('/',
  [
    query('category').optional().isIn(HABIT_CATEGORIES),
    query('isActive').optional().isBoolean()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { category, isActive } = req.query;
      const where: any = { userId };
      
      if (category) where.category = category;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const habits = await prisma.habit.findMany({
        where,
        include: {
          logs: {
            take: 30,
            orderBy: { completedAt: 'desc' }
          },
          predictions: {
            where: {
              predictionDate: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Calculate streaks and completion rates
      const habitsWithStats = habits.map(habit => {
        const logs = habit.logs;
        const completedLogs = logs.filter(log => log.completionStatus === 'completed');
        
        // Calculate current streak
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          
          const logForDate = logs.find(log => {
            const logDate = new Date(log.completedAt);
            logDate.setHours(0, 0, 0, 0);
            return logDate.getTime() === checkDate.getTime() && log.completionStatus === 'completed';
          });
          
          if (logForDate) {
            currentStreak++;
          } else {
            break;
          }
        }

        // Calculate completion rate (last 30 days)
        const completionRate = logs.length > 0 ? 
          (completedLogs.length / Math.min(logs.length, 30)) * 100 : 0;

        return {
          ...habit,
          stats: {
            currentStreak,
            completionRate: Math.round(completionRate),
            totalCompletions: completedLogs.length,
            recentAvgQuality: completedLogs.length > 0 ? 
              completedLogs.reduce((sum, log) => sum + (log.qualityRating || 0), 0) / completedLogs.length : 0
          }
        };
      });

      res.json({ habits: habitsWithStats });
    } catch (error) {
      console.error('Get habits error:', error);
      res.status(500).json({ error: 'Failed to get habits' });
    }
  }
);

// Get today's logs for all habits (MUST come before /:id route)
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
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const logs = await prisma.habitLog.findMany({
        where: {
          userId,
          completedAt: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          habit: true
        },
        orderBy: { completedAt: 'desc' }
      });

      res.json({ logs });
    } catch (error) {
      console.error('Get today logs error:', error);
      res.status(500).json({ error: 'Failed to get today\'s logs' });
    }
  }
);

// Generate today's predictions for all habits (MUST come before /:id route)
router.get('/predictions/today',
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

      const predictions = habits.map(habit => {
        // Simple prediction logic for now
        const logs = habit.logs;
        const completionRate = logs.length > 0 ? 
          logs.filter(log => log.completionStatus === 'completed').length / logs.length : 0;
        
        return {
          habitId: habit.id,
          habitName: habit.name,
          skipRiskScore: 1 - completionRate,
          recommendedTimes: [habit.targetTime || '09:00'],
          riskFactors: {},
          confidence: logs.length >= 10 ? 0.8 : Math.min(0.7, logs.length * 0.1),
          suggestion: completionRate > 0.7 ? `You're on track with ${habit.name}!` : `Consider doing ${habit.name} earlier today.`
        };
      });

      res.json({ predictions });
    } catch (error) {
      console.error('Get today predictions error:', error);
      res.status(500).json({ error: 'Failed to get predictions' });
    }
  }
);

// Get specific habit
router.get('/:id',
  [param('id').isUUID()],
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
          id: req.params.id,
          userId
        },
        include: {
          logs: {
            orderBy: { completedAt: 'desc' },
            take: 100
          },
          journalEntries: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          predictions: {
            orderBy: { predictionDate: 'desc' },
            take: 7
          }
        }
      });

      if (!habit) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }

      res.json({ habit });
    } catch (error) {
      console.error('Get habit error:', error);
      res.status(500).json({ error: 'Failed to get habit' });
    }
  }
);

// Update habit
router.put('/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('category').optional().isIn(HABIT_CATEGORIES),
    body('frequencyType').optional().isIn(['daily', 'weekly', 'custom']),
    body('frequencyDetails').optional().isObject(),
    body('microHabits').optional().isArray(),
    body('targetTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('reminderEnabled').optional().isBoolean(),
    body('isActive').optional().isBoolean()
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
          id: req.params.id,
          userId
        }
      });

      if (!habit) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }

      const updatedHabit = await prisma.habit.update({
        where: { id: req.params.id },
        data: {
          ...(req.body.name && { name: req.body.name }),
          ...(req.body.description !== undefined && { description: req.body.description }),
          ...(req.body.category && { category: req.body.category }),
          ...(req.body.frequencyType && { frequencyType: req.body.frequencyType }),
          ...(req.body.frequencyDetails && { frequencyDetails: req.body.frequencyDetails }),
          ...(req.body.microHabits && { microHabits: req.body.microHabits }),
          ...(req.body.targetTime !== undefined && { targetTime: req.body.targetTime }),
          ...(req.body.reminderEnabled !== undefined && { reminderEnabled: req.body.reminderEnabled }),
          ...(req.body.isActive !== undefined && { isActive: req.body.isActive })
        }
      });

      res.json({ habit: updatedHabit });
    } catch (error) {
      console.error('Update habit error:', error);
      res.status(500).json({ error: 'Failed to update habit' });
    }
  }
);

// Delete habit
router.delete('/:id',
  [param('id').isUUID()],
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
          id: req.params.id,
          userId
        }
      });

      if (!habit) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }

      await prisma.habit.delete({
        where: { id: req.params.id }
      });

      res.json({ message: 'Habit deleted successfully' });
    } catch (error) {
      console.error('Delete habit error:', error);
      res.status(500).json({ error: 'Failed to delete habit' });
    }
  }
);

// ============== HABIT LOGGING ENDPOINTS ==============

// Log habit completion
router.post('/:habitId/log',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify habit belongs to user
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

      // Check if there's already a log for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const existingLog = await prisma.habitLog.findFirst({
        where: {
          habitId: req.params.habitId,
          userId,
          completedAt: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      if (existingLog) {
        res.status(400).json({ error: 'Habit already logged for today' });
        return;
      }

      const completedAt = req.body.completedAt ? new Date(req.body.completedAt) : new Date();

      const log = await prisma.habitLog.create({
        data: {
          habitId: req.params.habitId,
          userId,
          completedAt,
          completionStatus: req.body.completionStatus,
          qualityRating: req.body.qualityRating,
          mood: req.body.mood,
          energyLevel: req.body.energyLevel,
          location: req.body.location,
          contextNotes: req.body.contextNotes,
          skipReason: req.body.skipReason,
          duration: req.body.duration
        }
      });

      res.status(201).json({ log });
    } catch (error) {
      console.error('Log habit error:', error);
      res.status(500).json({ error: 'Failed to log habit' });
    }
  }
);

// Get habit logs
router.get('/:habitId/logs',
  [
    param('habitId').isUUID(),
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

      // Verify habit belongs to user
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

      const { startDate, endDate, limit } = req.query;
      const where: any = {
        habitId: req.params.habitId,
        userId
      };

      if (startDate || endDate) {
        where.completedAt = {};
        if (startDate) where.completedAt.gte = new Date(startDate as string);
        if (endDate) where.completedAt.lte = new Date(endDate as string);
      }

      const logs = await prisma.habitLog.findMany({
        where,
        orderBy: { completedAt: 'desc' },
        take: limit ? parseInt(limit as string) : 50
      });

      res.json({ logs });
    } catch (error) {
      console.error('Get habit logs error:', error);
      res.status(500).json({ error: 'Failed to get habit logs' });
    }
  }
);

// ============== JOURNAL ENDPOINTS ==============

// Create journal entry
router.post('/journal/entry',
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
          habitId: req.body.habitId || null,
          promptType: req.body.promptType || 'custom',
          promptText: req.body.promptText || '',
          userResponse: req.body.userResponse || '',
          isVoiceEntry: req.body.isVoiceEntry || false
        }
      });

      res.status(201).json({ entry });
    } catch (error) {
      console.error('Create journal entry error:', error);
      res.status(500).json({ error: 'Failed to create journal entry' });
    }
  }
);

// Get journal entries
router.get('/journal/entries',
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
router.get('/journal/prompts/today',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Simple prompts for now
      const prompts = [
        {
          type: 'daily_reflection',
          promptText: 'How are you feeling about your habits today? What patterns do you notice?',
          priority: 'low'
        }
      ];

      res.json({ prompts });
    } catch (error) {
      console.error('Get today prompts error:', error);
      res.status(500).json({ error: 'Failed to get today\'s prompts' });
    }
  }
);

// Get weekly insights
router.get('/journal/insights/weekly',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Simple weekly insights for now
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const insights = {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        summary: {
          totalHabits: 0,
          totalLogs: 0,
          completedHabits: 0,
          skippedHabits: 0,
          averageQuality: 0,
          journalEntries: 0
        },
        habitBreakdown: [],
        recommendations: ['Start by creating your first habit!']
      };

      res.json({ insights });
    } catch (error) {
      console.error('Get weekly insights error:', error);
      res.status(500).json({ error: 'Failed to get weekly insights' });
    }
  }
);

export default router;