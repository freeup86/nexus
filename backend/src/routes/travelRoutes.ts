import { Router, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const prisma = new PrismaClient();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/travel');
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
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX are allowed.'));
    }
  }
});

// Validation middleware
const validateRequest = (req: AuthRequest, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    console.log('Request body that failed validation:', req.body);
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Helper function to validate GUID/UUID
const isValidGuid = (value: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value) || guidRegex.test(value);
};

// === TRIP ROUTES ===

// Get all trips for user
router.get('/trips', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { status, upcoming } = req.query;
    
    const where: any = { userId };
    
    if (status) {
      where.status = status;
    }
    
    if (upcoming === 'true') {
      where.startDate = { gte: new Date() };
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        _count: {
          select: {
            expenses: true,
            photos: true,
            companions: true
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    res.json({ trips });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get single trip
router.get('/trips/:id',
  [param('id').custom(isValidGuid)],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const trip = await prisma.trip.findFirst({
        where: { id, userId },
        include: {
          expenses: true,
          photos: true,
          companions: true,
          documents: true,
          itineraryItems: true,
          packingItems: true
        }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      res.json({ trip });
    } catch (error) {
      console.error('Get trip error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: 'Failed to fetch trip' });
    }
  }
);

// Create trip
router.post('/trips',
  [
    body('title').optional().trim(),
    body('destination').notEmpty().trim(),
    body('startDate').custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid start date');
      }
      return true;
    }),
    body('endDate').custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid end date');
      }
      return true;
    }),
    body('description').optional().trim(),
    body('tripType').optional().isIn(['leisure', 'business', 'family', 'adventure', 'romantic']),
    body('totalBudget').optional({ nullable: true }).isFloat({ min: 0 }),
    body('currency').optional().isLength({ min: 3, max: 3 })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      console.log('Trip creation request body:', req.body);
      
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { title, destination, startDate, endDate, description, tripType, totalBudget, currency } = req.body;
      
      console.log('Trip creation data:', {
        userId,
        title,
        destination,
        startDate,
        endDate,
        description,
        tripType,
        totalBudget,
        currency
      });

      // Validate dates
      if (new Date(endDate) < new Date(startDate)) {
        res.status(400).json({ error: 'End date must be after start date' });
        return;
      }

      const tripData = {
        userId,
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        purpose: tripType || 'vacation',
        budget: totalBudget || null,
        currency: currency || 'USD',
        notes: title ? (description ? `${title}\n\n${description}` : title) : (description || null)
      };
      
      console.log('Creating trip with data:', tripData);
      
      const trip = await prisma.trip.create({
        data: tripData
      });

      res.status(201).json({ trip });
    } catch (error) {
      console.error('Create trip error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        prismaError: error
      });
      res.status(500).json({ 
        error: 'Failed to create trip',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Update trip
router.put('/trips/:id',
  [
    param('id').custom(isValidGuid),
    body('title').optional().notEmpty().trim(),
    body('destination').optional().notEmpty().trim(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601()
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
      
      // Verify ownership
      const existingTrip = await prisma.trip.findFirst({
        where: { id, userId }
      });

      if (!existingTrip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const trip = await prisma.trip.update({
        where: { id },
        data: req.body
      });

      res.json({ trip });
    } catch (error) {
      console.error('Update trip error:', error);
      res.status(500).json({ error: 'Failed to update trip' });
    }
  }
);

// Delete trip
router.delete('/trips/:id',
  [param('id').custom(isValidGuid)],
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
      const trip = await prisma.trip.findFirst({
        where: { id, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      await prisma.trip.delete({
        where: { id }
      });

      res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
      console.error('Delete trip error:', error);
      res.status(500).json({ error: 'Failed to delete trip' });
    }
  }
);

// === ITINERARY ROUTES ===

// Get trip itinerary
router.get('/trips/:tripId/itinerary',
  [param('tripId').custom(isValidGuid)],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const itineraryItems = await prisma.itineraryItem.findMany({
        where: { tripId },
        orderBy: { startTime: 'asc' }
      });

      res.json({ itinerary: itineraryItems });
    } catch (error) {
      console.error('Get itinerary error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: 'Failed to fetch itinerary' });
    }
  }
);

// Add itinerary item
router.post('/trips/:tripId/itinerary',
  [
    param('tripId').custom(isValidGuid),
    body('activity').notEmpty().trim(),
    body('date').isISO8601(),
    body('time').optional().trim(),
    body('location').optional().trim(),
    body('duration').optional().isInt({ min: 0 }),
    body('cost').optional().isFloat({ min: 0 }),
    body('notes').optional().trim()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, dayId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const { activity, date, time, location, duration, cost, notes } = req.body;
      
      const item = await prisma.itineraryItem.create({
        data: {
          tripId,
          activity,
          date: new Date(date),
          time: time || null,
          location: location || null,
          duration: duration || null,
          cost: cost || null,
          notes: notes || null
        }
      });

      res.status(201).json({ item });
    } catch (error) {
      console.error('Create itinerary item error:', error);
      res.status(500).json({ error: 'Failed to create itinerary item' });
    }
  }
);

// Delete itinerary item
router.delete('/trips/:tripId/itinerary/:dayId/items/:itemId',
  [
    param('tripId').custom(isValidGuid),
    param('dayId').custom(isValidGuid),
    param('itemId').custom(isValidGuid)
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, itemId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      await prisma.itineraryItem.delete({
        where: { id: itemId }
      });

      res.json({ message: 'Itinerary item deleted successfully' });
    } catch (error) {
      console.error('Delete itinerary item error:', error);
      res.status(500).json({ error: 'Failed to delete itinerary item' });
    }
  }
);

// === EXPENSE ROUTES ===

// Get trip expenses
router.get('/trips/:tripId/expenses',
  [param('tripId').custom(isValidGuid)],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const expenses = await prisma.tripExpense.findMany({
        where: { tripId },
        orderBy: { date: 'desc' }
      });

      res.json({ expenses });
    } catch (error) {
      console.error('Get expenses error:', error);
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  }
);

