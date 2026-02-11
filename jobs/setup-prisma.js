#!/usr/bin/env node

/**
 * Setup script to copy the Prisma schema from the backend
 * Works on Windows and Unix-like systems
 * Gracefully handles Docker builds where schema is copied separately
 */

const fs = require('fs');
const path = require('path');

const sourceSchema = path.join(
  __dirname,
  '..',
  'backend',
  'prisma',
  'schema.prisma'
);
const targetDir = path.join(__dirname, 'prisma');
const targetSchema = path.join(targetDir, 'schema.prisma');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Only copy if source exists (skip in Docker builds where it's copied separately)
if (fs.existsSync(sourceSchema)) {
  try {
    fs.copyFileSync(sourceSchema, targetSchema);
    console.log('✓ Prisma schema synced from backend');
  } catch (error) {
    console.error('✗ Failed to sync Prisma schema:', error.message);
    process.exit(1);
  }
} else if (!fs.existsSync(targetSchema)) {
  // Only warn if schema doesn't exist at all
  console.warn(
    '⚠ Prisma schema not found - it will be copied during Docker build'
  );
}
