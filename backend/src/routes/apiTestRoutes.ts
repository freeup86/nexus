import { Router } from 'express';
import { TwitterApi } from 'twitter-api-v2';
import Anthropic from '@anthropic-ai/sdk';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Test Twitter API connection
router.get('/twitter', async (_req: AuthRequest, res): Promise<void> => {
  try {
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      res.status(400).json({
        success: false,
        service: 'Twitter',
        error: 'Twitter API credentials not configured',
        details: {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          hasAccessToken: !!accessToken,
          hasAccessTokenSecret: !!accessTokenSecret
        }
      });
      return;
    }

    // Initialize Twitter client
    const twitterClient = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret
    });

    // Test the connection by getting authenticated user info
    const { data: user } = await twitterClient.v2.me();

    res.json({
      success: true,
      service: 'Twitter',
      message: 'Twitter API connection successful',
      details: {
        authenticatedUser: {
          id: user.id,
          name: user.name,
          username: user.username
        }
      }
    });
  } catch (error: any) {
    console.error('Twitter API test error:', error);
    res.status(500).json({
      success: false,
      service: 'Twitter',
      error: 'Failed to connect to Twitter API',
      details: error.message || error.toString()
    });
  }
});

// Test Anthropic (Claude) API connection
router.get('/anthropic', async (_req: AuthRequest, res): Promise<void> => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      res.status(400).json({
        success: false,
        service: 'Anthropic (Claude)',
        error: 'Anthropic API key not configured',
        details: {
          hasApiKey: false
        }
      });
      return;
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey
    });

    // Test the connection with a simple message
    const completion = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Respond with just "API connection successful" and nothing else.'
        }
      ]
    });

    res.json({
      success: true,
      service: 'Anthropic (Claude)',
      message: 'Anthropic API connection successful',
      details: {
        model: 'claude-3-haiku-20240307',
        response: completion.content[0].type === 'text' ? completion.content[0].text : 'Response received',
        usage: completion.usage
      }
    });
  } catch (error: any) {
    console.error('Anthropic API test error:', error);
    res.status(500).json({
      success: false,
      service: 'Anthropic (Claude)',
      error: 'Failed to connect to Anthropic API',
      details: error.message || error.toString()
    });
  }
});

// Test OpenAI API connection (bonus)
router.get('/openai', async (_req: AuthRequest, res): Promise<void> => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      res.status(400).json({
        success: false,
        service: 'OpenAI',
        error: 'OpenAI API key not configured',
        details: {
          hasApiKey: false
        }
      });
      return;
    }

    // Import OpenAI dynamically to avoid errors if not using it
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });

    // Test the connection
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Respond with just "API connection successful" and nothing else.'
        }
      ],
      max_tokens: 20
    });

    res.json({
      success: true,
      service: 'OpenAI',
      message: 'OpenAI API connection successful',
      details: {
        model: 'gpt-3.5-turbo',
        response: completion.choices[0]?.message?.content || 'Response received'
      }
    });
  } catch (error: any) {
    console.error('OpenAI API test error:', error);
    res.status(500).json({
      success: false,
      service: 'OpenAI',
      error: 'Failed to connect to OpenAI API',
      details: error.message || error.toString()
    });
  }
});

// Test all APIs at once
router.get('/all', async (req: AuthRequest, res): Promise<void> => {
  const results = [];

  // Test Twitter
  try {
    const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/test-apis/twitter`, {
      headers: {
        'Authorization': req.headers.authorization || ''
      }
    });
    const data = await response.json();
    results.push(data);
  } catch (error) {
    results.push({
      success: false,
      service: 'Twitter',
      error: 'Failed to test Twitter API'
    });
  }

  // Test Anthropic
  try {
    const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/test-apis/anthropic`, {
      headers: {
        'Authorization': req.headers.authorization || ''
      }
    });
    const data = await response.json();
    results.push(data);
  } catch (error) {
    results.push({
      success: false,
      service: 'Anthropic (Claude)',
      error: 'Failed to test Anthropic API'
    });
  }

  // Test OpenAI
  try {
    const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/test-apis/openai`, {
      headers: {
        'Authorization': req.headers.authorization || ''
      }
    });
    const data = await response.json();
    results.push(data);
  } catch (error) {
    results.push({
      success: false,
      service: 'OpenAI',
      error: 'Failed to test OpenAI API'
    });
  }

  res.json({
    timestamp: new Date().toISOString(),
    results
  });
});

export default router;