import express from 'express';
import { PrismaClient } from '../generated/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import Anthropic from '@anthropic-ai/sdk';
import { GamificationTriggers } from '../utils/gamificationHelper';

const router = express.Router();
const prisma = new PrismaClient();

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicApiKey) {
  console.error('ANTHROPIC_API_KEY is not configured');
}

const anthropic = new Anthropic({
  apiKey: anthropicApiKey || '',
});

// Get personal insights dashboard
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get recent insights
    const insights = await prisma.personalInsight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get coaching suggestions
    const suggestions = await prisma.coachingSuggestion.findMany({
      where: { 
        userId,
        status: { in: ['pending', 'accepted'] }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5
    });

    // Get recent mood trends
    const moodEntries = await prisma.moodEntry.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 30
    });

    res.json({
      insights,
      suggestions,
      moodTrends: moodEntries
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Log mood entry
router.post('/mood', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const {
      mood,
      intensity,
      energyLevel,
      notes,
      triggers = [],
      activities = [],
      location,
      weather,
      recordedAt
    } = req.body;

    const moodEntry = await prisma.moodEntry.create({
      data: {
        userId,
        mood,
        intensity,
        energyLevel,
        notes,
        triggers,
        activities,
        location,
        weather,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date()
      }
    });

    // Award gamification rewards
    GamificationTriggers.moodLogged(userId);

    res.json(moodEntry);
  } catch (error) {
    console.error('Error creating mood entry:', error);
    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

// Log life metric
router.post('/metrics', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const {
      metricType,
      value,
      rawValue,
      notes,
      recordedAt,
      source = 'manual'
    } = req.body;

    const metric = await prisma.lifeMetric.create({
      data: {
        userId,
        metricType,
        value,
        rawValue,
        notes,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        source
      }
    });

    res.json(metric);
  } catch (error) {
    console.error('Error creating life metric:', error);
    res.status(500).json({ error: 'Failed to create life metric' });
  }
});

// Generate AI insights
router.post('/analyze', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!anthropicApiKey) {
      res.status(500).json({ error: 'AI service not configured' });
      return;
    }

    console.log('Starting data fetch for user:', userId);
    
    // Get user data from multiple domains
    const [habits, dreams, decisions, moodEntries, lifeMetrics, habitLogs] = await Promise.all([
      prisma.habit.findMany({
        where: { userId },
        include: { logs: { take: 30, orderBy: { completedAt: 'desc' } } }
      }),
      prisma.dream.findMany({
        where: { userId },
        orderBy: { dreamDate: 'desc' },
        take: 20
      }),
      prisma.decision.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.moodEntry.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: 30
      }),
      prisma.lifeMetric.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: 50
      }),
      prisma.habitLog.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: 50,
        include: { habit: true }
      })
    ]);

    console.log('Data fetched successfully:', {
      habits: habits.length,
      dreams: dreams.length,
      decisions: decisions.length,
      moodEntries: moodEntries.length,
      lifeMetrics: lifeMetrics.length,
      habitLogs: habitLogs.length
    });

    // Check if user has enough data to analyze
    if (habits.length === 0 && dreams.length === 0 && decisions.length === 0 && 
        moodEntries.length === 0 && habitLogs.length === 0) {
      res.json({
        insights: [],
        suggestions: [{
          id: 'starter-suggestion',
          category: 'life_balance',
          title: 'Start tracking your life',
          suggestion: 'Begin by creating some habits, logging your mood, or recording your dreams to get personalized insights.',
          reasoning: 'We need some data to analyze your patterns and provide meaningful insights.',
          difficulty: 'easy',
          timeframe: 'immediate',
          priority: 10,
          status: 'pending',
          basedOn: {},
          createdAt: new Date()
        }],
        analysisComplete: true
      });
      return;
    }

    // Prepare data for AI analysis
    const analysisData = {
      timeframe: '30_days',
      habits: habits.map(h => ({
        name: h.name,
        category: h.category,
        recentLogs: h.logs.map(l => ({
          status: l.completionStatus,
          mood: l.mood,
          energy: l.energyLevel,
          date: l.completedAt
        }))
      })),
      dreams: dreams.map(d => ({
        emotions: d.emotions,
        themes: d.themes,
        lucidity: d.lucidity,
        clarity: d.clarity,
        mood: d.mood,
        date: d.dreamDate
      })),
      decisions: decisions.map(d => ({
        title: d.title,
        status: d.status,
        outcome: d.outcome,
        date: d.createdAt
      })),
      moodEntries: moodEntries.map(m => ({
        mood: m.mood,
        intensity: m.intensity,
        energy: m.energyLevel,
        triggers: m.triggers,
        activities: m.activities,
        date: m.recordedAt
      })),
      lifeMetrics: lifeMetrics.map(m => ({
        type: m.metricType,
        value: m.value,
        source: m.source,
        date: m.recordedAt
      }))
    };

    const aiPrompt = `Analyze this personal data across multiple life domains and provide comprehensive insights. Write all insights and suggestions in second person (using "you/your") to make them personal and direct.

Personal data:
${JSON.stringify(analysisData, null, 2)}

Analyze for:
1. Cross-domain patterns (how habits affect mood, dreams relate to stress, etc.)
2. Life balance analysis
3. Energy and mood trend analysis  
4. Actionable coaching suggestions with priorities
5. Risk factors or concerning patterns
6. Positive patterns to reinforce

IMPORTANT: Write all descriptions and suggestions using "you/your" (e.g., "Your mood appears to be...", "You may benefit from...", etc.)

You MUST respond with ONLY valid JSON in this exact format (no other text):
{
  "insights": [
    {
      "type": "life_pattern" | "mood_trend" | "energy_pattern" | "cross_domain",
      "title": "Brief title",
      "description": "Detailed description",
      "confidence": 0.0-1.0,
      "priority": "low" | "medium" | "high" | "urgent",
      "actionable": boolean,
      "categories": ["habits", "dreams", "mood", etc.]
    }
  ],
  "coachingSuggestions": [
    {
      "category": "habit_optimization" | "mood_improvement" | "productivity" | "stress_management" | "life_balance",
      "title": "Brief title",
      "suggestion": "Detailed suggestion",
      "reasoning": "Why this suggestion",
      "difficulty": "easy" | "medium" | "hard",
      "timeframe": "immediate" | "daily" | "weekly" | "monthly",
      "priority": 1-10
    }
  ]
}`;

    console.log('Calling Anthropic API...');
    
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: aiPrompt
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }
    
    // Try to parse JSON response
    let analysisResult;
    try {
      // First try to parse the entire response
      analysisResult = JSON.parse(content.text);
    } catch (parseError) {
      // If that fails, try to clean up the JSON and parse again
      console.log('Initial JSON parse failed, attempting to clean and extract JSON...');
      
      // Replace smart quotes with regular quotes
      let cleanedText = content.text
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'");
      
      // Try to extract JSON from the cleaned response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysisResult = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error('Failed to extract valid JSON from response:', content.text.substring(0, 500) + '...');
          throw new Error('AI response was not valid JSON');
        }
      } else {
        console.error('No JSON found in response:', content.text.substring(0, 500) + '...');
        throw new Error('AI response did not contain JSON');
      }
    }
    
    console.log('AI response parsed successfully');

    // Store insights in database
    const createdInsights = await Promise.all(
      analysisResult.insights.map(insight =>
        prisma.personalInsight.create({
          data: {
            userId,
            insightType: insight.type,
            title: insight.title,
            description: insight.description,
            dataPoints: analysisData,
            confidence: insight.confidence,
            priority: insight.priority,
            actionable: insight.actionable,
            categories: insight.categories
          }
        })
      )
    );

    // Store coaching suggestions
    const createdSuggestions = await Promise.all(
      analysisResult.coachingSuggestions.map(suggestion =>
        prisma.coachingSuggestion.create({
          data: {
            userId,
            category: suggestion.category,
            title: suggestion.title,
            suggestion: suggestion.suggestion,
            reasoning: suggestion.reasoning,
            difficulty: suggestion.difficulty,
            timeframe: suggestion.timeframe,
            priority: suggestion.priority,
            basedOn: analysisData
          }
        })
      )
    );

    // Award gamification rewards for generating insights
    GamificationTriggers.insightsGenerated(userId);

    res.json({
      insights: createdInsights,
      suggestions: createdSuggestions,
      analysisComplete: true
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to generate insights',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Update coaching suggestion status
router.patch('/suggestions/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { status } = req.body;

    const suggestion = await prisma.coachingSuggestion.update({
      where: { 
        id,
        userId // Ensure user can only update their own suggestions
      },
      data: {
        status,
        ...(status === 'accepted' && { acceptedAt: new Date() }),
        ...(status === 'completed' && { completedAt: new Date() })
      }
    });

    res.json(suggestion);
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ error: 'Failed to update suggestion' });
  }
});

// Acknowledge insight
router.patch('/insights/:id/acknowledge', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const insight = await prisma.personalInsight.update({
      where: { 
        id,
        userId
      },
      data: {
        status: 'acknowledged',
        acknowledgedAt: new Date()
      }
    });

    res.json(insight);
  } catch (error) {
    console.error('Error acknowledging insight:', error);
    res.status(500).json({ error: 'Failed to acknowledge insight' });
  }
});

// Get mood analytics
router.get('/mood/analytics', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { timeframe = '30d' } = req.query;
    
    let startDate = new Date();
    if (timeframe === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeframe === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    }

    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId,
        recordedAt: { gte: startDate }
      },
      orderBy: { recordedAt: 'desc' }
    });

    res.json({ moodEntries, timeframe });
  } catch (error) {
    console.error('Error fetching mood analytics:', error);
    res.status(500).json({ error: 'Failed to fetch mood analytics' });
  }
});

export default router;