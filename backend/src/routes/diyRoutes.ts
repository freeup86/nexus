import { Router, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Helper function to recalculate project progress based on milestones
async function recalculateProjectProgress(projectId: string): Promise<number> {
  const project = await prisma.dIYProject.findUnique({
    where: { id: projectId }
  });
  
  if (!project || !project.steps) return 0;
  
  const steps = Array.isArray(project.steps) ? project.steps : [];
  if (steps.length === 0) return 0;
  
  const completedCount = steps.filter((step: any) => step.status === 'completed').length;
  return Math.round((completedCount / steps.length) * 100);
}

// Initialize Anthropic Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', 'diy-photos');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `photo-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation middleware
const validateRequest = (req: AuthRequest, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Create a new DIY project
router.post('/projects/create',
  [
    body('title').notEmpty().trim(),
    body('description').optional().trim(),
    body('category').optional().trim(),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    body('estimatedTime').custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      if (!Number.isInteger(Number(value)) || Number(value) < 1) {
        throw new Error('estimatedTime must be a positive integer or null');
      }
      return true;
    }),
    body('estimatedCost').custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      if (isNaN(Number(value)) || Number(value) < 0) {
        throw new Error('estimatedCost must be a positive number or null');
      }
      return true;
    })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const { title, description, category, difficulty, estimatedTime, estimatedCost } = req.body;

      // Create the project
      const project = await prisma.dIYProject.create({
        data: {
          userId,
          title,
          description,
          category: category || 'general',
          difficulty: difficulty || 'beginner',
          estimatedTime,
          estimatedCost
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      res.status(201).json({ project });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// Get project details
router.get('/projects/:id',
  [param('id').custom((value) => {
    // Allow both UUID formats and temporary 'newid()' values
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value) && !guidRegex.test(value) && value !== 'newid()') {
      throw new Error('Invalid project ID format');
    }
    return true;
  })],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      const project = await prisma.dIYProject.findFirst({
        where: { 
          id,
          OR: [
            { userId },
            { isPublic: true }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          },
          supplies: true,
          images: {
            orderBy: { uploadedAt: 'desc' }
          },
          issues: true
        }
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      // Recalculate progress based on actual milestone completion
      const actualProgress = await recalculateProjectProgress(project.id);
      if (project.progressPercentage !== actualProgress) {
        // Update the database with correct progress
        await prisma.dIYProject.update({
          where: { id: project.id },
          data: {
            progressPercentage: actualProgress,
            status: actualProgress === 100 ? 'completed' : 
                   actualProgress > 0 ? 'active' : 
                   project.status === 'completed' ? 'active' : project.status
          }
        });
        project.progressPercentage = actualProgress;
      }

      res.json({ project });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ error: 'Failed to get project' });
    }
  }
);

