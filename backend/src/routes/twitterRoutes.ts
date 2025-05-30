import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '../generated/prisma';
import { TwitterApi } from 'twitter-api-v2';
import Anthropic from '@anthropic-ai/sdk';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Initialize Anthropic Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Generate tweet
router.post('/generate',
  [
    body('prompt').notEmpty().trim()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { prompt } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Generate tweet using Claude
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        temperature: 0.9, // Increase temperature for more variety
        system: 'You are a social media expert who creates engaging tweets. IMPORTANT: Keep tweets STRICTLY under 280 characters including spaces and punctuation. Make them engaging, concise, and unique. Add emojis where appropriate.',
        messages: [
          { role: 'user', content: `${prompt}\n\nIMPORTANT: Generate a unique tweet, don't repeat previous tweets.` }
        ]
      });

      const generatedContent = message.content[0].type === 'text' 
        ? message.content[0].text.trim() 
        : '';

      // Ensure content is within Twitter's character limit
      const tweetContent = generatedContent.length > 280 
        ? generatedContent.substring(0, 277) + '...' 
        : generatedContent;

      // Save as draft
      try {
        const tweet = await prisma.tweet.create({
          data: {
            userId,
            content: tweetContent,
            status: 'draft' // lowercase to match schema default
          }
        });

        res.json({ 
          content: tweetContent,
          tweetId: tweet.id 
        });
      } catch (dbError: any) {
        console.error('Database error when saving tweet:', dbError);
        
        // If it's a unique constraint error, just return the generated content without saving
        if (dbError.code === 'P2002') {
          res.json({ 
            content: tweetContent,
            tweetId: null,
            warning: 'Tweet generated but not saved (possible duplicate)' 
          });
        } else {
          throw dbError;
        }
      }
    } catch (error) {
      console.error('Tweet generation error:', error);
      res.status(500).json({ error: 'Failed to generate tweet' });
    }
  }
);

// Schedule a tweet
router.post('/schedule',
  [
    body('content').notEmpty().trim().isLength({ max: 280 }),
    body('scheduledFor').optional().isISO8601(),
    body('aiGenerated').optional().isBoolean()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { content, scheduledFor, aiGenerated, prompt } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Create tweet
      const tweet = await prisma.tweet.create({
        data: {
          userId,
          content,
          status: scheduledFor ? 'scheduled' : 'draft',
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null
        }
      });

      res.json({ 
        message: scheduledFor ? 'Tweet scheduled successfully' : 'Tweet saved as draft',
        tweet 
      });
    } catch (error) {
      console.error('Tweet scheduling error:', error);
      res.status(500).json({ error: 'Failed to schedule tweet' });
    }
  }
);

// Get user's tweets
router.get('/tweets', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status, limit = 20, offset = 0 } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const tweets = await prisma.tweet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.tweet.count({ where });

    res.json({ tweets, total, limit: Number(limit), offset: Number(offset) });
  } catch (error) {
    console.error('Get tweets error:', error);
    res.status(500).json({ error: 'Failed to fetch tweets' });
  }
});

// Get scheduled tweets
router.get('/scheduled', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { limit = 20, offset = 0 } = req.query;

    const tweets = await prisma.tweet.findMany({
      where: { 
        userId,
        status: 'SCHEDULED'
      },
      orderBy: { scheduledFor: 'asc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.tweet.count({ 
      where: { userId, status: 'SCHEDULED' } 
    });

    res.json({ tweets, total });
  } catch (error) {
    console.error('Get scheduled tweets error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled tweets' });
  }
});