// Add expense
router.post('/trips/:tripId/expenses',
  [
    param('tripId').custom(isValidGuid),
    body('description').notEmpty().trim(),
    body('amount').isFloat({ min: 0 }),
    body('category').isIn(['accommodation', 'transport', 'food', 'activities', 'shopping', 'other']),
    body('date').isISO8601(),
    body('paymentMethod').optional().isIn(['cash', 'credit_card', 'debit_card', 'digital_wallet'])
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const expense = await prisma.tripExpense.create({
        data: {
          tripId,
          ...req.body,
          date: new Date(req.body.date)
        }
      });

      // Note: actualSpent field doesn't exist in schema

      res.status(201).json({ expense });
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ error: 'Failed to create expense' });
    }
  }
);

// Update expense
router.put('/trips/:tripId/expenses/:expenseId',
  [
    param('tripId').custom(isValidGuid),
    param('expenseId').custom(isValidGuid),
    body('description').optional().notEmpty().trim(),
    body('amount').optional().isFloat({ min: 0 }),
    body('category').optional().isIn(['accommodation', 'transport', 'food', 'activities', 'shopping', 'other'])
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, expenseId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const expense = await prisma.tripExpense.update({
        where: { id: expenseId },
        data: {
          ...req.body,
          date: req.body.date ? new Date(req.body.date) : undefined
        }
      });

      // Note: actualSpent field doesn't exist in schema

      res.json({ expense });
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({ error: 'Failed to update expense' });
    }
  }
);

// Delete expense
router.delete('/trips/:tripId/expenses/:expenseId',
  [
    param('tripId').custom(isValidGuid),
    param('expenseId').custom(isValidGuid)
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, expenseId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      await prisma.tripExpense.delete({
        where: { id: expenseId }
      });

      // Note: actualSpent field doesn't exist in schema

      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({ error: 'Failed to delete expense' });
    }
  }
);

// === PACKING LIST ROUTES ===

