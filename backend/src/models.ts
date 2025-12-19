import { query } from './db';
import { Model, CreateModelInput, Job, ModelWithJobs } from './types';
import { v4 as uuidv4 } from 'uuid';

// Helper to convert snake_case DB fields to camelCase
function mapDbToModel(row: any): Model {
  return {
    id: row.id,
    name: row.name,
    fileUri: row.file_uri,
    stlFileUri: row.stl_file_uri,
    previewImageUri: row.preview_image_uri,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbToJob(row: any): Job {
  return {
    id: row.id,
    modelId: row.model_id,
    jobType: row.job_type,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllModels(): Promise<Model[]> {
  const result = await query('SELECT * FROM models ORDER BY created_at DESC');
  return result.rows.map(mapDbToModel);
}

export async function getModelById(id: string): Promise<Model | null> {
  const result = await query('SELECT * FROM models WHERE id = $1', [id]);
  return result.rows.length > 0 ? mapDbToModel(result.rows[0]) : null;
}

export async function getModelWithJobs(id: string): Promise<ModelWithJobs | null> {
  const model = await getModelById(id);
  if (!model) return null;

  const jobsResult = await query(
    'SELECT * FROM jobs WHERE model_id = $1 ORDER BY created_at DESC',
    [id]
  );
  
  const jobs = jobsResult.rows.map(mapDbToJob);
  
  return {
    ...model,
    jobs,
  };
}

export async function createModel(input: CreateModelInput): Promise<Model> {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO models (id, name, file_uri, status) 
     VALUES ($1, $2, $3, 'pending') 
     RETURNING *`,
    [id, input.name, input.fileUri]
  );
  
  return mapDbToModel(result.rows[0]);
}

export async function updateModelStatus(
  id: string,
  status: Model['status']
): Promise<void> {
  await query(
    'UPDATE models SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [status, id]
  );
}

export async function updateModelStlUri(
  id: string,
  stlFileUri: string
): Promise<void> {
  await query(
    'UPDATE models SET stl_file_uri = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [stlFileUri, id]
  );
}

export async function updateModelPreviewUri(
  id: string,
  previewImageUri: string
): Promise<void> {
  await query(
    'UPDATE models SET preview_image_uri = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [previewImageUri, id]
  );
}

// Job management
export async function createJob(
  modelId: string,
  jobType: Job['jobType']
): Promise<Job> {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO jobs (id, model_id, job_type, status) 
     VALUES ($1, $2, $3, 'pending') 
     RETURNING *`,
    [id, modelId, jobType]
  );
  
  return mapDbToJob(result.rows[0]);
}

export async function updateJobStatus(
  id: string,
  status: Job['status'],
  errorMessage?: string
): Promise<void> {
  await query(
    'UPDATE jobs SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
    [status, errorMessage || null, id]
  );
}

export async function getPendingJobs(): Promise<Job[]> {
  const result = await query(
    "SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at ASC"
  );
  return result.rows.map(mapDbToJob);
}

export async function getJobsByModelId(modelId: string): Promise<Job[]> {
  const result = await query(
    'SELECT * FROM jobs WHERE model_id = $1 ORDER BY created_at DESC',
    [modelId]
  );
  return result.rows.map(mapDbToJob);
}
