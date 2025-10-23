import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import uploadRouter from './routes/upload.js';
import slicingRouter from './routes/slicing.js';
import profileRouter from './routes/profile.js';
import aiRouter from './routes/ai.js';
import learningRouter from './routes/learning.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes
app.use('/api/upload', uploadRouter);
app.use('/api/slicing', slicingRouter);
app.use('/api/profile', profileRouter);
app.use('/api/ai', aiRouter);
app.use('/api/learning', learningRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AIPMS Backend is running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    learningEnabled: mongoose.connection.readyState === 1,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AIPMS Backend running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${process.env.UPLOAD_DIR || './uploads'}`);
  console.log(`🧠 Learning features: ${mongoose.connection.readyState === 1 ? 'ENABLED' : 'DISABLED'}`);
});