// Get packing list
router.get('/trips/:tripId/packing',
  [param('tripId').custom(isValidGuid)],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      // Get packing items for the trip
      const packingItems = await prisma.packingItem.findMany({
        where: { tripId },
        orderBy: { createdAt: 'asc' }
      });

      res.json({ items: packingItems });
    } catch (error) {
      console.error('Get packing list error:', error);
      res.status(500).json({ error: 'Failed to fetch packing list' });
    }
  }
);

// Add packing item
router.post('/trips/:tripId/packing',
  [
    param('tripId').custom(isValidGuid),
    body('itemName').notEmpty().trim(),
    body('category').optional().isIn(['clothing', 'toiletries', 'electronics', 'documents', 'medications', 'other']),
    body('quantity').optional().isInt({ min: 1 }),
    body('isEssential').optional().isBoolean()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      // Create packing item directly

      const item = await prisma.packingItem.create({
        data: {
          tripId,
          category: req.body.category || 'other',
          item: req.body.itemName,
          quantity: req.body.quantity || 1,
          isEssential: req.body.isEssential || false
        }
      });

      res.status(201).json({ item });
    } catch (error) {
      console.error('Create packing item error:', error);
      res.status(500).json({ error: 'Failed to create packing item' });
    }
  }
);

// Update packing item
router.put('/trips/:tripId/packing/:itemId',
  [
    param('tripId').custom(isValidGuid),
    param('itemId').custom(isValidGuid),
    body('itemName').optional().notEmpty().trim(),
    body('isPacked').optional().isBoolean()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, itemId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const item = await prisma.packingItem.update({
        where: { id: itemId },
        data: req.body
      });

      res.json({ item });
    } catch (error) {
      console.error('Update packing item error:', error);
      res.status(500).json({ error: 'Failed to update packing item' });
    }
  }
);

// Delete packing item
router.delete('/trips/:tripId/packing/:itemId',
  [
    param('tripId').custom(isValidGuid),
    param('itemId').custom(isValidGuid)
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, itemId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      await prisma.packingItem.delete({
        where: { id: itemId }
      });

      res.json({ message: 'Packing item deleted successfully' });
    } catch (error) {
      console.error('Delete packing item error:', error);
      res.status(500).json({ error: 'Failed to delete packing item' });
    }
  }
);

// === DOCUMENT ROUTES ===

// Get trip documents
router.get('/trips/:tripId/documents',
  [param('tripId').custom(isValidGuid)],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const documents = await prisma.tripDocument.findMany({
        where: { tripId },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ documents });
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }
);

// Upload document
router.post('/trips/:tripId/documents',
  upload.single('document'),
  [
    param('tripId').custom(isValidGuid),
    body('documentType').isIn(['passport', 'visa', 'ticket', 'booking', 'insurance', 'vaccination', 'license', 'other']),
    body('title').notEmpty().trim()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const document = await prisma.tripDocument.create({
        data: {
          tripId,
          type: req.body.documentType,
          name: req.body.title,
          fileUrl: req.file.path,
          fileSize: req.file.size,
          expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
          notes: req.body.notes || null
        }
      });

      res.status(201).json({ document });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

// Update document
router.put('/trips/:tripId/documents/:documentId',
  upload.single('document'),
  [
    param('tripId').custom(isValidGuid),
    param('documentId').custom(isValidGuid),
    body('title').optional().notEmpty().trim()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, documentId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const updateData: any = {
        ...req.body,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
      };

      if (req.file) {
        updateData.fileUrl = req.file.path;
        updateData.fileSize = req.file.size;
      }

      const document = await prisma.tripDocument.update({
        where: { id: documentId },
        data: updateData
      });

      res.json({ document });
    } catch (error) {
      console.error('Update document error:', error);
      res.status(500).json({ error: 'Failed to update document' });
    }
  }
);

// View document
router.get('/trips/:tripId/documents/:documentId/view',
  [
    param('tripId').custom(isValidGuid),
    param('documentId').custom(isValidGuid)
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, documentId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const document = await prisma.tripDocument.findFirst({
        where: { id: documentId, tripId }
      });

      if (!document || !document.fileUrl) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      res.sendFile(path.resolve(document.fileUrl));
    } catch (error) {
      console.error('View document error:', error);
      res.status(500).json({ error: 'Failed to view document' });
    }
  }
);