// Update project
router.put('/projects/:id',
  [
    param('id').custom((value) => {
      // Allow both UUID formats and temporary 'newid()' values
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value) && !guidRegex.test(value) && value !== 'newid()') {
        throw new Error('Invalid project ID format');
      }
      return true;
    }),
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('status').optional().isIn(['planning', 'active', 'completed', 'paused']),
    body('actualDuration').custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      if (!Number.isInteger(Number(value)) || Number(value) < 0) {
        throw new Error('actualDuration must be a positive integer or null');
      }
      return true;
    }),
    body('actualCost').custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      if (isNaN(Number(value)) || Number(value) < 0) {
        throw new Error('actualCost must be a positive number or null');
      }
      return true;
    })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      let { id } = req.params;

      // If the project ID is 'newid()', fix it first
      if (id === 'newid()') {
        console.log('Fixing project with newid() ID during update');
        const newId = crypto.randomUUID();
        
        // Update the project with a proper UUID
        await prisma.dIYProject.update({
          where: { id },
          data: { id: newId }
        });
        
        id = newId; // Use the new ID for the rest of the operation
      }

      // Verify ownership
      const project = await prisma.dIYProject.findFirst({
        where: { id, userId }
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      // Update project
      const updatedProject = await prisma.dIYProject.update({
        where: { id },
        data: {
          ...req.body,
          updatedAt: new Date()
        }
      });

      res.json({ project: updatedProject });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

// Get user's projects
router.get('/projects/user/:userId',
  [param('userId').notEmpty()],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user?.userId;
      
      // Only show projects if it's the user's own or public projects
      const whereClause = userId === requestingUserId 
        ? { userId }
        : { 
            userId,
            isPublic: true
          };

      let projects = await prisma.dIYProject.findMany({
        where: whereClause,
        include: {
          images: {
            take: 1,
            orderBy: { uploadedAt: 'desc' }
          },
          _count: {
            select: {
              supplies: true,
              images: true,
              issues: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Fix any projects with 'newid()' as the ID
      const projectsToFix = projects.filter(p => p.id === 'newid()');
      if (projectsToFix.length > 0) {
        console.log(`Found ${projectsToFix.length} projects with 'newid()' ID, fixing...`);
        
        for (const project of projectsToFix) {
          const newId = crypto.randomUUID();
          await prisma.dIYProject.update({
            where: { id: project.id },
            data: { id: newId }
          });
          // Update the project object for response
          project.id = newId;
        }
      }

      // Note: Progress calculation removed since milestones don't exist in current schema

      res.json({ projects });
    } catch (error) {
      console.error('Get user projects error:', error);
      res.status(500).json({ error: 'Failed to get projects' });
    }
  }
);

// AI-powered project analysis
router.post('/projects/:id/analyze',
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

      // Get project details
      const project = await prisma.dIYProject.findFirst({
        where: { id, userId },
        include: {
          supplies: true,
          issues: true
        }
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      // Generate AI project plan
      const projectPlan = await generateAIProjectPlan(project);

      // Update project with AI plan
      await prisma.dIYProject.update({
        where: { id },
        data: {
          aiProjectPlan: JSON.stringify(projectPlan)
        }
      });

      res.json({ projectPlan });
    } catch (error) {
      console.error('Project analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze project' });
    }
  }
);

// Upload project photo
router.post('/projects/:id/photos',
  upload.single('photo'),
  [
    param('id').isUUID(),
    body('photoType').optional().isIn(['progress', 'before', 'after', 'issue', 'completed']),
    body('stepNumber').optional().isInt({ min: 1 }),
    body('caption').optional().trim(),
    body('voiceNote').optional().trim()
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
      const { photoType, stepNumber, caption, voiceNote } = req.body;

      // Verify ownership
      const project = await prisma.dIYProject.findFirst({
        where: { id, userId }
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No photo uploaded' });
        return;
      }

      // Generate thumbnail
      const thumbnailPath = req.file.path.replace(/(\.[^.]+)$/, '-thumb$1');
      await sharp(req.file.path)
        .resize(300, 300, { fit: 'cover' })
        .toFile(thumbnailPath);

      // Create photo record using ProjectImage model
      const photo = await prisma.projectImage.create({
        data: {
          projectId: id,
          imageUrl: req.file.path,
          caption: caption || null,
          isCover: photoType === 'cover'
        }
      });

      // Analyze photo with AI if needed
      if (photoType === 'issue' || photoType === 'progress') {
        const analysis = await analyzeProjectPhoto(photo, project);
        // AI analysis not supported in current ProjectImage schema
        // Could be added as a separate field or stored in caption
        
        // Create issue record if problems detected
        if (analysis.issuesDetected && analysis.issuesDetected.length > 0) {
          for (const issue of analysis.issuesDetected) {
            await prisma.issue.create({
              data: {
                projectId: id,
                title: (issue as any).type || 'AI Detected Issue',
                description: (issue as any).description,
                severity: (issue as any).severity || 'medium',
                imageUrl: photo.imageUrl
              }
            });
          }
        }
      }

      res.status(201).json({ photo });
    } catch (error) {
      console.error('Upload photo error:', error);
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  }
);

// Manage project supplies
router.post('/projects/:id/supplies',
  [
    param('id').custom((value) => {
      // Allow both UUID formats and temporary 'newid()' values
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value) && !guidRegex.test(value) && value !== 'newid()') {
        throw new Error('Invalid project ID format');
      }
      return true;
    }),
    body('supplies').isArray(),
    body('supplies.*.itemName').notEmpty().trim(),
    body('supplies.*.quantity').custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      if (isNaN(Number(value)) || Number(value) < 0) {
        throw new Error('quantity must be a positive number or null');
      }
      return true;
    }),
    body('supplies.*.estimatedCost').custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      if (isNaN(Number(value)) || Number(value) < 0) {
        throw new Error('estimatedCost must be a positive number or null');
      }
      return true;
    })
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
      const { supplies } = req.body;

      // Verify ownership
      const project = await prisma.dIYProject.findFirst({
        where: { id, userId }
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      // Create supplies using correct Supply model
      const createdSupplies = await prisma.supply.createMany({
        data: supplies.map((s: any) => ({
          projectId: id,
          name: s.itemName,
          quantity: s.quantity || 1,
          unit: s.unit || null,
          estimatedCost: s.estimatedCost || null,
          actualCost: s.actualCost || null,
          isPurchased: s.isPurchased || false,
          purchaseUrl: s.purchaseUrl || null,
          notes: s.notes || null
        }))
      });

      res.status(201).json({ 
        message: 'Supplies added successfully',
        count: createdSupplies.count 
      });
    } catch (error) {
      console.error('Add supplies error:', error);
      res.status(500).json({ error: 'Failed to add supplies' });
    }
  }
);

