import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Anthropic } from '@anthropic-ai/sdk';

const router = Router();
const prisma = new PrismaClient();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Get all dreams for the authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 20, search, tag, startDate, endDate } = req.query;

    const where: any = { userId };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (tag) {
      where.tags = {
        some: {
          tag: tag as string
        }
      };
    }

    if (startDate || endDate) {
      where.dreamDate = {};
      if (startDate) where.dreamDate.gte = new Date(startDate as string);
      if (endDate) where.dreamDate.lte = new Date(endDate as string);
    }

    const dreams = await prisma.dream.findMany({
      where,
      include: {
        tags: true,
        insights: true
      },
      orderBy: { dreamDate: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.dream.count({ where });

    res.json({
      dreams,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching dreams:', error);
    res.status(500).json({ error: 'Failed to fetch dreams' });
  }
});

// Get a specific dream
router.get('/:id', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const dream = await prisma.dream.findFirst({
      where: { id, userId },
      include: {
        tags: true,
        insights: true
      }
    });

    if (!dream) {
      res.status(404).json({ error: 'Dream not found' });
      return;
    }

    res.json(dream);
  } catch (error) {
    console.error('Error fetching dream:', error);
    res.status(500).json({ error: 'Failed to fetch dream' });
  }
});

// Create a new dream
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { title, content, dreamDate, emotions, lucidity, clarity, mood, tags } = req.body;

    // Start transaction to create dream and analyze it
    const result = await prisma.$transaction(async (tx) => {
      // Create the dream
      const dream = await tx.dream.create({
        data: {
          userId,
          title,
          content,
          dreamDate: dreamDate ? new Date(dreamDate) : new Date(),
          emotions: emotions || null,
          lucidity: lucidity || 0,
          clarity: clarity || 5,
          mood: mood || null
        }
      });

      // Create tags if provided
      if (tags && Array.isArray(tags)) {
        await tx.dreamTag.createMany({
          data: tags.map((tag: string) => ({
            dreamId: dream.id,
            tag: tag.toLowerCase()
          }))
        });
      }

      // Analyze the dream with AI
      try {
        const prompt = `Analyze this dream and provide insights:

Title: ${title}
Content: ${content}
Mood: ${mood || 'Not specified'}
Lucidity (0-10): ${lucidity || 0}
Clarity (0-10): ${clarity || 5}

Please provide:
1. Key themes (as a JSON array)
2. Important symbols and their potential meanings (as a JSON array of objects with "symbol" and "meaning" fields)
3. Emotional analysis beyond the stated mood
4. Any patterns or recurring elements that might be significant
5. A brief overall interpretation (2-3 sentences)

Format your response as JSON with the following structure:
{
  "themes": ["theme1", "theme2"],
  "symbols": [{"symbol": "symbol1", "meaning": "meaning1"}],
  "emotionalAnalysis": "Your emotional analysis",
  "patterns": "Any patterns observed",
  "interpretation": "Your interpretation"
}`;

        const response = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        });

        const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
        let analysisData;
        
        try {
          analysisData = JSON.parse(analysisText);
        } catch (e) {
          analysisData = { interpretation: analysisText };
        }

        // Update dream with analysis
        const updatedDream = await tx.dream.update({
          where: { id: dream.id },
          data: {
            themes: analysisData.themes || null,
            symbols: analysisData.symbols || null,
            analysis: analysisData.interpretation || analysisText
          }
        });

        // Create insights
        const insights = [];
        
        if (analysisData.themes) {
          for (const theme of analysisData.themes) {
            insights.push({
              dreamId: dream.id,
              type: 'theme',
              insight: theme,
              confidence: 0.8
            });
          }
        }

        if (analysisData.symbols) {
          for (const symbol of analysisData.symbols) {
            insights.push({
              dreamId: dream.id,
              type: 'symbol',
              insight: `${symbol.symbol}: ${symbol.meaning}`,
              confidence: 0.7
            });
          }
        }

        if (analysisData.emotionalAnalysis) {
          insights.push({
            dreamId: dream.id,
            type: 'emotion',
            insight: analysisData.emotionalAnalysis,
            confidence: 0.85
          });
        }

        if (insights.length > 0) {
          await tx.dreamInsight.createMany({ data: insights });
        }

        return updatedDream;
      } catch (aiError) {
        console.error('AI analysis failed:', aiError);
        // Return dream without analysis if AI fails
        return dream;
      }
    });

    // Fetch the complete dream with relations
    const completeDream = await prisma.dream.findUnique({
      where: { id: result.id },
      include: {
        tags: true,
        insights: true
      }
    });

    res.status(201).json(completeDream);
  } catch (error) {
    console.error('Error creating dream:', error);
    res.status(500).json({ error: 'Failed to create dream' });
  }
});

