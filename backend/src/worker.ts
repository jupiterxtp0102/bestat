import dotenv from 'dotenv';
import { JobProcessor } from './jobProcessor';

dotenv.config();

const processor = new JobProcessor();

console.log('Starting background job worker...');
processor.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down worker...');
  processor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down worker...');
  processor.stop();
  process.exit(0);
});
