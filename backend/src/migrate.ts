import { pool } from './db';

async function migrate() {
  try {
    console.log('Running migrations...');
    
    // Create models table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS models (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        file_uri VARCHAR(500) NOT NULL,
        stl_file_uri VARCHAR(500),
        preview_image_uri VARCHAR(500),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create jobs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY,
        model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
        job_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on model_id for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_model_id ON jobs(model_id)
    `);

    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