// Update a dream
router.put('/:id', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { title, content, dreamDate, emotions, lucidity, clarity, mood, tags } = req.body;

    // Check if dream exists and belongs to user
    const existingDream = await prisma.dream.findFirst({
      where: { id, userId }
    });

    if (!existingDream) {
      res.status(404).json({ error: 'Dream not found' });
      return;
    }

    // Update dream and tags in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update dream
      const dream = await tx.dream.update({
        where: { id },
        data: {
          title,
          content,
          dreamDate: dreamDate ? new Date(dreamDate) : undefined,
          emotions: emotions !== undefined ? emotions : undefined,
          lucidity: lucidity !== undefined ? lucidity : undefined,
          clarity: clarity !== undefined ? clarity : undefined,
          mood: mood !== undefined ? mood : undefined
        }
      });

      // Update tags if provided
      if (tags !== undefined) {
        // Delete existing tags
        await tx.dreamTag.deleteMany({
          where: { dreamId: id }
        });

        // Create new tags
        if (Array.isArray(tags) && tags.length > 0) {
          await tx.dreamTag.createMany({
            data: tags.map((tag: string) => ({
              dreamId: id,
              tag: tag.toLowerCase()
            }))
          });
        }
      }

      return dream;
    });

    // Fetch updated dream with relations
    const updatedDream = await prisma.dream.findUnique({
      where: { id },
      include: {
        tags: true,
        insights: true
      }
    });

    res.json(updatedDream);
  } catch (error) {
    console.error('Error updating dream:', error);
    res.status(500).json({ error: 'Failed to update dream' });
  }
});

// Delete a dream
router.delete('/:id', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if dream exists and belongs to user
    const dream = await prisma.dream.findFirst({
      where: { id, userId }
    });

    if (!dream) {
      res.status(404).json({ error: 'Dream not found' });
      return;
    }

    await prisma.dream.delete({
      where: { id }
    });

    res.json({ message: 'Dream deleted successfully' });
  } catch (error) {
    console.error('Error deleting dream:', error);
    res.status(500).json({ error: 'Failed to delete dream' });
  }
});

// Get dream patterns for user
router.get('/patterns/all', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const patterns = await prisma.dreamPattern.findMany({
      where: { userId },
      orderBy: { lastSeen: 'desc' }
    });

    res.json(patterns);
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
});

