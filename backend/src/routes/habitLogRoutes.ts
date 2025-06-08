import { Router, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';
import { awardXP, updateStreak } from '../utils/gamificationHelper';

const router = Router();
const prisma = new PrismaClient();

// Validation middleware
const validateRequest = (req: AuthRequest, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

const COMPLETION_STATUSES = ['completed', 'skipped', 'partial'];
const MOOD_OPTIONS = ['happy', 'neutral', 'stressed', 'tired', 'energetic'];
const ENERGY_LEVELS = ['low', 'medium', 'high'];
const SKIP_REASONS = ['no_time', 'forgot', 'sick', 'traveling', 'unmotivated', 'weather', 'emergency', 'other'];

// ============== HABIT LOGGING ENDPOINTS ==============

// Log habit completion
router.post('/:habitId/log',
  [
    param('habitId').isUUID(),
    body('completionStatus').isIn(COMPLETION_STATUSES),
    body('qualityRating').optional().isInt({ min: 1, max: 5 }),
    body('mood').optional().isIn(MOOD_OPTIONS),
    body('energyLevel').optional().isIn(ENERGY_LEVELS),
    body('location').optional().trim().isLength({ max: 100 }),
    body('contextNotes').optional().trim().isLength({ max: 500 }),
    body('skipReason').optional().isIn(SKIP_REASONS),
    body('duration').optional().isInt({ min: 1, max: 720 }), // max 12 hours
    body('completedAt').optional().isISO8601()
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

      // Award XP and update streaks for completed habits
      let gamificationResult = null;
      if (req.body.completionStatus === 'completed') {
        try {
          // Award XP based on quality rating
          let xpAmount = 10; // Base XP for habit completion
          if (req.body.qualityRating) {
            xpAmount += (req.body.qualityRating - 1) * 5; // Bonus XP for higher quality
          }

          // Award XP
          const xpResult = await awardXP(userId, xpAmount, `Completed habit: ${habit.name}`);
          
          // Update habit-specific streak
          const streakResult = await updateStreak(userId, 'habit_specific', req.params.habitId);
          
          // Update general habits streak
          const generalStreakResult = await updateStreak(userId, 'overall_habits');

          gamificationResult = {
            xp: xpResult,
            habitStreak: streakResult,
            generalStreak: generalStreakResult
          };
        } catch (error) {
          console.error('Error updating gamification data:', error);
          // Continue without failing the habit log creation
        }
      }

      // Generate AI insights if this is a completion or skip
      if (req.body.completionStatus === 'completed' || req.body.completionStatus === 'skipped') {
        await generateInsightsFromLog(log, habit);
      }

      res.status(201).json({ 
        log,
        gamification: gamificationResult
      });
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

// Update habit log
router.put('/log/:logId',
  [
    param('logId').isUUID(),
    body('completionStatus').optional().isIn(COMPLETION_STATUSES),
    body('qualityRating').optional().isInt({ min: 1, max: 5 }),
    body('mood').optional().isIn(MOOD_OPTIONS),
    body('energyLevel').optional().isIn(ENERGY_LEVELS),
    body('location').optional().trim().isLength({ max: 100 }),
    body('contextNotes').optional().trim().isLength({ max: 500 }),
    body('skipReason').optional().isIn(SKIP_REASONS),
    body('duration').optional().isInt({ min: 1, max: 720 })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const log = await prisma.habitLog.findFirst({
        where: {
          id: req.params.logId,
          userId
        }
      });

      if (!log) {
        res.status(404).json({ error: 'Habit log not found' });
        return;
      }

      const updatedLog = await prisma.habitLog.update({
        where: { id: req.params.logId },
        data: {
          ...(req.body.completionStatus && { completionStatus: req.body.completionStatus }),
          ...(req.body.qualityRating !== undefined && { qualityRating: req.body.qualityRating }),
          ...(req.body.mood && { mood: req.body.mood }),
          ...(req.body.energyLevel && { energyLevel: req.body.energyLevel }),
          ...(req.body.location !== undefined && { location: req.body.location }),
          ...(req.body.contextNotes !== undefined && { contextNotes: req.body.contextNotes }),
          ...(req.body.skipReason !== undefined && { skipReason: req.body.skipReason }),
          ...(req.body.duration !== undefined && { duration: req.body.duration })
        }
      });

      res.json({ log: updatedLog });
    } catch (error) {
      console.error('Update habit log error:', error);
      res.status(500).json({ error: 'Failed to update habit log' });
    }
  }
);

// Delete habit log
router.delete('/log/:logId',
  [param('logId').isUUID()],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const log = await prisma.habitLog.findFirst({
        where: {
          id: req.params.logId,
          userId
        }
      });

      if (!log) {
        res.status(404).json({ error: 'Habit log not found' });
        return;
      }

      await prisma.habitLog.delete({
        where: { id: req.params.logId }
      });

      res.json({ message: 'Habit log deleted successfully' });
    } catch (error) {
      console.error('Delete habit log error:', error);
      res.status(500).json({ error: 'Failed to delete habit log' });
    }
  }
);

// Get today's logs for all habits
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

// Helper function to generate insights from log
async function generateInsightsFromLog(log: any, habit: any) {
  // This would integrate with AI to generate insights
  // For now, we'll create a simple journal prompt
  try {
    const promptType = log.completionStatus === 'completed' ? 'habit_success' : 'habit_skip';
    let promptText = '';
    
    if (log.completionStatus === 'completed') {
      promptText = `Great job completing "${habit.name}"! `;
      if (log.qualityRating) {
        promptText += `You rated it ${log.qualityRating}/5. `;
      }
      promptText += 'What helped you succeed today?';
    } else {
      promptText = `You skipped "${habit.name}" today. `;
      if (log.skipReason) {
        promptText += `Reason: ${log.skipReason}. `;
      }
      promptText += 'What could help you tackle this tomorrow?';
    }

    // Could create a journal entry prompt here
    console.log('Generated prompt:', promptText);
  } catch (error) {
    console.error('Error generating insights:', error);
  }
}

export default router;