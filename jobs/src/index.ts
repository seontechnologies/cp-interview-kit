import { PrismaClient } from '@prisma/client';
import { startReportJob } from './jobs/reports';

export const prisma = new PrismaClient();

async function startJobs() {
  try {
    console.log('[Jobs Service] Initializing...');

    // Start all background jobs
    startReportJob();

    console.log('[Jobs Service] All jobs started ✓');
  } catch (error) {
    console.error('[Jobs Service] Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Jobs Service] SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Jobs Service] SIGINT received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

startJobs();
