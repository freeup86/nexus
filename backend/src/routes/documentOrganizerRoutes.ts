import { Router, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import Tesseract from 'tesseract.js';
import pdf from 'pdf-parse';
import sharp from 'sharp';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const prisma = new PrismaClient();

// Initialize Anthropic for AI processing only if API key exists
const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Multer configuration for document uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|heic/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: JPEG, PNG, PDF, DOC, DOCX, XLS, XLSX, TXT, HEIC'));
    }
  }
});

// Validation middleware
const validateRequest = (req: AuthRequest, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Upload documents
router.post('/upload',
  upload.array('documents', 10),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
      }

      const documents = await Promise.all(
        files.map(async (file) => {
          const document = await prisma.document.create({
            data: {
              userId,
              filename: file.filename,
              originalName: file.originalname,
              filePath: file.path,
              fileType: file.mimetype,
              fileSize: file.size,
              status: 'processing'
            }
          });

          // Process document asynchronously
          processDocument(document.id, file).catch(console.error);

          return document;
        })
      );

      res.json({ 
        message: 'Documents uploaded successfully',
        documents: documents.map(doc => ({
          id: doc.id,
          filename: doc.originalName,
          status: doc.status
        }))
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload documents' });
    }
  }
);

// Get user's documents
router.get('/documents',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().trim(),
    query('search').optional().trim(),
    query('status').optional().isIn(['processing', 'completed', 'failed'])
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const { category, search, status } = req.query;

      const where: any = { userId };
      
      if (status) {
        where.status = status;
      }

      if (category) {
        where.categories = {
          some: {
            category: {
              name: category
            }
          }
        };
      }

      if (search) {
        where.OR = [
          { originalName: { contains: search as string, mode: 'insensitive' } },
          { extractedText: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          include: {
            categories: {
              include: {
                category: true
              }
            },
            tags: {
              include: {
                tag: true
              }
            },
            extractedData: true,
            reminders: {
              where: {
                completed: false,
                reminderDate: { gte: new Date() }
              },
              orderBy: { reminderDate: 'asc' },
              take: 1
            }
          },
          orderBy: { uploadDate: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.document.count({ where })
      ]);

      res.json({
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }
);

// Get single document
router.get('/documents/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const document = await prisma.document.findFirst({
        where: { id, userId },
        include: {
          categories: {
            include: {
              category: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          extractedData: true,
          reminders: {
            orderBy: { reminderDate: 'asc' }
          }
        }
      });

      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      res.json({ document });
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }
);

// Update document
router.put('/documents/:id',
  [
    param('id').isUUID(),
    body('categories').optional().isArray(),
    body('tags').optional().isArray(),
    body('customData').optional().isObject()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { categories, tags, customData } = req.body;

      // Verify ownership
      const document = await prisma.document.findFirst({
        where: { id, userId }
      });

      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      // Update categories if provided
      if (categories) {
        // Remove existing manual categories
        await prisma.documentCategory.deleteMany({
          where: { documentId: id, isManual: true }
        });

        // Add new categories
        for (const categoryName of categories) {
          const category = await prisma.category.findFirst({
            where: { 
              OR: [
                { name: categoryName, isSystem: true },
                { name: categoryName, userId }
              ]
            }
          });

          if (category) {
            await prisma.documentCategory.create({
              data: {
                documentId: id,
                categoryId: category.id,
                isManual: true
              }
            });
          }
        }
      }

      // Update tags if provided
      if (tags) {
        // Remove existing tags
        await prisma.documentTag.deleteMany({
          where: { documentId: id }
        });

        // Add new tags
        for (const tagName of tags) {
          const tag = await prisma.tag.upsert({
            where: {
              name_userId: {
                name: tagName,
                userId
              }
            },
            update: {},
            create: {
              name: tagName,
              userId
            }
          });

          await prisma.documentTag.create({
            data: {
              documentId: id,
              tagId: tag.id
            }
          });
        }
      }

      // Update custom data if provided
      if (customData) {
        for (const [fieldName, fieldValue] of Object.entries(customData)) {
          await prisma.documentData.upsert({
            where: {
              documentId_fieldName: {
                documentId: id,
                fieldName
              }
            },
            update: {
              fieldValue: String(fieldValue),
              fieldType: typeof fieldValue === 'number' ? 'number' : 'text'
            },
            create: {
              documentId: id,
              fieldName,
              fieldValue: String(fieldValue),
              fieldType: typeof fieldValue === 'number' ? 'number' : 'text'
            }
          });
        }
      }

      // Fetch updated document
      const updatedDocument = await prisma.document.findFirst({
        where: { id },
        include: {
          categories: {
            include: {
              category: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          extractedData: true
        }
      });

      res.json({ document: updatedDocument });
    } catch (error) {
      console.error('Update document error:', error);
      res.status(500).json({ error: 'Failed to update document' });
    }
  }
);

// Delete document
router.delete('/documents/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      // Verify ownership
      const document = await prisma.document.findFirst({
        where: { id, userId }
      });

      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      // Delete file
      try {
        await fs.unlink(document.filePath);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }

      // Delete document (cascades to related records)
      await prisma.document.delete({
        where: { id }
      });

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }
);

// Search documents with natural language
router.post('/documents/search',
  [body('query').notEmpty().trim()],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { query } = req.body;
      
      // Simple keyword search without AI
      // Split query into keywords and search in document names and content
      const keywords = query.split(' ').filter(k => k.length > 0);

      // Build database query
      const where: any = { userId };
      
      if (keywords?.length > 0) {
        where.OR = keywords.map((keyword: string) => ({
          OR: [
            { originalName: { contains: keyword, mode: 'insensitive' } },
            { extractedText: { contains: keyword, mode: 'insensitive' } }
          ]
        }));
      }

      const documents = await prisma.document.findMany({
        where,
        include: {
          categories: {
            include: {
              category: true
            }
          },
          extractedData: true
        },
        orderBy: { uploadDate: 'desc' },
        take: 50
      });

      res.json({ 
        documents,
        query,
        keywords
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to search documents' });
    }
  }
);

// Ask questions about documents using AI
router.post('/documents/ask',
  [body('question').notEmpty().trim()],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { question } = req.body;

      if (!anthropic) {
        res.status(503).json({ error: 'AI service is not available' });
        return;
      }

      // Get all user documents with extracted data
      const documents = await prisma.document.findMany({
        where: { 
          userId,
          status: 'completed'
        },
        include: {
          extractedData: true,
          categories: {
            include: {
              category: true
            }
          }
        },
        orderBy: { uploadDate: 'desc' }
      });

      if (documents.length === 0) {
        res.json({
          answer: 'I don\'t have any documents to analyze. Please upload some documents first.',
          relevantDocuments: [],
          question
        });
        return;
      }

      // Prepare document data for AI analysis
      const documentData = documents.map(doc => {
        const extractedFields = doc.extractedData.reduce((acc, data) => {
          acc[data.fieldName] = data.fieldValue;
          return acc;
        }, {} as Record<string, string>);

        const categories = doc.categories.map(cat => cat.category.name).join(', ');

        return {
          id: doc.id,
          filename: doc.originalName,
          categories,
          uploadDate: doc.uploadDate.toISOString().split('T')[0],
          extractedData: extractedFields,
          textPreview: doc.extractedText?.substring(0, 500) || ''
        };
      });

      // Use AI to answer the question
      const prompt = `You are an AI assistant that analyzes document data to answer user questions. 

User Question: "${question}"

Document Data:
${JSON.stringify(documentData, null, 2)}

Please analyze the documents and provide a helpful answer to the user's question. If the question is about financial data (like taxes, expenses, amounts), try to calculate totals or provide specific amounts found in the documents. If you cannot find relevant information, let the user know what types of documents might help answer their question.

Also, mention which specific documents were most relevant to your answer (use the filename and upload date).

Format your response as JSON with this structure:
{
  "answer": "Your detailed answer here",
  "relevantDocuments": ["document1.pdf", "document2.pdf"],
  "calculations": "Any calculations performed (if applicable)",
  "suggestions": "Suggestions for additional documents that might help (if needed)"
}`;

      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.3,
        system: 'You are a helpful document analysis assistant. Always respond with valid JSON only.',
        messages: [
          { role: 'user', content: prompt }
        ]
      });

      let aiResponse;
      try {
        const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
        aiResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Fallback response
        aiResponse = {
          answer: "I found your documents but had trouble analyzing them. Please try rephrasing your question.",
          relevantDocuments: [],
          calculations: null,
          suggestions: null
        };
      }

      res.json({
        question,
        answer: aiResponse.answer,
        relevantDocuments: aiResponse.relevantDocuments || [],
        calculations: aiResponse.calculations,
        suggestions: aiResponse.suggestions,
        totalDocuments: documents.length
      });

    } catch (error) {
      console.error('Question answering error:', error);
      res.status(500).json({ error: 'Failed to process question' });
    }
  }
);