// Update project progress
router.post('/projects/:id/progress',
  [
    param('id').isUUID(),
    body('milestoneId').optional().isUUID(),
    body('progressPercentage').optional().isInt({ min: 0, max: 100 })
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
      const { milestoneId, progressPercentage } = req.body;

      // Verify ownership
      const project = await prisma.dIYProject.findFirst({
        where: { id, userId }
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      // Milestone functionality not implemented - using direct progress update
      if (progressPercentage !== undefined) {
        // Direct progress update
        await prisma.dIYProject.update({
          where: { id },
          data: {
            progressPercentage,
            status: progressPercentage === 100 ? 'completed' : 'active',
            completionDate: progressPercentage === 100 ? new Date() : null
          }
        });
      }

      res.json({ message: 'Progress updated successfully' });
    } catch (error) {
      console.error('Update progress error:', error);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  }
);

// Share project to community
router.post('/community/share',
  [
    body('projectId').isUUID(),
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('tags').optional().isArray(),
    body('featuredPhotoId').optional().isUUID()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const { projectId, title, description, tags, featuredPhotoId } = req.body;

      // Verify ownership
      const project = await prisma.dIYProject.findFirst({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      // Check if already shared
      const existingShare = await prisma.communityShares.findFirst({
        where: { projectId, userId }
      });

      if (existingShare) {
        // Update existing share
        const updated = await prisma.communityShares.update({
          where: { id: existingShare.id },
          data: {
            title: title || project.title,
            description,
            tags: tags ? JSON.stringify(tags) : undefined,
            featuredPhotoId,
            updatedAt: new Date()
          }
        });
        res.json({ share: updated });
      } else {
        // Create new share
        const share = await prisma.communityShares.create({
          data: {
            projectId,
            userId,
            title: title || project.title,
            description,
            tags: tags ? JSON.stringify(tags) : undefined,
            featuredPhotoId
          }
        });
        res.status(201).json({ share });
      }
    } catch (error) {
      console.error('Share project error:', error);
      res.status(500).json({ error: 'Failed to share project' });
    }
  }
);

// Browse community gallery - DISABLED: communityShares model doesn't exist
/* router.get('/community/gallery',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('projectType').optional().trim(),
    query('difficultyLevel').optional().isIn(['beginner', 'intermediate', 'advanced']),
    query('search').optional().trim()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const { projectType, difficultyLevel, search } = req.query;

      // Build where clause
      const whereClause: any = {
        isPublic: true
      };

      if (projectType || difficultyLevel || search) {
        whereClause.DIYProjects = {};
        
        if (projectType) {
          whereClause.DIYProjects.projectType = projectType;
        }
        
        if (difficultyLevel) {
          whereClause.DIYProjects.difficultyLevel = difficultyLevel;
        }
        
        if (search) {
          whereClause.OR = [
            { title: { contains: search as string } },
            { description: { contains: search as string } },
            { DIYProjects: { title: { contains: search as string } } },
            { DIYProjects: { description: { contains: search as string } } }
          ];
        }
      }

      const [shares, total] = await Promise.all([
        prisma.communityShares.findMany({
          where: whereClause,
          include: {
            DIYProjects: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true
                  }
                },
                images: {
                  take: 3,
                  orderBy: { uploadedAt: 'desc' }
                },
                _count: {
                  select: {
                    images: true,
                    supplies: true,
                    issues: true
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            },
            images: true,
            _count: {
              select: {
                images: true,
                supplies: true,
                issues: true
              }
            }
          },
          orderBy: { sharedAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.communityShares.count({ where: whereClause })
      ]);

      res.json({
        shares,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get community gallery error:', error);
      res.status(500).json({ error: 'Failed to get community projects' });
    }
  }
); */

// Request help from community - DISABLED: helpRequests model doesn't exist
/* router.post('/community/help',
  [
    body('projectId').isUUID(),
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('requestType').optional().isIn(['technique', 'tool_use', 'material_choice', 'troubleshooting']),
    body('photoId').optional().isUUID()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const { projectId, title, description, requestType, photoId } = req.body;

      // Verify project ownership
      const project = await prisma.dIYProject.findFirst({
        where: { id: projectId, userId }
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      const helpRequest = await prisma.helpRequests.create({
        data: {
          projectId,
          userId,
          title,
          description,
          requestType,
          photoId
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              category: true
            }
          }
        }
      });

      res.status(201).json({ helpRequest });
    } catch (error) {
      console.error('Create help request error:', error);
      res.status(500).json({ error: 'Failed to create help request' });
    }
  }
); */

// Delete project
router.delete('/projects/:id',
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
      const project = await prisma.dIYProject.findFirst({
        where: { id, userId },
        include: {
          images: true,
          supplies: true,
          issues: true
        }
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      // Delete photo files
      for (const photo of project.images) {
        try {
          await fs.unlink(photo.imageUrl);
          // Note: thumbnailPath not in schema, skipping thumbnail deletion
        } catch (error) {
          console.error('Error deleting photo file:', error);
        }
      }

      // Delete project (cascading deletes will handle related records)
      await prisma.dIYProject.delete({
        where: { id }
      });

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }
);

// Update a supply
router.put('/supplies/:id',
  [
    param('id').isUUID(),
    body('itemName').optional().trim(),
    body('quantity').optional().isFloat({ min: 0 }),
    body('actualCost').optional().isFloat({ min: 0 }),
    body('isOwned').optional().isBoolean(),
    body('isPurchased').optional().isBoolean()
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

      // Verify ownership through project
      const supply = await prisma.supply.findFirst({
        where: { id },
        include: {
          project: {
            select: { userId: true }
          }
        }
      });

      if (!supply || supply.project.userId !== userId) {
        res.status(404).json({ error: 'Supply not found' });
        return;
      }

      const updated = await prisma.supply.update({
        where: { id },
        data: req.body
      });

      res.json({ supply: updated });
    } catch (error) {
      console.error('Update supply error:', error);
      res.status(500).json({ error: 'Failed to update supply' });
    }
  }
);

// Delete a supply
router.delete('/supplies/:id',
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

      // Verify ownership through project
      const supply = await prisma.supply.findFirst({
        where: { id },
        include: {
          project: {
            select: { userId: true }
          }
        }
      });

      if (!supply || supply.project.userId !== userId) {
        res.status(404).json({ error: 'Supply not found' });
        return;
      }

      await prisma.supply.delete({
        where: { id }
      });

      res.json({ message: 'Supply deleted successfully' });
    } catch (error) {
      console.error('Delete supply error:', error);
      res.status(500).json({ error: 'Failed to delete supply' });
    }
  }
);

// Create a project issue
router.post('/projects/:id/issues',
  [
    param('id').isUUID(),
    body('issueType').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('severity').isIn(['low', 'medium', 'high', 'critical']),
    body('photoId').optional({ checkFalsy: true }).isUUID()
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
      const { issueType, description, severity, photoId } = req.body;

      // Verify ownership
      const project = await prisma.dIYProject.findFirst({
        where: { id, userId }
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      const issue = await prisma.issue.create({
        data: {
          projectId: id,
          title: issueType,
          description,
          severity,
          imageUrl: photoId || null,
          status: 'open'
        }
      });

      res.status(201).json({ issue });
    } catch (error) {
      console.error('Create issue error:', error);
      res.status(500).json({ error: 'Failed to create issue' });
    }
  }
);

// Update an issue
router.put('/issues/:id',
  [
    param('id').isUUID(),
    body('status').optional().isIn(['open', 'resolved', 'ignored', 'in_progress']),
    body('resolution').optional().trim(),
    body('resolvedAt').optional().isISO8601()
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

      // Verify ownership through project
      const issue = await prisma.issue.findFirst({
        where: { id },
        include: {
          project: {
            select: { userId: true }
          }
        }
      });

      if (!issue || issue.project.userId !== userId) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      const updated = await prisma.issue.update({
        where: { id },
        data: req.body
      });

      res.json({ issue: updated });
    } catch (error) {
      console.error('Update issue error:', error);
      res.status(500).json({ error: 'Failed to update issue' });
    }
  }
);

// Delete an issue
router.delete('/issues/:id',
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

      // Verify ownership through project
      const issue = await prisma.issue.findFirst({
        where: { id },
        include: {
          project: {
            select: { userId: true }
          }
        }
      });

      if (!issue || issue.project.userId !== userId) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      await prisma.issue.delete({
        where: { id }
      });

      res.json({ message: 'Issue deleted successfully' });
    } catch (error) {
      console.error('Delete issue error:', error);
      res.status(500).json({ error: 'Failed to delete issue' });
    }
  }
);

