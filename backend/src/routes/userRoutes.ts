import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req: AuthRequest, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user?.userId || 'unknown';
    cb(null, `profile-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed'));
    }
  }
});

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get current user profile
router.get('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tweets: true,
            textExtractions: true,
            contracts: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile',
  [
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('username').optional().isLength({ min: 3 }).trim()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { firstName, lastName, username } = req.body;

      // Check if username is taken
      if (username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username,
            NOT: { id: userId }
          }
        });

        if (existingUser) {
          res.status(400).json({ error: 'Username already taken' });
          return;
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          username: username || undefined
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          role: true
        }
      });

      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Upload profile picture
router.post('/profile/picture', upload.single('picture'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const userId = req.user?.userId;

    // Get current user to delete old profile picture
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Delete old profile picture if exists
    if (currentUser?.profilePicture) {
      try {
        const oldPath = path.join(__dirname, '../..', currentUser.profilePicture);
        await fs.unlink(oldPath);
      } catch (error) {
        console.error('Failed to delete old profile picture:', error);
      }
    }

    // Update user with new profile picture
    const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: profilePicturePath },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        role: true
      }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// Change password
router.put('/password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

// Get API keys
router.get('/api-keys', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        service: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ apiKeys });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Create/Update API key
router.post('/api-keys',
  [
    body('name').notEmpty().trim(),
    body('service').notEmpty().trim(),
    body('key').notEmpty()
  ],
  validateRequest,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { name, service, key } = req.body;

      // Check if API key already exists for this service
      const existingKey = await prisma.apiKey.findFirst({
        where: {
          userId,
          service
        }
      });

      let apiKey;
      if (existingKey) {
        // Update existing key
        apiKey = await prisma.apiKey.update({
          where: { id: existingKey.id },
          data: {
            name,
            key,
            isActive: true
          }
        });
      } else {
        // Create new key
        apiKey = await prisma.apiKey.create({
          data: {
            userId: userId!,
            name,
            service,
            key
          }
        });
      }

      res.json({
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          service: apiKey.service,
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt
        }
      });
    } catch (error) {
      console.error('Create/Update API key error:', error);
      res.status(500).json({ error: 'Failed to save API key' });
    }
  }
);

// Toggle API key status
router.put('/api-keys/:id/toggle', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId }
    });

    if (!apiKey) {
      res.status(404).json({ error: 'API key not found' });
      return;
    }

    const updatedKey = await prisma.apiKey.update({
      where: { id },
      data: { isActive: !apiKey.isActive }
    });

    res.json({
      apiKey: {
        id: updatedKey.id,
        name: updatedKey.name,
        service: updatedKey.service,
        isActive: updatedKey.isActive
      }
    });
  } catch (error) {
    console.error('Toggle API key error:', error);
    res.status(500).json({ error: 'Failed to toggle API key' });
  }
});

// Delete API key
router.delete('/api-keys/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId }
    });

    if (!apiKey) {
      res.status(404).json({ error: 'API key not found' });
      return;
    }

    await prisma.apiKey.delete({ where: { id } });

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

export default router;