// Delete document
router.delete('/trips/:tripId/documents/:documentId',
  [
    param('tripId').custom(isValidGuid),
    param('documentId').custom(isValidGuid)
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, documentId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const document = await prisma.tripDocument.findFirst({
        where: { id: documentId, tripId }
      });

      if (document?.fileUrl) {
        try {
          await fs.unlink(document.fileUrl);
        } catch (error) {
          console.error('Failed to delete file:', error);
        }
      }

      await prisma.tripDocument.delete({
        where: { id: documentId }
      });

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }
);

// === PHOTO ROUTES ===

// Get trip photos
router.get('/trips/:tripId/photos',
  [param('tripId').custom(isValidGuid)],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const photos = await prisma.tripPhoto.findMany({
        where: { tripId },
        orderBy: { takenAt: 'desc' }
      });

      res.json({ photos });
    } catch (error) {
      console.error('Get photos error:', error);
      res.status(500).json({ error: 'Failed to fetch photos' });
    }
  }
);

// Upload photos
router.post('/trips/:tripId/photos',
  upload.array('photos', 10),
  [param('tripId').custom(isValidGuid)],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No photos uploaded' });
        return;
      }

      const photos = await Promise.all(
        files.map(file => 
          prisma.tripPhoto.create({
            data: {
              tripId,
              photoUrl: file.path,
              caption: req.body.caption || '',
              location: req.body.location || '',
              takenAt: req.body.takenAt ? new Date(req.body.takenAt) : new Date()
            }
          })
        )
      );

      res.status(201).json({ photos });
    } catch (error) {
      console.error('Upload photos error:', error);
      res.status(500).json({ error: 'Failed to upload photos' });
    }
  }
);

// Update photo
router.put('/trips/:tripId/photos/:photoId',
  [
    param('tripId').custom(isValidGuid),
    param('photoId').custom(isValidGuid),
    body('caption').optional().trim(),
    body('location').optional().trim()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, photoId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const photo = await prisma.tripPhoto.update({
        where: { id: photoId },
        data: req.body
      });

      res.json({ photo });
    } catch (error) {
      console.error('Update photo error:', error);
      res.status(500).json({ error: 'Failed to update photo' });
    }
  }
);

// View photo
router.get('/trips/:tripId/photos/:photoId/view',
  [
    param('tripId').custom(isValidGuid),
    param('photoId').custom(isValidGuid)
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, photoId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const photo = await prisma.tripPhoto.findFirst({
        where: { id: photoId, tripId }
      });

      if (!photo || !photo.photoUrl) {
        res.status(404).json({ error: 'Photo not found' });
        return;
      }

      res.sendFile(path.resolve(photo.photoUrl));
    } catch (error) {
      console.error('View photo error:', error);
      res.status(500).json({ error: 'Failed to view photo' });
    }
  }
);

// View photo thumbnail
router.get('/trips/:tripId/photos/:photoId/thumbnail',
  [
    param('tripId').custom(isValidGuid),
    param('photoId').custom(isValidGuid)
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, photoId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const photo = await prisma.tripPhoto.findFirst({
        where: { id: photoId, tripId }
      });

      if (!photo || !photo.photoUrl) {
        res.status(404).json({ error: 'Photo not found' });
        return;
      }

      // For now, return the original photo. In a real app, you'd generate/serve a thumbnail
      res.sendFile(path.resolve(photo.photoUrl));
    } catch (error) {
      console.error('View thumbnail error:', error);
      res.status(500).json({ error: 'Failed to view thumbnail' });
    }
  }
);

// Delete photo
router.delete('/trips/:tripId/photos/:photoId',
  [
    param('tripId').custom(isValidGuid),
    param('photoId').custom(isValidGuid)
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, photoId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const photo = await prisma.tripPhoto.findFirst({
        where: { id: photoId, tripId }
      });

      if (photo?.photoUrl) {
        try {
          await fs.unlink(photo.photoUrl);
        } catch (error) {
          console.error('Failed to delete file:', error);
        }
      }

      await prisma.tripPhoto.delete({
        where: { id: photoId }
      });

      res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
      console.error('Delete photo error:', error);
      res.status(500).json({ error: 'Failed to delete photo' });
    }
  }
);