// Create a milestone
router.post('/projects/:id/milestones',
  [
    param('id').custom((value) => {
      // Allow both UUID formats and temporary 'newid()' values
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value) && !guidRegex.test(value) && value !== 'newid()') {
        throw new Error('Invalid project ID format');
      }
      return true;
    }),
    body('title').notEmpty().trim(),
    body('description').optional().trim(),
    body('estimatedDuration').custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      if (!Number.isInteger(Number(value)) || Number(value) < 0) {
        throw new Error('estimatedDuration must be a positive integer or null');
      }
      return true;
    }),
    body('stepOrder').custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      if (!Number.isInteger(Number(value)) || Number(value) < 1) {
        throw new Error('stepOrder must be a positive integer or null');
      }
      return true;
    })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      let { id } = req.params;
      const { title, description, estimatedDuration, stepOrder } = req.body;

      // If the project ID is 'newid()', fix it first
      if (id === 'newid()') {
        console.log('Fixing project with newid() ID');
        const newId = crypto.randomUUID();
        
        // Update the project with a proper UUID
        await prisma.dIYProject.update({
          where: { id },
          data: { id: newId }
        });
        
        id = newId; // Use the new ID for milestone creation
      }

      // Verify ownership
      const project = await prisma.dIYProject.findFirst({
        where: { id, userId }
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      // Get current steps from project
      const currentSteps = project.steps ? JSON.parse(JSON.stringify(project.steps)) : [];
      
      // Create new milestone
      const milestone = {
        id: crypto.randomUUID(),
        title,
        description,
        estimatedDuration,
        stepOrder: stepOrder || (currentSteps.length + 1),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add milestone to steps array
      currentSteps.push(milestone);
      
      // Update project with new steps
      await prisma.dIYProject.update({
        where: { id },
        data: {
          steps: currentSteps
        }
      });

      // Recalculate project progress after adding milestone
      const actualProgress = await recalculateProjectProgress(id);
      await prisma.dIYProject.update({
        where: { id },
        data: {
          progressPercentage: actualProgress,
          status: actualProgress === 100 ? 'completed' : 
                 actualProgress > 0 ? 'active' : project.status
        }
      });

      res.status(201).json({ milestone });
    } catch (error) {
      console.error('Create milestone error:', error);
      res.status(500).json({ error: 'Failed to create milestone' });
    }
  }
);