// Analyze patterns across all dreams
router.post('/patterns/analyze', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Fetch all dreams for analysis
    const dreams = await prisma.dream.findMany({
      where: { userId },
      include: { tags: true },
      orderBy: { dreamDate: 'desc' }
    });

    if (dreams.length < 3) {
      res.json({ 
        message: 'Need at least 3 dreams to analyze patterns',
        patterns: [] 
      });
      return;
    }

    // Analyze recurring themes
    const themeFrequency = new Map<string, number>();
    const symbolFrequency = new Map<string, number>();
    const emotionTrends = new Map<string, number>();

    for (const dream of dreams) {
      // Count themes
      if (dream.themes && Array.isArray(dream.themes)) {
        for (const theme of dream.themes as string[]) {
          themeFrequency.set(theme, (themeFrequency.get(theme) || 0) + 1);
        }
      }

      // Count symbols
      if (dream.symbols && Array.isArray(dream.symbols)) {
        for (const symbolObj of dream.symbols as any[]) {
          const symbol = symbolObj.symbol || symbolObj;
          symbolFrequency.set(symbol, (symbolFrequency.get(symbol) || 0) + 1);
        }
      }

      // Track emotions
      if (dream.mood) {
        emotionTrends.set(dream.mood, (emotionTrends.get(dream.mood) || 0) + 1);
      }
    }

    // Create or update patterns
    const patterns = [];

    // Recurring themes (appearing in >20% of dreams)
    for (const [theme, count] of themeFrequency.entries()) {
      if (count >= Math.ceil(dreams.length * 0.2)) {
        const pattern = await prisma.dreamPattern.upsert({
          where: {
            userId_patternType_patternKey: {
              userId,
              patternType: 'recurring_theme',
              patternKey: theme
            }
          },
          update: {
            frequency: count,
            lastSeen: new Date()
          },
          create: {
            userId,
            patternType: 'recurring_theme',
            patternKey: theme,
            pattern: { theme, occurrences: count },
            frequency: count,
            firstSeen: new Date(),
            lastSeen: new Date()
          }
        });
        patterns.push(pattern);
      }
    }

    // Frequent symbols (appearing in >15% of dreams)
    for (const [symbol, count] of symbolFrequency.entries()) {
      if (count >= Math.ceil(dreams.length * 0.15)) {
        const pattern = await prisma.dreamPattern.upsert({
          where: {
            userId_patternType_patternKey: {
              userId,
              patternType: 'symbol_frequency',
              patternKey: symbol
            }
          },
          update: {
            frequency: count,
            lastSeen: new Date()
          },
          create: {
            userId,
            patternType: 'symbol_frequency',
            patternKey: symbol,
            pattern: { symbol, occurrences: count },
            frequency: count,
            firstSeen: new Date(),
            lastSeen: new Date()
          }
        });
        patterns.push(pattern);
      }
    }

    res.json({
      message: 'Pattern analysis complete',
      patterns,
      summary: {
        totalDreams: dreams.length,
        recurringThemes: Array.from(themeFrequency.entries())
          .filter(([_, count]) => count >= Math.ceil(dreams.length * 0.2))
          .map(([theme, count]) => ({ theme, count })),
        frequentSymbols: Array.from(symbolFrequency.entries())
          .filter(([_, count]) => count >= Math.ceil(dreams.length * 0.15))
          .map(([symbol, count]) => ({ symbol, count })),
        emotionalTrends: Array.from(emotionTrends.entries())
          .map(([emotion, count]) => ({ emotion, count, percentage: Math.round((count / dreams.length) * 100) }))
          .sort((a, b) => b.count - a.count)
      }
    });
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    res.status(500).json({ error: 'Failed to analyze patterns' });
  }
});

// Get dream statistics
router.get('/stats/overview', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const [totalDreams, recentDreams, avgLucidity, avgClarity, topTags] = await Promise.all([
      prisma.dream.count({ where: { userId } }),
      prisma.dream.count({
        where: {
          userId,
          dreamDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.dream.aggregate({
        where: { userId },
        _avg: { lucidity: true }
      }),
      prisma.dream.aggregate({
        where: { userId },
        _avg: { clarity: true }
      }),
      prisma.dreamTag.groupBy({
        by: ['tag'],
        where: { dream: { userId } },
        _count: true,
        orderBy: { _count: { tag: 'desc' } },
        take: 10
      })
    ]);

    res.json({
      totalDreams,
      recentDreams,
      avgLucidity: avgLucidity._avg.lucidity || 0,
      avgClarity: avgClarity._avg.clarity || 5,
      topTags: topTags.map(t => ({ tag: t.tag, count: t._count }))
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;