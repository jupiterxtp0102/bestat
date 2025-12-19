import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';
import {
  getAllModels,
  getModelWithJobs,
  createModel,
  createJob,
} from './models';
import { ensureDirectoryExists } from './converter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const GLB_DIR = path.join(UPLOAD_DIR, 'glb');
const STL_DIR = path.join(UPLOAD_DIR, 'stl');
const PNG_DIR = path.join(UPLOAD_DIR, 'png');

// Ensure upload directories exist
ensureDirectoryExists(UPLOAD_DIR);
ensureDirectoryExists(GLB_DIR);
ensureDirectoryExists(STL_DIR);
ensureDirectoryExists(PNG_DIR);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, GLB_DIR); // Save GLB files to glb subdirectory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.glb') {
      cb(null, true);
    } else {
      cb(new Error('Only .glb files are allowed'));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

// Routes

/**
 * GET /api/models
 * Get all models
 */
app.get('/api/models', async (req: Request, res: Response) => {
  try {
    const models = await getAllModels();
    res.json(models);
  } catch (error: any) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

/**
 * GET /api/models/:id
 * Get a specific model with its metadata and jobs
 */
app.get('/api/models/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const model = await getModelWithJobs(id);
    
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    res.json(model);
  } catch (error: any) {
    console.error('Error fetching model:', error);
    res.status(500).json({ error: 'Failed to fetch model' });
  }
});

/**
 * POST /api/models/upload
 * Upload a new 3D model
 */
app.post(
  '/api/models/upload',
  upload.single('model'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const name = req.body.name || req.file.originalname;
      const fileUri = req.file.path;

      // Create model in database
      const model = await createModel({ name, fileUri });

      // Create background jobs for this model
      await createJob(model.id, 'stl_conversion');
      await createJob(model.id, 'preview_generation');

      res.status(201).json(model);
    } catch (error: any) {
      console.error('Error uploading model:', error);
      res.status(500).json({ error: 'Failed to upload model' });
    }
  }
);

/**
 * POST /api/models/:id/reprocess
 * Trigger reprocessing of a model (optional requirement)
 */
app.post('/api/models/:id/reprocess', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const model = await getModelWithJobs(id);
    
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    // Create new jobs for reprocessing
    await createJob(id, 'stl_conversion');
    await createJob(id, 'preview_generation');

    res.json({ message: 'Reprocessing jobs created' });
  } catch (error: any) {
    console.error('Error reprocessing model:', error);
    res.status(500).json({ error: 'Failed to reprocess model' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