// Update a milestone
router.put('/milestones/:id',
  [
    param('id').custom((value) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value) && !guidRegex.test(value)) {
        throw new Error('Invalid ID format');
      }
      return true;
    }),
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('estimatedDuration').custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      if (!Number.isInteger(Number(value)) || Number(value) < 0) {
        throw new Error('estimatedDuration must be a positive integer or null');
      }
      return true;
    }),
    body('stepOrder').custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      if (!Number.isInteger(Number(value)) || Number(value) < 1) {
        throw new Error('stepOrder must be a positive integer or null');
      }
      return true;
    }),
    body('status').optional().isIn(['pending', 'active', 'completed', 'skipped'])
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
      
      // Find project that contains this milestone
      const projects = await prisma.dIYProject.findMany({
        where: { userId }
      });
      
      let targetProject = null;
      let milestoneIndex = -1;
      
      for (const project of projects) {
        if (project.steps) {
          const steps = Array.isArray(project.steps) ? project.steps : [];
          const index = steps.findIndex((step: any) => step.id === id);
          if (index !== -1) {
            targetProject = project;
            milestoneIndex = index;
            break;
          }
        }
      }
      
      if (!targetProject || milestoneIndex === -1) {
        res.status(404).json({ error: 'Milestone not found' });
        return;
      }
      
      // Update milestone in steps array
      const steps = Array.isArray(targetProject.steps) ? [...targetProject.steps] : [];
      steps[milestoneIndex] = {
        ...steps[milestoneIndex],
        ...req.body,
        updatedAt: new Date()
      };
      
      // Update project with modified steps
      await prisma.dIYProject.update({
        where: { id: targetProject.id },
        data: { steps }
      });
      
      const updated = steps[milestoneIndex];

      res.json({ milestone: updated });
    } catch (error) {
      console.error('Update milestone error:', error);
      res.status(500).json({ error: 'Failed to update milestone' });
    }
  }
);

