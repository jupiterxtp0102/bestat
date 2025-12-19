import request from 'supertest';
import app from './index';
import * as models from './models';
import path from 'path';
import fs from 'fs';

// Mock the database functions
jest.mock('./models');

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/models', () => {
    it('should return all models', async () => {
      const mockModels = [
        {
          id: '123',
          name: 'Test Model',
          fileUri: '/uploads/test.glb',
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (models.getAllModels as jest.Mock).mockResolvedValue(mockModels);

      const response = await request(app).get('/api/models');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: '123',
        name: 'Test Model',
        fileUri: '/uploads/test.glb',
        status: 'completed',
      });
      expect(models.getAllModels).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      (models.getAllModels as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/models');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/models/:id', () => {
    it('should return a specific model with jobs', async () => {
      const mockModel = {
        id: '123',
        name: 'Test Model',
        fileUri: '/uploads/test.glb',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        jobs: [
          {
            id: 'job1',
            modelId: '123',
            jobType: 'stl_conversion',
            status: 'completed',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      (models.getModelWithJobs as jest.Mock).mockResolvedValue(mockModel);

      const response = await request(app).get('/api/models/123');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: '123',
        name: 'Test Model',
        fileUri: '/uploads/test.glb',
        status: 'completed',
      });
      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0]).toMatchObject({
        id: 'job1',
        modelId: '123',
        jobType: 'stl_conversion',
        status: 'completed',
      });
    });

    it('should return 404 for non-existent model', async () => {
      (models.getModelWithJobs as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/models/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/models/:id/reprocess', () => {
    it('should create reprocessing jobs', async () => {
      const mockModel = {
        id: '123',
        name: 'Test Model',
        fileUri: '/uploads/test.glb',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        jobs: [],
      };

      (models.getModelWithJobs as jest.Mock).mockResolvedValue(mockModel);
      (models.createJob as jest.Mock).mockResolvedValue({});

      const response = await request(app).post('/api/models/123/reprocess');

      expect(response.status).toBe(200);
      expect(models.createJob).toHaveBeenCalledTimes(2);
    });
  });

  describe('GET /health', () => {
    it('should return ok status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});
