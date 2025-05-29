import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/authSimple';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const router = Router();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|md/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                     file.mimetype === 'text/plain' || 
                     file.mimetype === 'text/markdown';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word documents, and text files are allowed.'));
    }
  }
});

// Extract text from different file types
async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  try {
    if (mimeType === 'application/pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               mimeType === 'application/msword') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else {
      // Plain text, markdown, etc.
      return await fs.readFile(filePath, 'utf-8');
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error('Failed to extract text from file');
  }
}

// Generate summary using Claude
async function generateSummary(
  text: string, 
  summaryType: string, 
  customPrompt?: string
): Promise<{ summary: string; keyPoints?: string[]; wordCount: number }> {
  
  let prompt = '';
  
  switch (summaryType) {
    case 'brief':
      prompt = `Provide a brief summary (2-3 paragraphs) of the following text. Focus on the main ideas and key takeaways:\n\n${text}`;
      break;
    case 'detailed':
      prompt = `Provide a detailed summary of the following text. Include all major points, supporting details, and conclusions. Aim for about 25% of the original length:\n\n${text}`;
      break;
    case 'bullets':
      prompt = `Summarize the following text as a bulleted list. Include all key points and organize them logically:\n\n${text}`;
      break;
    case 'key-points':
      prompt = `Extract only the most important key points from the following text. List 5-10 essential takeaways:\n\n${text}`;
      break;
    default:
      prompt = `Summarize the following text:\n\n${text}`;
  }

  if (customPrompt) {
    prompt = `${prompt}\n\nAdditional instructions: ${customPrompt}`;
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const summary = response.content[0].type === 'text' ? response.content[0].text : '';
    const wordCount = summary.split(/\s+/).length;

    // Extract key points if it's a key-points summary
    let keyPoints: string[] | undefined;
    if (summaryType === 'key-points' || summaryType === 'bullets') {
      keyPoints = summary
        .split('\n')
        .filter(line => line.trim().length > 0)
        .filter(line => line.match(/^[-•*]\s/) || line.match(/^\d+\./))
        .map(line => line.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '').trim());
    }

    return { summary, keyPoints, wordCount };
  } catch (error) {
    console.error('Error generating summary:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
    throw new Error('Failed to generate summary');
  }
}

// Summarize document endpoint
router.post('/summarize',
  upload.single('file'),
  [
    body('text').optional().isString(),
    body('summaryType').isIn(['brief', 'detailed', 'bullets', 'key-points']),
    body('customPrompt').optional().isString().isLength({ max: 500 })
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Log request details for debugging
      console.log('Document summarize request:', {
        hasFile: !!req.file,
        hasText: !!req.body.text,
        summaryType: req.body.summaryType,
        bodyKeys: Object.keys(req.body)
      });

      const { text, summaryType, customPrompt } = req.body;
      let contentToSummarize = '';
      let filePath = '';

      // Handle file upload or direct text input
      if (req.file) {
        filePath = req.file.path;
        contentToSummarize = await extractTextFromFile(filePath, req.file.mimetype);
      } else if (text) {
        contentToSummarize = text;
      } else {
        res.status(400).json({ error: 'No file or text provided' });
        return;
      }

      // Check if content is not empty
      if (!contentToSummarize.trim()) {
        res.status(400).json({ error: 'No text content found to summarize' });
        return;
      }

      // Limit text length to prevent excessive API usage
      const maxLength = 50000; // characters
      if (contentToSummarize.length > maxLength) {
        contentToSummarize = contentToSummarize.substring(0, maxLength) + '...';
      }

      // Generate summary
      const result = await generateSummary(contentToSummarize, summaryType, customPrompt);

      // Clean up uploaded file
      if (filePath) {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error('Error deleting temporary file:', error);
        }
      }

      res.json({
        success: true,
        summary: result.summary,
        keyPoints: result.keyPoints,
        wordCount: result.wordCount,
        originalLength: contentToSummarize.length,
        summaryType
      });

    } catch (error: any) {
      console.error('Document summarization error:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      console.error('Error stack:', error.stack);
      
      // Clean up uploaded file on error
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting temporary file:', unlinkError);
        }
      }

      // Provide more detailed error information
      const errorMessage = error.message || 'Unknown error occurred';
      const errorDetails = {
        error: 'Failed to summarize document',
        message: errorMessage,
        type: error.name || 'Error',
        details: error.response?.data || error.toString()
      };

      // Add specific error details for common issues
      if (errorMessage.includes('ENOENT')) {
        errorDetails.error = 'Upload directory not found';
        errorDetails.message = 'Server file system error - please contact support';
      } else if (errorMessage.includes('pdf-parse')) {
        errorDetails.error = 'PDF processing error';
        errorDetails.message = 'Failed to process PDF file';
      } else if (errorMessage.includes('mammoth')) {
        errorDetails.error = 'Word document processing error';
        errorDetails.message = 'Failed to process Word document';
      } else if (errorMessage.includes('Anthropic')) {
        errorDetails.error = 'AI service error';
        errorDetails.message = 'Failed to generate summary - AI service issue';
      }

      res.status(500).json(errorDetails);
    }
  }
);

// Test endpoint
router.get('/test', 
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const anthropicKeyExists = !!process.env.ANTHROPIC_API_KEY;
      const uploadDir = path.join(__dirname, '../../uploads/documents');
      const dirExists = await fs.access(uploadDir).then(() => true).catch(() => false);
      
      res.json({
        status: 'Document routes working',
        anthropicKeyExists,
        uploadDirExists: dirExists,
        uploadDirPath: uploadDir
      });
    } catch (error) {
      res.status(500).json({ error: 'Test failed', details: error });
    }
  }
);

// Get summary history (optional - if you want to save summaries)
router.get('/history',
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      // This would retrieve saved summaries from database
      // For now, return empty array as we're not persisting summaries
      res.json({ summaries: [] });
    } catch (error) {
      console.error('Error fetching summary history:', error);
      res.status(500).json({ error: 'Failed to fetch summary history' });
    }
  }
);

export default router;