// Delete a milestone
router.delete('/milestones/:id',
  [param('id').custom((value) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value) && !guidRegex.test(value)) {
      throw new Error('Invalid ID format');
    }
    return true;
  })],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const { id } = req.params;
      
      // Find project that contains this milestone
      const projects = await prisma.dIYProject.findMany({
        where: { userId }
      });
      
      let targetProject = null;
      let milestoneIndex = -1;
      
      for (const project of projects) {
        if (project.steps) {
          const steps = Array.isArray(project.steps) ? project.steps : [];
          const index = steps.findIndex((step: any) => step.id === id);
          if (index !== -1) {
            targetProject = project;
            milestoneIndex = index;
            break;
          }
        }
      }
      
      if (!targetProject || milestoneIndex === -1) {
        res.status(404).json({ error: 'Milestone not found' });
        return;
      }
      
      // Remove milestone from steps array
      const steps = Array.isArray(targetProject.steps) ? [...targetProject.steps] : [];
      steps.splice(milestoneIndex, 1);
      
      // Update project with modified steps
      await prisma.dIYProject.update({
        where: { id: targetProject.id },
        data: { steps }
      });

      res.json({ message: 'Milestone deleted successfully' });
    } catch (error) {
      console.error('Delete milestone error:', error);
      res.status(500).json({ error: 'Failed to delete milestone' });
    }
  }
);

// Helper function: Generate AI project plan
async function generateAIProjectPlan(project: any) {
  const systemPrompt = `You are an expert DIY project planner. Based on the project details, create a comprehensive step-by-step plan with supply lists, tool requirements, and time estimates.

Analyze the project and provide:
1. Detailed supply list with quantities and estimated costs
2. Complete tool list with alternatives for expensive tools
3. Step-by-step milestones with time estimates
4. Safety considerations and tips
5. Common pitfalls to avoid
6. Cost-saving suggestions

Format your response as JSON with this structure:
{
  "supplies": [
    {
      "itemName": "string",
      "category": "lumber|hardware|paint|electrical|plumbing|other",
      "quantity": number,
      "unit": "pieces|feet|gallons|etc",
      "estimatedCost": number,
      "notes": "string"
    }
  ],
  "tools": [
    {
      "toolName": "string",
      "toolType": "power_tool|hand_tool|measuring|safety",
      "isRequired": boolean,
      "rentalCost": number,
      "purchaseCost": number,
      "alternatives": ["string"]
    }
  ],
  "milestones": [
    {
      "title": "string",
      "description": "string",
      "estimatedDuration": number,
      "stepOrder": number,
      "dependencies": [number]
    }
  ],
  "safetyTips": ["string"],
  "commonMistakes": ["string"],
  "costSavingTips": ["string"],
  "totalEstimatedCost": number,
  "totalEstimatedTime": number
}`;

  const userPrompt = `Project Title: ${project.title}
Description: ${project.description || 'No description provided'}
Type: ${project.projectType || 'General DIY'}
Difficulty Level: ${project.difficultyLevel || 'Not specified'}
Estimated Duration: ${project.estimatedDuration ? project.estimatedDuration + ' hours' : 'Not specified'}
Estimated Cost: ${project.estimatedCost ? '$' + project.estimatedCost : 'Not specified'}

Please create a comprehensive project plan.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return JSON.parse(content.text);
    }
    
    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('AI project plan generation error:', error);
    return {
      error: 'Failed to generate project plan',
      supplies: [],
      tools: [],
      milestones: [],
      safetyTips: [],
      commonMistakes: [],
      costSavingTips: []
    };
  }
}

// Helper function: Analyze project photo
async function analyzeProjectPhoto(_photo: any, _project: any) {
  // This would integrate with a computer vision API
  // For now, return a mock analysis
  return {
    progressAssessment: {
      completionPercentage: 0,
      quality: 'good',
      observations: []
    },
    issuesDetected: [],
    suggestions: []
  };
}

export default router;