// === COMPANION ROUTES ===

// Get trip companions
router.get('/trips/:tripId/companions',
  [param('tripId').custom(isValidGuid)],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const companions = await prisma.tripCompanion.findMany({
        where: { tripId },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ companions });
    } catch (error) {
      console.error('Get companions error:', error);
      res.status(500).json({ error: 'Failed to fetch companions' });
    }
  }
);

// Add companion
router.post('/trips/:tripId/companions',
  [
    param('tripId').custom(isValidGuid),
    body('name').notEmpty().trim(),
    body('email').optional().isEmail(),
    body('relationship').optional().trim()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const companion = await prisma.tripCompanion.create({
        data: {
          tripId,
          name: req.body.name,
          email: req.body.email || null,
          phone: req.body.phone || null,
          relationship: req.body.relationship || null,
          emergencyContact: req.body.emergencyContact || false,
          notes: req.body.notes || null
        }
      });

      res.status(201).json({ companion });
    } catch (error) {
      console.error('Create companion error:', error);
      res.status(500).json({ error: 'Failed to add companion' });
    }
  }
);

// Update companion
router.put('/trips/:tripId/companions/:companionId',
  [
    param('tripId').custom(isValidGuid),
    param('companionId').custom(isValidGuid),
    body('name').optional().notEmpty().trim(),
    body('email').optional().isEmail(),
    body('relationship').optional().trim()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, companionId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      const companion = await prisma.tripCompanion.update({
        where: { id: companionId },
        data: req.body
      });

      res.json({ companion });
    } catch (error) {
      console.error('Update companion error:', error);
      res.status(500).json({ error: 'Failed to update companion' });
    }
  }
);

// Note: Companion status updates removed as schema doesn't support status/joinedAt fields

// Delete companion
router.delete('/trips/:tripId/companions/:companionId',
  [
    param('tripId').custom(isValidGuid),
    param('companionId').custom(isValidGuid)
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId, companionId } = req.params;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      await prisma.tripCompanion.delete({
        where: { id: companionId }
      });

      res.json({ message: 'Companion removed successfully' });
    } catch (error) {
      console.error('Delete companion error:', error);
      res.status(500).json({ error: 'Failed to remove companion' });
    }
  }
);

// === AI ITINERARY GENERATION ===

