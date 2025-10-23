import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import uploadRouter from './routes/upload.js';
import slicingRouter from './routes/slicing.js';
import profileRouter from './routes/profile.js';
import aiRouter from './routes/ai.js';
import learningRouter from './routes/learning.js';
import authRouter from './routes/auth.js';
import {
  apiLimiter,
  uploadLimiter,
  aiLimiter,
  validateInput,
  securityHeaders,
  errorLogger,
  errorHandler,
  requestTimeout,
} from './middleware/security.js';
import fileCleanupService from './services/fileCleanupService.js';
import {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  metrics,
  performHealthCheck,
} from './services/monitoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Sentry for error tracking
initSentry(app);

// MongoDB Connection with proper error handling
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ MongoDB connected successfully');
    } else {
      console.warn('⚠️  MongoDB URI not found. Learning features will be disabled.');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.warn('⚠️  Continuing without MongoDB. Learning features will be disabled.');
  }
};

// Connect to MongoDB
connectDB();

// Graceful MongoDB reconnection
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Sentry request handler - must be first
app.use(sentryRequestHandler());

// Sentry tracing handler - must be after request handler
app.use(sentryTracingHandler());

// Prometheus metrics tracking
app.use(metrics.trackHttpRequest());

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, enable in production
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// Security headers
app.use(securityHeaders);

// Request timeout (30 seconds for most routes)
app.use(requestTimeout(30000));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input validation and sanitization
app.use(validateInput);

// Global API rate limiting
app.use('/api/', apiLimiter);

// Static files for uploads (with rate limiting)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads'), {
  maxAge: '1h',
  etag: true,
}));

// Routes with specific rate limiting
app.use('/api/auth', apiLimiter, authRouter);
app.use('/api/upload', uploadLimiter, uploadRouter);
app.use('/api/slicing', apiLimiter, slicingRouter);
app.use('/api/profile', apiLimiter, profileRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/learning', apiLimiter, learningRouter);

// Health check endpoint (comprehensive)
app.get('/api/health', async (req, res) => {
  try {
    const healthData = await performHealthCheck();
    const statusCode = healthData.status === 'ok' ? 200 : healthData.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(healthData);
  } catch (error) {
    res.status(503).json({
      status: 'down',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Simple health check for load balancers
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Prometheus metrics endpoint
app.get('/metrics', metrics.getMetricsHandler());

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
  });
});

// Sentry error handler - must be before other error handlers
app.use(sentryErrorHandler());

// Error logging
app.use(errorLogger);

// Global error handler
app.use(errorHandler);

// Start file cleanup service (runs every hour, deletes files older than 24 hours)
const cleanupIntervalMinutes = parseInt(process.env.FILE_CLEANUP_INTERVAL_MINUTES || '60');
const fileMaxAgeHours = parseInt(process.env.FILE_MAX_AGE_HOURS || '24');
fileCleanupService.start(cleanupIntervalMinutes);

// File stats endpoint
app.get('/api/files/stats', async (req, res) => {
  try {
    const stats = await fileCleanupService.getStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get file stats' });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 AIPMS Backend running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${process.env.UPLOAD_DIR || './uploads'}`);
  console.log(`🧠 Learning features: ${mongoose.connection.readyState === 1 ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🔒 Security features: ENABLED`);
  console.log(`⏱️  Request timeout: 30s`);
  console.log(`🌍 CORS origin: ${process.env.CORS_ORIGIN || '*'}`);
  console.log(`📊 Rate limiting: ENABLED`);
  console.log(`🧹 File cleanup: Every ${cleanupIntervalMinutes}min (max age: ${fileMaxAgeHours}h)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  fileCleanupService.stop();
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  fileCleanupService.stop();
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