// Get tweet history
router.get('/history', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { limit = 20, offset = 0 } = req.query;

    const tweets = await prisma.tweet.findMany({
      where: { 
        userId,
        status: { in: ['PUBLISHED', 'FAILED'] }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.tweet.count({ 
      where: { 
        userId,
        status: { in: ['PUBLISHED', 'FAILED'] }
      } 
    });

    res.json({ tweets, total });
  } catch (error) {
    console.error('Get tweet history error:', error);
    res.status(500).json({ error: 'Failed to fetch tweet history' });
  }
});

// Update tweet
router.put('/tweets/:id',
  [
    body('content').optional().isLength({ max: 280 }),
    body('scheduledFor').optional().isISO8601()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { content, scheduledFor } = req.body;

      const tweet = await prisma.tweet.findFirst({
        where: { id, userId }
      });

      if (!tweet) {
        res.status(404).json({ error: 'Tweet not found' });
        return;
      }

      if (tweet.status === 'PUBLISHED') {
        res.status(400).json({ error: 'Cannot edit published tweets' });
        return;
      }

      const updatedTweet = await prisma.tweet.update({
        where: { id },
        data: {
          content: content || tweet.content,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : tweet.scheduledFor,
          status: scheduledFor ? 'SCHEDULED' : tweet.status
        }
      });

      res.json({ tweet: updatedTweet });
    } catch (error) {
      console.error('Update tweet error:', error);
      res.status(500).json({ error: 'Failed to update tweet' });
    }
  }
);

// Delete tweet
router.delete('/tweets/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const tweet = await prisma.tweet.findFirst({
      where: { id, userId }
    });

    if (!tweet) {
      res.status(404).json({ error: 'Tweet not found' });
      return;
    }

    if (tweet.status === 'PUBLISHED') {
      res.status(400).json({ error: 'Cannot delete published tweets' });
      return;
    }

    await prisma.tweet.delete({ where: { id } });

    res.json({ message: 'Tweet deleted successfully' });
  } catch (error) {
    console.error('Delete tweet error:', error);
    res.status(500).json({ error: 'Failed to delete tweet' });
  }
});

// Publish tweet handler function
const publishTweetHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const tweet = await prisma.tweet.findFirst({
      where: { id, userId }
    });

    if (!tweet) {
      res.status(404).json({ error: 'Tweet not found' });
      return;
    }

    if (tweet.status === 'PUBLISHED') {
      res.status(400).json({ error: 'Tweet already published' });
      return;
    }

    // Check if Twitter credentials are configured
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET || 
        !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_TOKEN_SECRET) {
      res.status(503).json({ 
        error: 'Twitter API credentials not configured. Please add Twitter API keys to your environment variables.' 
      });
      return;
    }

    // Initialize Twitter client with environment variables
    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    });

    // Post tweet
    const { data } = await twitterClient.v2.tweet(tweet.content);

    // Update tweet status
    const updatedTweet = await prisma.tweet.update({
      where: { id },
      data: {
        status: 'published',
        postedAt: new Date(),
        twitterId: data.id
      }
    });

    res.json({ tweet: updatedTweet, twitterData: data });
  } catch (error: any) {
    console.error('Publish tweet error:', error);
    console.error('Error details:', error.message, error.data);
    
    // Mark as failed
    await prisma.tweet.update({
      where: { id: req.params.id },
      data: { status: 'failed' }
    });

    // Provide more specific error message
    let errorMessage = 'Failed to publish tweet';
    
    if (error.code === 403 && error.data?.detail?.includes('oauth1 app permissions')) {
      errorMessage = 'Twitter app needs "Read and Write" permissions. Please update your app permissions in the Twitter Developer Portal.';
    } else if (error.data?.detail) {
      errorMessage = error.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(error.code || 500).json({ error: errorMessage });
  }
};

// Publish tweet routes (support both POST and PUT)
router.post('/tweets/:id/publish', publishTweetHandler);
router.put('/tweets/:id/publish', publishTweetHandler);

// Delete tweet (alias for frontend compatibility)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const tweet = await prisma.tweet.findFirst({
      where: { id, userId }
    });

    if (!tweet) {
      res.status(404).json({ error: 'Tweet not found' });
      return;
    }

    if (tweet.status === 'PUBLISHED') {
      res.status(400).json({ error: 'Cannot delete published tweets' });
      return;
    }

    await prisma.tweet.delete({ where: { id } });

    res.json({ message: 'Tweet deleted successfully' });
  } catch (error) {
    console.error('Delete tweet error:', error);
    res.status(500).json({ error: 'Failed to delete tweet' });
  }
});

export default router;