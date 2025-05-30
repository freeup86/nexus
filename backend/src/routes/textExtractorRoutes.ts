import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

// API2Convert configuration
const API2CONVERT_BASE_URL = 'https://api.api2convert.com/v2';
const API2CONVERT_KEY = process.env.API2CONVERT_KEY; // You'll need to add this to your .env file

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/text-extractions');
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
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.rtf', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: PDF, DOCX, DOC, TXT, RTF, and common image formats'));
    }
  }
});

// Helper function to create a job on API2Convert
async function createConversionJob(filePath: string, fileName: string): Promise<string> {
  if (!API2CONVERT_KEY) {
    throw new Error('API2Convert API key not configured. Please set API2CONVERT_KEY in environment variables.');
  }

  const fileBuffer = await fs.readFile(filePath);
  const fileStats = await fs.stat(filePath);
  
  // For small files (< 1MB), use base64
  if (fileStats.size < 1024 * 1024) {
    const base64Content = fileBuffer.toString('base64');
    const jobData = {
      input: [{
        type: 'base64',
        source: base64Content,
        filename: fileName
      }],
      conversion: [{
        category: 'document',
        target: 'txt'
      }]
    };

    console.log('Creating API2Convert job for small file:', fileName, '(size:', fileStats.size, 'bytes)');
    
    try {
      const jobResponse = await axios.post(`${API2CONVERT_BASE_URL}/jobs`, jobData, {
        headers: {
          'x-oc-api-key': API2CONVERT_KEY,
          'Content-Type': 'application/json'
        }
      });
      return jobResponse.data.id;
    } catch (error: any) {
      console.error('Failed to create API2Convert job:', error.response?.data || error.message);
      throw new Error(`API2Convert job creation failed: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // For larger files, we need a different approach
  // Let's use the upload endpoint with multipart form data
  console.log('Creating API2Convert job for large file:', fileName, '(size:', fileStats.size, 'bytes)');
  
  // First create a job
  const jobData = {
    conversion: [{
      category: 'document',
      target: 'txt'
    }]
  };
  
  let jobResponse;
  try {
    jobResponse = await axios.post(`${API2CONVERT_BASE_URL}/jobs`, jobData, {
      headers: {
        'x-oc-api-key': API2CONVERT_KEY,
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('Failed to create API2Convert job:', error.response?.data || error.message);
    throw new Error(`API2Convert job creation failed: ${error.response?.data?.message || error.message}`);
  }

  const jobId = jobResponse.data.id;
  
  // Now upload the file using multipart form data directly to the main API
  const FormData = require('form-data');
  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: fileName,
    contentType: 'application/octet-stream'
  });

  try {
    await axios.post(`${API2CONVERT_BASE_URL}/jobs/${jobId}/input`, formData, {
      headers: {
        'x-oc-api-key': API2CONVERT_KEY,
        ...formData.getHeaders()
      }
    });
    
    return jobId;
  } catch (error: any) {
    console.error('Failed to upload file:', error.response?.data || error.message);
    
    // If multipart upload fails, fall back to telling user file is too large
    if (error.response?.status === 404) {
      throw new Error('File is too large for text extraction. Please try a smaller file (under 1MB for base64 encoding).');
    }
    throw new Error(`File upload failed: ${error.response?.data?.message || error.message}`);
  }
}

// Helper function to check job status and get results
async function getJobResults(jobId: string): Promise<string> {
  if (!API2CONVERT_KEY) {
    throw new Error('API2Convert API key not configured');
  }

  // Poll job status
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  
  while (attempts < maxAttempts) {
    const jobResponse = await axios.get(`${API2CONVERT_BASE_URL}/jobs/${jobId}`, {
      headers: {
        'x-oc-api-key': API2CONVERT_KEY
      }
    });

    const status = jobResponse.data.status.code;
    
    if (status === 'completed') {
      // Get output files
      const outputResponse = await axios.get(`${API2CONVERT_BASE_URL}/jobs/${jobId}/output`, {
        headers: {
          'x-oc-api-key': API2CONVERT_KEY
        }
      });

      const outputs = outputResponse.data;
      if (outputs && outputs.length > 0) {
        const textFile = outputs[0];
        
        // Download the converted text file
        const downloadResponse = await axios.get(textFile.uri, {
          responseType: 'text',
          timeout: 60000
        });
        
        return downloadResponse.data;
      } else {
        throw new Error('No output files generated');
      }
    } else if (status === 'failed') {
      const errors = jobResponse.data.errors || [];
      const errorMessage = errors.length > 0 ? errors[0].message : 'Conversion failed';
      throw new Error(`Conversion failed: ${errorMessage}`);
    }
    
    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }
  
  throw new Error('Conversion timed out after 5 minutes');
}

// Extract text using API2Convert
async function extractTextUsingApi2Convert(filePath: string, fileName: string): Promise<string> {
  try {
    const jobId = await createConversionJob(filePath, fileName);
    const extractedText = await getJobResults(jobId);
    return extractedText;
  } catch (error) {
    console.error('API2Convert error:', error);
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Main text extraction function with fallbacks
async function extractText(filePath: string, fileName: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  
  // For plain text files, read directly
  if (ext === '.txt') {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error('Failed to read text file');
    }
  }
  
  // For PDF files, use pdf-parse library
  if (ext === '.pdf') {
    try {
      console.log('Attempting to parse PDF:', fileName);
      const pdfParse = require('pdf-parse');
      const dataBuffer = await fs.readFile(filePath);
      console.log('PDF file read, size:', dataBuffer.length, 'bytes');
      const data = await pdfParse(dataBuffer);
      console.log('PDF parsed successfully, text length:', data.text.length);
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // For DOCX files, use mammoth library
  if (ext === '.docx') {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('DOCX parsing error:', error);
      // Fall back to API2Convert
    }
  }
  
  // For RTF files, try simple extraction first
  if (ext === '.rtf') {
    try {
      const rtfContent = await fs.readFile(filePath, 'utf-8');
      // Remove RTF formatting (basic approach)
      const cleanText = rtfContent.replace(/\\[a-z]+\d*\s?|\{|\}/g, '').trim();
      if (cleanText.length > 50) { // If we got reasonable text, use it
        return cleanText;
      }
    } catch (error) {
      // If simple extraction fails, continue to API2Convert
    }
  }
  
  // For very small files or when local parsing fails, try API2Convert
  const fileStats = await fs.stat(filePath);
  if (fileStats.size < 3000) { // Very small files only
    try {
      return await extractTextUsingApi2Convert(filePath, fileName);
    } catch (error) {
      console.error('API2Convert failed:', error);
    }
  }
  
  // For image files, use Tesseract.js for OCR
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp'];
  if (imageExtensions.includes(ext)) {
    try {
      console.log('Attempting OCR on image:', fileName);
      const Tesseract = require('tesseract.js');
      
      // Perform OCR directly - newer API doesn't require manual worker management
      const { data: { text } } = await Tesseract.recognize(
        filePath,
        'eng',
        {
          logger: (info: any) => console.log('OCR Progress:', Math.round(info.progress * 100) + '%')
        }
      );
      
      console.log('OCR completed successfully, text length:', text.length);
      return text.trim();
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // If all else fails, throw error
  throw new Error(`Unable to extract text from ${fileName}. File type ${ext} is not supported. Supported formats: PDF, DOCX, TXT, RTF.`);
}

// Upload and extract text
router.post('/extract', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
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

    // API2Convert is optional now since we use local libraries

    // Create extraction record
    const extraction = await prisma.textExtraction.create({
      data: {
        userId,
        filename: req.file.originalname,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.path,
        extractedText: '',
        processingTime: 0
      }
    });

    try {
      console.log('Starting text extraction for:', req.file.originalname);
      
      // Extract text
      const extractedText = await extractText(req.file.path, req.file.originalname);
      const processingTime = Date.now() - startTime;
      
      console.log('Text extraction completed. Length:', extractedText.length, 'Processing time:', processingTime, 'ms');
      
      // Determine extraction method
      const ext = path.extname(req.file.originalname).toLowerCase();
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp'];
      let extractionMethod = 'unknown';
      if (ext === '.pdf') extractionMethod = 'pdf-parse';
      else if (ext === '.docx') extractionMethod = 'mammoth';
      else if (ext === '.txt') extractionMethod = 'direct-read';
      else if (ext === '.rtf') extractionMethod = 'rtf-parse';
      else if (imageExtensions.includes(ext)) extractionMethod = 'tesseract-ocr';
      else if (req.file.size < 3000) extractionMethod = 'api2convert';

      // Update extraction record
      const updatedExtraction = await prisma.textExtraction.update({
        where: { id: extraction.id },
        data: {
          extractedText,
          processingTime,
          metadata: JSON.stringify({
            wordCount: extractedText.split(/\s+/).length,
            characterCount: extractedText.length,
            extractionMethod,
            fileExtension: ext,
            locallyProcessed: extractionMethod !== 'api2convert'
          })
        }
      });

      console.log('Sending successful response for extraction:', updatedExtraction.id);
      
      res.json({
        extraction: {
          id: updatedExtraction.id,
          fileName: updatedExtraction.filename,
          fileType: updatedExtraction.mimeType,
          fileSize: updatedExtraction.fileSize,
          extractedText: updatedExtraction.extractedText,
          processingTime: updatedExtraction.processingTime,
          status: 'completed',
          metadata: JSON.parse(updatedExtraction.metadata || '{}'),
          createdAt: updatedExtraction.createdAt
        }
      });
    } catch (error) {
      // Update extraction with error
      await prisma.textExtraction.update({
        where: { id: extraction.id },
        data: {
          metadata: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
          }),
          processingTime: Date.now() - startTime
        }
      });
      throw error;
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      file: req.file?.originalname,
      fileType: req.file?.mimetype,
      apiKeyConfigured: !!API2CONVERT_KEY
    });
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to extract text' 
    });
  }
});

// Get extraction history
router.get('/history', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { limit = 20, offset = 0 } = req.query;

    const extractions = await prisma.textExtraction.findMany({
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
        processingTime: true,
        createdAt: true,
        metadata: true
      }
    });

    const total = await prisma.textExtraction.count({ where: { userId } });

    res.json({
      extractions: extractions.map(ext => {
        // Determine status based on multiple factors
        let status = 'processing';
        if (ext.processingTime && ext.processingTime > 0) {
          status = 'completed';
        }
        
        return {
          ...ext,
          status,
          metadata: ext.metadata ? JSON.parse(ext.metadata) : null
        };
      }),
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Get extraction history error:', error);
    res.status(500).json({ error: 'Failed to fetch extraction history' });
  }
});

// Get specific extraction
router.get('/extraction/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const extraction = await prisma.textExtraction.findFirst({
      where: { id, userId }
    });

    if (!extraction) {
      res.status(404).json({ error: 'Extraction not found' });
      return;
    }

    // Determine status
    let status = 'processing';
    if (extraction.processingTime && extraction.processingTime > 0) {
      status = 'completed';
    }

    res.json({
      extraction: {
        ...extraction,
        status,
        metadata: extraction.metadata ? JSON.parse(extraction.metadata) : null
      }
    });
  } catch (error) {
    console.error('Get extraction error:', error);
    res.status(500).json({ error: 'Failed to fetch extraction' });
  }
});

// Delete extraction
router.delete('/extraction/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const extraction = await prisma.textExtraction.findFirst({
      where: { id, userId }
    });

    if (!extraction) {
      res.status(404).json({ error: 'Extraction not found' });
      return;
    }

    // Delete file
    try {
      await fs.unlink(extraction.filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }

    // Delete record
    await prisma.textExtraction.delete({ where: { id } });

    res.json({ message: 'Extraction deleted successfully' });
  } catch (error) {
    console.error('Delete extraction error:', error);
    res.status(500).json({ error: 'Failed to delete extraction' });
  }
});

// Debug and fix stuck extractions
router.post('/fix-stuck', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    // Get all extractions for debugging
    const allExtractions = await prisma.textExtraction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('Recent extractions for user:', userId);
    allExtractions.forEach(ext => {
      console.log(`ID: ${ext.id}, ProcessingTime: ${ext.processingTime}, TextLength: ${ext.extractedText.length}, Created: ${ext.createdAt}`);
    });

    // Find extractions that need fixing
    const stuckExtractions = await prisma.textExtraction.findMany({
      where: {
        userId,
        OR: [
          { processingTime: null },
          { processingTime: 0 }
        ]
      }
    });

    // Update them with a default processing time
    const updatePromises = stuckExtractions.map(extraction =>
      prisma.textExtraction.update({
        where: { id: extraction.id },
        data: { processingTime: 1000 } // Default 1 second
      })
    );

    await Promise.all(updatePromises);

    res.json({
      message: `Fixed ${stuckExtractions.length} stuck extractions`,
      fixed: stuckExtractions.length,
      debugInfo: allExtractions.map(ext => ({
        id: ext.id.substring(0, 8),
        processingTime: ext.processingTime,
        textLength: ext.extractedText.length,
        hasText: ext.extractedText.length > 0
      }))
    });
  } catch (error) {
    console.error('Fix stuck extractions error:', error);
    res.status(500).json({ error: 'Failed to fix stuck extractions' });
  }
});

export default router;