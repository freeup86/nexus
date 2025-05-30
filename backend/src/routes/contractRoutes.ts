import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';
import Anthropic from '@anthropic-ai/sdk';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const router = Router();
const prisma = new PrismaClient();

// Initialize Anthropic Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/contracts');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed'));
    }
  }
});

// Extract text from document
async function extractTextFromDocument(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (ext === '.docx' || ext === '.doc') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  
  throw new Error('Unsupported file type');
}

// Analyze contract using AI
async function analyzeContract(text: string): Promise<any> {
  // Check if API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not configured');
    throw new Error('AI service not configured. Please set ANTHROPIC_API_KEY in environment variables.');
  }

  console.log('Analyzing contract with Claude, text length:', text.length);

  const systemPrompt = `You are a legal document analyzer. Analyze the following contract and provide your response ONLY as valid JSON, with no additional text or explanation.

Analyze the contract for:
1. A brief summary (2-3 sentences)
2. Key terms and conditions (list the most important ones)
3. Potential risks or concerns
4. Important obligations for each party
5. Important dates and deadlines
6. A plain English explanation of what this contract means

Return ONLY this JSON structure with no other text:
{
  "summary": "Brief summary here",
  "keyTerms": ["term1", "term2", ...],
  "risks": ["risk1", "risk2", ...],
  "obligations": {
    "party1": ["obligation1", "obligation2", ...],
    "party2": ["obligation1", "obligation2", ...]
  },
  "importantDates": [
    {"date": "date string", "description": "what happens on this date"}
  ],
  "plainEnglish": "Plain English explanation here"
}

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no explanations.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        { 
          role: 'user', 
          content: `Analyze this contract (uploaded at ${new Date().toISOString()}):\n\n${text.substring(0, 10000)}` 
        } // Limit text length with timestamp to prevent caching
      ]
    });

    console.log('Claude API response received');

    const response = message.content[0].type === 'text' ? message.content[0].text : null;
    if (!response) {
      throw new Error('No response from AI');
    }

    // Try to parse the JSON response
    try {
      // Sometimes Claude wraps JSON in markdown code blocks
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      console.log('Contract analysis completed successfully');
      
      // Transform obligations from object to array format for frontend compatibility
      if (parsed.obligations && typeof parsed.obligations === 'object' && !Array.isArray(parsed.obligations)) {
        const obligationsArray: string[] = [];
        for (const [party, obligations] of Object.entries(parsed.obligations)) {
          if (Array.isArray(obligations)) {
            obligations.forEach((obligation: string) => {
              obligationsArray.push(`${party}: ${obligation}`);
            });
          }
        }
        parsed.obligations = obligationsArray;
      }
      
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON.');
      console.error('Raw response:', response);
      console.error('Parse error:', parseError);
      
      // Try to extract JSON from the response if it's mixed with text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extracted = JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted JSON from response');
          
          // Transform obligations from object to array format for frontend compatibility
          if (extracted.obligations && typeof extracted.obligations === 'object' && !Array.isArray(extracted.obligations)) {
            const obligationsArray: string[] = [];
            for (const [party, obligations] of Object.entries(extracted.obligations)) {
              if (Array.isArray(obligations)) {
                obligations.forEach((obligation: string) => {
                  obligationsArray.push(`${party}: ${obligation}`);
                });
              }
            }
            extracted.obligations = obligationsArray;
          }
          
          return extracted;
        } catch (e) {
          console.error('Failed to extract JSON from response');
        }
      }
      
      throw new Error('AI response was not in expected JSON format');
    }
  } catch (error: any) {
    console.error('Claude API error:', error.message);
    if (error.status === 401) {
      throw new Error('Invalid API key. Please check your ANTHROPIC_API_KEY.');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }
}

// Upload and analyze contract
router.post('/analyze', upload.single('contract'), async (req: AuthRequest, res): Promise<void> => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Extract text from document
    const extractedText = await extractTextFromDocument(req.file.path);

    // Create contract record
    const contract = await prisma.contract.create({
      data: {
        userId,
        filename: req.file.originalname,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.path,
        status: 'pending'
      }
    });

    try {
      // Analyze contract
      const analysis = await analyzeContract(extractedText);
      const processingTime = Date.now() - startTime;

      // Update contract with analysis
      await prisma.contract.update({
        where: { id: contract.id },
        data: {
          status: 'completed',
          summary: analysis.summary,
          keyTerms: analysis.keyTerms,
          risks: analysis.risks,
          obligations: analysis.obligations,
          aiAnalysis: {
            plainEnglish: analysis.plainEnglish,
            importantDates: analysis.importantDates,
            aiModel: 'claude-3-haiku-20240307',
            processingTime
          }
        }
      });

      res.json({
        contract: {
          id: contract.id,
          fileName: contract.filename,
          fileType: contract.mimeType,
          fileSize: contract.fileSize,
          createdAt: contract.createdAt
        },
        analysis: {
          summary: analysis.summary,
          keyTerms: analysis.keyTerms,
          risks: analysis.risks,
          obligations: analysis.obligations,
          importantDates: analysis.importantDates,
          plainEnglish: analysis.plainEnglish,
          processingTime
        }
      });
    } catch (error) {
      // Update contract with error
      await prisma.contract.update({
        where: { id: contract.id },
        data: { status: 'FAILED' }
      });
      throw error;
    }
  } catch (error) {
    console.error('Contract analysis error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to analyze contract' 
    });
  }
});

// Get contract history
router.get('/history', async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { limit = 20, offset = 0 } = req.query;

    const contracts = await prisma.contract.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        status: true,
        createdAt: true,
        summary: true,
        aiAnalysis: true
      }
    });

    const total = await prisma.contract.count({ where: { userId } });

    res.json({
      contracts,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Get contract history error:', error);
    res.status(500).json({ error: 'Failed to fetch contract history' });
  }
});

// Get specific contract analysis
router.get('/contract/:id', async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const contract = await prisma.contract.findFirst({
      where: { id, userId }
    });

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    if (!contract.aiAnalysis) {
      res.status(404).json({ error: 'Analysis not found' });
      return;
    }

    res.json({
      contract: {
        id: contract.id,
        fileName: contract.filename,
        fileType: contract.mimeType,
        fileSize: contract.fileSize,
        createdAt: contract.createdAt
      },
      analysis: {
        summary: contract.summary || '',
        keyTerms: contract.keyTerms ? JSON.parse(contract.keyTerms) : [],
        risks: contract.risks ? JSON.parse(contract.risks) : [],
        obligations: contract.obligations ? JSON.parse(contract.obligations) : [],
        importantDates: contract.dates ? JSON.parse(contract.dates) : [],
        plainEnglish: contract.summary || '',
        aiModel: 'gpt-4',
        processingTime: 0,
        createdAt: contract.updatedAt
      }
    });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

// Download original contract
router.get('/contract/:id/download', async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const contract = await prisma.contract.findFirst({
      where: { id, userId }
    });

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    res.download(contract.filePath, contract.filename);
  } catch (error) {
    console.error('Download contract error:', error);
    res.status(500).json({ error: 'Failed to download contract' });
  }
});

// Delete contract
router.delete('/contract/:id', async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const contract = await prisma.contract.findFirst({
      where: { id, userId }
    });

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    // Delete file
    try {
      await fs.unlink(contract.filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }

    // Delete records (analysis will be cascade deleted)
    await prisma.contract.delete({ where: { id } });

    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Delete contract error:', error);
    res.status(500).json({ error: 'Failed to delete contract' });
  }
});

export default router;