// Get document analytics
router.get('/analytics',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Total documents
      const totalDocuments = await prisma.document.count({ where: { userId } });
      
      // Documents by category
      let documentsByCategory: any[] = [];
      try {
        // @ts-ignore
        documentsByCategory = await prisma.documentCategory.groupBy({
          by: ['categoryId'],
          where: {
            document: { userId }
          },
          _count: true
        });
      } catch (error) {
        console.error('Error fetching documents by category:', error);
      }
      
      // Recent documents
      const recentDocuments = await prisma.document.findMany({
        where: { userId },
        orderBy: { uploadDate: 'desc' },
        take: 5,
        select: {
          id: true,
          originalName: true,
          uploadDate: true
        }
      });
      
      // Upcoming reminders
      let upcomingReminders: any[] = [];
      try {
        upcomingReminders = await prisma.documentReminder.findMany({
          where: {
            document: { userId },
            completed: false,
            reminderDate: { gte: new Date() }
          },
          orderBy: { reminderDate: 'asc' },
          take: 5,
          include: {
            document: {
              select: {
                id: true,
                originalName: true
              }
            }
          }
        });
      } catch (error) {
        console.error('Error fetching upcoming reminders:', error);
      }
      
      // Documents by month
      let documentsByMonth: any[] = [];
      try {
        documentsByMonth = await prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', "uploadDate") as month,
            COUNT(*) as count
          FROM "Document"
          WHERE "userId" = ${userId}
          GROUP BY month
          ORDER BY month DESC
          LIMIT 12
        `;
      } catch (error) {
        console.error('Error fetching documents by month:', error);
      }

      // Get category names
      const categoryIds = documentsByCategory.map(c => c.categoryId);
      const categories = categoryIds.length > 0 
        ? await prisma.category.findMany({
            where: { id: { in: categoryIds } }
          })
        : [];

      const categoryMap = new Map(categories.map(c => [c.id, c.name]));
      const categoryCounts = documentsByCategory.map(c => ({
        category: categoryMap.get(c.categoryId) || 'Unknown',
        count: Number(c._count)
      }));

      // Convert BigInt values to numbers in documentsByMonth
      const serializedDocumentsByMonth = Array.isArray(documentsByMonth) 
        ? (documentsByMonth as any[]).map(item => ({
            month: item.month,
            count: Number(item.count)
          }))
        : [];

      res.json({
        totalDocuments,
        categoryCounts,
        recentDocuments,
        upcomingReminders,
        documentsByMonth: serializedDocumentsByMonth
      });
    } catch (error) {
      console.error('Analytics error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }
);

// Add reminder to document
router.post('/documents/:id/reminders',
  [
    param('id').isUUID(),
    body('reminderDate').isISO8601(),
    body('reminderType').isIn(['expiration', 'renewal', 'payment_due', 'custom']),
    body('description').notEmpty().trim()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { reminderDate, reminderType, description } = req.body;

      // Verify ownership
      const document = await prisma.document.findFirst({
        where: { id, userId }
      });

      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      const reminder = await prisma.documentReminder.create({
        data: {
          documentId: id,
          reminderDate: new Date(reminderDate),
          reminderType,
          description
        }
      });

      res.json({ reminder });
    } catch (error) {
      console.error('Add reminder error:', error);
      res.status(500).json({ error: 'Failed to add reminder' });
    }
  }
);

// Helper function to process document
async function processDocument(documentId: string, file: Express.Multer.File) {
  try {
    let extractedText = '';
    let ocrConfidence = 1.0;

    // Extract text based on file type
    if (file.mimetype === 'application/pdf') {
      // Extract text from PDF
      const dataBuffer = await fs.readFile(file.path);
      const data = await pdf(dataBuffer);
      extractedText = data.text;
    } else if (file.mimetype.startsWith('image/')) {
      // Perform OCR on images
      const result = await Tesseract.recognize(file.path, 'eng');
      extractedText = result.data.text;
      ocrConfidence = result.data.confidence / 100;
    } else if (file.mimetype.includes('text')) {
      // Read text files directly
      extractedText = await fs.readFile(file.path, 'utf-8');
    }

    // Update document with extracted text
    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractedText,
        ocrConfidence,
        processedDate: new Date(),
        status: 'completed'
      }
    });

    // Extract data using AI
    if (extractedText) {
      await extractDataWithAI(documentId, extractedText);
    }

    // Classify document
    await classifyDocument(documentId, extractedText, file.originalname);

  } catch (error) {
    console.error('Document processing error:', error);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'failed' }
    });
  }
}

// Extract structured data using AI
async function extractDataWithAI(documentId: string, text: string) {
  try {
    // Skip AI extraction if Anthropic is not available
    if (!anthropic) {
      console.log('Anthropic API not available, skipping AI extraction');
      return;
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0,
      system: 'You are a document analyzer. Extract key information from documents. Return ONLY valid JSON with extracted fields like: {"vendor": "...", "amount": "...", "date": "...", "invoice_number": "...", "expiration_date": "..."}. Do not include any explanatory text, only the JSON object.',
      messages: [
        { role: 'user', content: `Extract key information from this document and return ONLY JSON:\n\n${text.substring(0, 3000)}` }
      ]
    });

    let extractedData: any = {};
    try {
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
      extractedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Try to extract JSON from response that might have extra text
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
      const jsonMatch = responseText.match(/\{[^}]*\}/);
      if (jsonMatch) {
        try {
          extractedData = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error('Failed to parse extracted JSON:', secondParseError);
          extractedData = {};
        }
      }
    }

    // Store extracted data
    for (const [fieldName, fieldValue] of Object.entries(extractedData)) {
      if (fieldValue) {
        await prisma.documentData.create({
          data: {
            documentId,
            fieldName,
            fieldValue: String(fieldValue),
            fieldType: typeof fieldValue === 'number' ? 'number' : 
                      fieldName.includes('date') ? 'date' : 'text',
            confidence: 0.9
          }
        });
      }
    }

    // Create reminders based on extracted dates
    if (extractedData.expiration_date) {
      await prisma.documentReminder.create({
        data: {
          documentId,
          reminderDate: new Date(extractedData.expiration_date),
          reminderType: 'expiration',
          description: 'Document expires'
        }
      });
    }
  } catch (error) {
    console.error('AI extraction error:', error);
  }
}

// Classify document using AI
async function classifyDocument(documentId: string, text: string, filename: string) {
  try {
    // Skip AI classification if Anthropic is not available
    if (!anthropic) {
      console.log('Anthropic API not available, using fallback classification');
      
      // Simple fallback classification based on filename
      let categoryName = 'general';
      const lowerFilename = filename.toLowerCase();
      
      if (lowerFilename.includes('invoice') || lowerFilename.includes('bill')) {
        categoryName = 'invoice';
      } else if (lowerFilename.includes('receipt')) {
        categoryName = 'receipt';
      } else if (lowerFilename.includes('contract') || lowerFilename.includes('agreement')) {
        categoryName = 'contract';
      } else if (lowerFilename.includes('warranty')) {
        categoryName = 'warranty';
      } else if (lowerFilename.includes('tax') || lowerFilename.includes('1099') || lowerFilename.includes('w2')) {
        categoryName = 'tax';
      } else if (lowerFilename.includes('insurance') || lowerFilename.includes('policy')) {
        categoryName = 'insurance';
      } else if (lowerFilename.includes('medical') || lowerFilename.includes('health')) {
        categoryName = 'medical';
      }
      
      // Find or create category
      let category = await prisma.category.findFirst({
        where: { 
          name: categoryName,
          isSystem: true
        }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: categoryName,
            isSystem: true
          }
        });
      }

      // Assign category to document
      await prisma.documentCategory.create({
        data: {
          documentId,
          categoryId: category.id,
          confidence: 0.6, // Lower confidence for fallback
          isManual: false
        }
      });
      
      return;
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      temperature: 0,
      system: 'You are a document classifier. Classify documents into categories like: receipt, invoice, contract, warranty, medical, tax, insurance, etc. Return ONLY valid JSON with: {"category": "...", "confidence": 0.8, "suggestedTags": [...]}. Do not include any explanatory text, only the JSON object.',
      messages: [
        { role: 'user', content: `Classify this document and return ONLY JSON:\nFilename: ${filename}\nContent: ${text.substring(0, 1000)}` }
      ]
    });

    let classification: any = {};
    try {
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
      classification = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Try to extract JSON from response that might have extra text
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
      const jsonMatch = responseText.match(/\{[^}]*\}/);
      if (jsonMatch) {
        try {
          classification = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error('Failed to parse extracted JSON:', secondParseError);
          classification = {};
        }
      }
    }

    if (classification.category) {
      // Find or create category
      let category = await prisma.category.findFirst({
        where: { 
          name: classification.category,
          isSystem: true
        }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: classification.category,
            isSystem: true
          }
        });
      }

      // Assign category to document
      await prisma.documentCategory.create({
        data: {
          documentId,
          categoryId: category.id,
          confidence: classification.confidence || 0.8,
          isManual: false
        }
      });
    }
  } catch (error) {
    console.error('Classification error:', error);
  }
}

export default router;