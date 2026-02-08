/**
 * What was here is gone.
 * For database operations, use the repository modules in src/repositories/
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export { prisma };