// Generate AI-powered itinerary
router.post('/trips/:tripId/generate-itinerary',
  [
    param('tripId').custom(isValidGuid),
    body('keywords').isArray().withMessage('Keywords must be an array'),
    body('keywords.*').notEmpty().trim().withMessage('Each keyword must be non-empty'),
    body('duration').optional().isInt({ min: 1, max: 30 }).withMessage('Duration must be between 1 and 30 days'),
    body('preferences').optional().isString()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { tripId } = req.params;
      const { keywords, duration, preferences } = req.body;

      // Verify trip ownership
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId }
      });

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }

      // Calculate trip duration from dates if not provided
      let tripDuration = duration;
      if (!tripDuration && trip.startDate && trip.endDate) {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        tripDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
      const finalDuration = tripDuration || 3;

      console.log('Trip duration calculated as:', finalDuration, 'days');

      // Create AI prompt for itinerary generation
      const prompt = `Create a detailed travel itinerary for a ${finalDuration}-day trip with the following requirements:

Destination: ${trip.destination}
Travel dates: ${trip.startDate ? new Date(trip.startDate).toDateString() : 'Not specified'} to ${trip.endDate ? new Date(trip.endDate).toDateString() : 'Not specified'}
Trip Duration: ${finalDuration} days
Keywords/Activities: ${keywords.join(', ')}
Additional preferences: ${preferences || 'None specified'}

CRITICAL: You MUST generate exactly ${finalDuration} days of activities. Do not generate fewer days.

IMPORTANT: Use exactly this format for the itinerary:

Day 1
- Morning: 9:00 AM Visit Central Park - Explore the iconic park and take photos
- Afternoon: 2:00 PM Museum of Natural History - Learn about dinosaurs and planetarium shows  
- Evening: 7:00 PM Dinner in Little Italy - Authentic Italian cuisine experience

Day 2
- Morning: 10:00 AM Brooklyn Bridge Walk - Scenic views and historic architecture
- Afternoon: 1:00 PM DUMBO Food Market - Local food vendors and waterfront views
- Evening: 6:00 PM Sunset at One World Observatory - Panoramic city views

${finalDuration > 3 ? `
Day 3
- Morning: 8:00 AM Morning Activity - Brief description
- Afternoon: 1:00 PM Afternoon Activity - Brief description  
- Evening: 6:00 PM Evening Activity - Brief description

Continue this pattern for ALL ${finalDuration} days.` : ''}

Requirements:
1. Generate EXACTLY ${finalDuration} days (Day 1 through Day ${finalDuration})
2. Start each day with "Day X" (where X is the day number)
3. Use "- Morning:", "- Afternoon:", "- Evening:" for each time period
4. Include specific times (like "9:00 AM", "2:00 PM") 
5. Format: Time Activity - Brief description
6. Incorporate ALL requested keywords: ${keywords.join(', ')}
7. Keep descriptions concise but informative
8. Ensure logical geographical flow
9. Suggest realistic timing and practical schedules
10. DO NOT stop at 3 days - generate the full ${finalDuration} days

Generate activities for ALL ${finalDuration} days of the trip.`;

      // Generate itinerary using Claude
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const generatedItinerary = response.content[0].type === 'text' ? response.content[0].text : '';

      console.log('AI Generated Itinerary:', generatedItinerary);

      // Parse the generated itinerary and create itinerary items
      const itineraryLines = generatedItinerary.split('\n').filter(line => line.trim());
      const itineraryItems: Array<{
        day: number;
        time: string;
        activity: string;
        location?: string;
        description?: string;
      }> = [];

      let currentDay = 1;
      let currentTimeOfDay = 'Morning';

      console.log('Processing', itineraryLines.length, 'lines');

      for (const line of itineraryLines) {
        console.log('Processing line:', line);
        
        // Match Day X patterns
        const dayMatch = line.match(/Day (\d+)/i);
        if (dayMatch) {
          currentDay = parseInt(dayMatch[1]);
          console.log('Found day:', currentDay);
          continue;
        }

        // Match time patterns - more flexible
        const timeMatch = line.match(/^\s*-?\s*(Morning|Afternoon|Evening):\s*(.+)/i);
        if (timeMatch) {
          currentTimeOfDay = timeMatch[1];
          const content = timeMatch[2].trim();
          console.log('Found time activity:', currentTimeOfDay, content);
          
          // Extract specific time if present (9:00 AM, 2:30 PM, etc.)
          const specificTimeMatch = content.match(/^(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i);
          const specificTime = specificTimeMatch ? specificTimeMatch[1] : currentTimeOfDay;
          
          // Extract location and description
          let activity = content;
          let location = '';
          let description = content;
          
          // Try to parse "Activity at Location - Description" format
          const detailedMatch = content.match(/^(.+?)\s+at\s+(.+?)\s*-\s*(.+)$/i);
          if (detailedMatch) {
            activity = detailedMatch[1].replace(/^\d{1,2}:\d{2}(?:\s*[AP]M)?\s*/i, '').trim();
            location = detailedMatch[2].trim();
            description = detailedMatch[3].trim();
          } else {
            // Try to parse "Time Activity - Description" format
            const simpleMatch = content.match(/^(?:\d{1,2}:\d{2}(?:\s*[AP]M)?\s*)?(.+?)\s*-\s*(.+)$/i);
            if (simpleMatch) {
              activity = simpleMatch[1].trim();
              description = simpleMatch[2].trim();
            } else {
              // Remove time from activity if present
              activity = content.replace(/^\d{1,2}:\d{2}(?:\s*[AP]M)?\s*/i, '').trim();
            }
          }

          itineraryItems.push({
            day: currentDay,
            time: specificTime,
            activity,
            location: location || undefined,
            description
          });
          
          console.log('Added item:', { day: currentDay, time: specificTime, activity, location, description });
        } else {
          // Try to match bullet points or numbered lists
          const bulletMatch = line.match(/^\s*[-*•]\s*(.+)/);
          const numberedMatch = line.match(/^\s*\d+\.\s*(.+)/);
          
          if (bulletMatch || numberedMatch) {
            const content = (bulletMatch ? bulletMatch[1] : numberedMatch?.[1] || '').trim();
            console.log('Found bullet/numbered item:', content);
            
            if (content) {
              itineraryItems.push({
                day: currentDay,
                time: currentTimeOfDay,
                activity: content.split('-')[0]?.trim() || content,
                description: content
              });
              
              console.log('Added bullet item:', { day: currentDay, time: currentTimeOfDay, activity: content });
            }
          }
        }
      }

      console.log('Total parsed items:', itineraryItems.length);

      // If no items were parsed, try a more aggressive fallback parsing
      if (itineraryItems.length === 0) {
        console.log('No items parsed, trying fallback parsing...');
        const lines = generatedItinerary.split('\n').filter(line => line.trim());
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Skip empty lines and very short lines
          if (line.length < 10) continue;
          
          // Skip lines that are just headers or descriptions
          if (line.toLowerCase().includes('itinerary') || 
              line.toLowerCase().includes('requirements') ||
              line.toLowerCase().includes('day-by-day') ||
              line.match(/^\d+\.\s*$/)) continue;
          
          // If line contains time patterns or activity indicators, treat as activity
          if (line.match(/\d{1,2}:\d{2}/) || 
              line.match(/(morning|afternoon|evening|visit|explore|museum|restaurant|park|tour)/i) ||
              line.match(/^[-*•]\s*/) ||
              line.match(/^\d+\.\s*.+/)) {
            
            const day = Math.max(1, Math.floor(i / 5) + 1); // Rough estimate of day
            const timeOfDay = line.match(/morning/i) ? 'Morning' : 
                             line.match(/afternoon/i) ? 'Afternoon' : 
                             line.match(/evening/i) ? 'Evening' : 'Morning';
            
            const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
            
            itineraryItems.push({
              day,
              time: timeOfDay,
              activity: cleanLine.split('-')[0]?.trim() || cleanLine,
              description: cleanLine
            });
            
            console.log('Fallback added:', { day, time: timeOfDay, activity: cleanLine });
          }
        }
        
        console.log('Fallback parsing found:', itineraryItems.length, 'items');
      }

      // Save generated itinerary items to database
      const savedItems = [];
      
      // Group items by day
      const itemsByDay = itineraryItems.reduce((acc, item) => {
        if (!acc[item.day]) {
          acc[item.day] = [];
        }
        acc[item.day].push(item);
        return acc;
      }, {} as Record<number, typeof itineraryItems>);

      // Create or find trip itinerary days and add items
      for (const [day, items] of Object.entries(itemsByDay)) {
        try {
          const dayNumber = parseInt(day);
          
          // Create itinerary items for this day
          for (const item of items) {
            try {
              // Calculate date for this day of the trip
              const dayDate = trip.startDate ? 
                new Date(new Date(trip.startDate).getTime() + (dayNumber - 1) * 24 * 60 * 60 * 1000) : 
                new Date();

              const savedItem: any = await prisma.itineraryItem.create({
                data: {
                  tripId,
                  date: dayDate,
                  time: item.time,
                  activity: item.activity,
                  location: item.location || '',
                  cost: null,
                  notes: item.description || ''
                }
              });
              savedItems.push(savedItem);
            } catch (error) {
              console.error('Error saving itinerary item:', error);
              // Continue with other items even if one fails
            }
          }
        } catch (error) {
          console.error('Error processing day:', day, error);
          // Continue with other days even if one fails
        }
      }

      res.json({
        success: true,
        message: 'AI itinerary generated successfully',
        itinerary: {
          rawText: generatedItinerary,
          items: savedItems
        },
        itemsCreated: savedItems.length
      });

    } catch (error) {
      console.error('AI itinerary generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate AI itinerary',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;