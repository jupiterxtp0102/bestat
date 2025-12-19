import * as path from 'path';
import * as fs from 'fs';
import {
  getPendingJobs,
  updateJobStatus,
  getModelById,
  updateModelStlUri,
  updateModelPreviewUri,
  updateModelStatus,
} from './models';
import { convertGlbToStl, generatePreviewImage, ensureDirectoryExists } from './converter';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const GLB_DIR = path.join(UPLOAD_DIR, 'glb');
const STL_DIR = path.join(UPLOAD_DIR, 'stl');
const PNG_DIR = path.join(UPLOAD_DIR, 'png');
const POLL_INTERVAL = 5000; // 5 seconds

export class JobProcessor {
  private isRunning = false;

  async start() {
    this.isRunning = true;
    console.log('Job processor started');
    
    while (this.isRunning) {
      await this.processPendingJobs();
      await this.sleep(POLL_INTERVAL);
    }
  }

  stop() {
    this.isRunning = false;
    console.log('Job processor stopped');
  }

  private async processPendingJobs() {
    try {
      const pendingJobs = await getPendingJobs();
      
      for (const job of pendingJobs) {
        await this.processJob(job.id, job.modelId, job.jobType);
      }
    } catch (error) {
      console.error('Error processing pending jobs:', error);
    }
  }

  private async processJob(
    jobId: string,
    modelId: string,
    jobType: 'stl_conversion' | 'preview_generation'
  ) {
    try {
      console.log(`Processing job ${jobId} (${jobType}) for model ${modelId}`);
      
      await updateJobStatus(jobId, 'processing');
      
      const model = await getModelById(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      if (jobType === 'stl_conversion') {
        await this.processStlConversion(jobId, model);
      } else if (jobType === 'preview_generation') {
        await this.processPreviewGeneration(jobId, model);
      }

      await updateJobStatus(jobId, 'completed');
      await this.updateOverallModelStatus(modelId);
      
      console.log(`Job ${jobId} completed successfully`);
    } catch (error: any) {
      console.error(`Job ${jobId} failed:`, error);
      await updateJobStatus(jobId, 'failed', error.message);
      await updateModelStatus(modelId, 'failed');
    }
  }

  private async processStlConversion(jobId: string, model: any) {
    const glbPath = model.fileUri;
    const stlFileName = `${model.id}.stl`;
    const stlPath = path.join(STL_DIR, stlFileName);

    ensureDirectoryExists(STL_DIR);
    
    // Simulate processing time
    await this.sleep(2000);
    
    await convertGlbToStl(glbPath, stlPath);
    await updateModelStlUri(model.id, stlPath);
  }

  private async processPreviewGeneration(jobId: string, model: any) {
    const glbPath = model.fileUri;
    const imageFileName = `${model.id}_preview.png`;
    const imagePath = path.join(PNG_DIR, imageFileName);

    ensureDirectoryExists(PNG_DIR);
    
    // Simulate processing time
    await this.sleep(1500);
    
    await generatePreviewImage(glbPath, imagePath);
    await updateModelPreviewUri(model.id, imagePath);
  }

  private async updateOverallModelStatus(modelId: string) {
    // Check if all jobs for this model are completed
    const { getJobsByModelId } = await import('./models');
    const jobs = await getJobsByModelId(modelId);
    
    const allCompleted = jobs.every(job => job.status === 'completed');
    const anyFailed = jobs.some(job => job.status === 'failed');
    const anyProcessing = jobs.some(job => job.status === 'processing');
    
    if (allCompleted) {
      await updateModelStatus(modelId, 'completed');
    } else if (anyFailed) {
      await updateModelStatus(modelId, 'failed');
    } else if (anyProcessing) {
      await updateModelStatus(modelId, 'processing');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
