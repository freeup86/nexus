import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/authRoutes';
import twitterRoutes from './routes/twitterRoutes';
import textExtractorRoutes from './routes/textExtractorRoutes';
import contractRoutes from './routes/contractRoutes';
import userRoutes from './routes/userRoutes';
import apiTestRoutes from './routes/apiTestRoutes';
import decisionRoutes from './routes/decisionRoutes';
import diyRoutes from './routes/diyRoutes';
import travelRoutes from './routes/travelRoutes';
import documentRoutes from './routes/documentRoutes';
import dreamRoutes from './routes/dreamRoutes';
import documentOrganizerRoutes from './routes/documentOrganizerRoutes';
import personalInsightsRoutes from './routes/personalInsightsRoutes';
import gamificationRoutes from './routes/gamificationRoutes';

// Smart Habits routes
import habitRoutes from './routes/habitRoutes';
import habitJournalRoutes from './routes/habitJournalRoutes';
import enhancedJournalRoutes from './routes/enhancedJournalRoutes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import { authenticateTokenSimple } from './middleware/authSimple';

// Import utilities
import { ensureUploadDirectory } from './utils/ensureUploadDir';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 10000;

// Trust proxy - configure for Render's proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://nexus-frontend.onrender.com',
  'https://nexus-frontend-4s13.onrender.com',
  'https://nexus-frontend-uy54.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173' // Vite default port
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For debugging in production, temporarily allow all origins
      if (process.env.NODE_ENV === 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip localhost
  skip: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    return ip === '127.0.0.1' || ip === '::1';
  }
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(compression());

// Serve uploaded files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manual OPTIONS handler for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/twitter', authenticateToken, twitterRoutes);
app.use('/api/text-extractor', authenticateToken, textExtractorRoutes);
app.use('/api/contracts', authenticateToken, contractRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/test-apis', authenticateToken, apiTestRoutes);
app.use('/api/decisions', authenticateToken, decisionRoutes);
app.use('/api/diy', authenticateToken, diyRoutes);
app.use('/api/travel', authenticateToken, travelRoutes);
app.use('/api/documents', authenticateTokenSimple, documentRoutes);
app.use('/api/dreams', authenticateToken, dreamRoutes);
app.use('/api/document-organizer', authenticateToken, documentOrganizerRoutes);
app.use('/api/personal-insights', authenticateToken, personalInsightsRoutes);
app.use('/api/gamification', authenticateToken, gamificationRoutes);

// Smart Habits API Routes
app.use('/api/habits', authenticateToken, habitRoutes);
app.use('/api/habits/journal', authenticateToken, habitJournalRoutes);
app.use('/api/journal', authenticateToken, enhancedJournalRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`✨ Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Ensure upload directories exist
  await ensureUploadDirectory();
});