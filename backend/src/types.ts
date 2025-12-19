export interface Model {
  id: string;
  name: string;
  fileUri: string;
  stlFileUri?: string;
  previewImageUri?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  modelId: string;
  jobType: 'stl_conversion' | 'preview_generation';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateModelInput {
  name: string;
  fileUri: string;
}

export interface ModelWithJobs extends Model {
  jobs: Job[];
}
