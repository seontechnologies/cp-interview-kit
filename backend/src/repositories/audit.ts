import { AuditLog, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AuditLogWithUser = AuditLog & {
  user: { id: string; name: string; email: string };
};

export const AuditLogRepository = {
  /**
   * Create audit log entry
   */
  async create(data: Prisma.AuditLogCreateInput): Promise<AuditLog> {
    return prisma.auditLog.create({ data });
  },

  /**
   * Find audit logs with filters
   */
  async findMany(
    orgId: string,
    options?: {
      action?: string;
      resourceType?: string;
      resourceId?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      orderBy?: 'createdAt' | 'action' | 'resourceType' | 'userId';
      order?: 'asc' | 'desc';
      limit?: number;
      includeUser?: boolean;
    }
  ): Promise<AuditLog[] | AuditLogWithUser[]> {
    const where: Prisma.AuditLogWhereInput = {
      organizationId: orgId
    };

    if (options?.action) where.action = options.action;
    if (options?.resourceType) where.resourceType = options.resourceType;
    if (options?.resourceId) where.resourceId = options.resourceId;
    if (options?.userId) where.userId = options.userId;

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    return prisma.auditLog.findMany({
      where,
      include: {
        user: options?.includeUser
          ? {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          : false
      },
      orderBy: {
        [options?.orderBy || 'createdAt']: options?.order || 'desc'
      },
      take: options?.limit
    }) as Promise<AuditLog[] | AuditLogWithUser[]>;
  },

  /**
   * Get audit logs with user info (shorthand)
   */
  async findManyWithUser(
    orgId: string,
    orderBy: 'createdAt' | 'action' | 'resourceType' | 'userId' = 'createdAt',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<AuditLogWithUser[]> {
    return prisma.auditLog.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        [orderBy]: order
      }
    }) as Promise<AuditLogWithUser[]>;
  },

  /**
   * Search audit logs
   */
  async search(orgId: string, searchQuery: string, limit = 100): Promise<AuditLogWithUser[]> {
    return prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { action: { contains: searchQuery, mode: 'insensitive' } },
          { resourceType: { contains: searchQuery, mode: 'insensitive' } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    }) as Promise<AuditLogWithUser[]>;
  },

  /**
   * Get logs for a specific resource
   */
  async findByResource(
    orgId: string,
    resourceType: string,
    resourceId: string,
    limit = 50
  ): Promise<AuditLogWithUser[]> {
    return prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        resourceType,
        resourceId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    }) as Promise<AuditLogWithUser[]>;
  },

  /**
   * Get logs for a specific user
   */
  async findByUser(userId: string, limit = 100): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  },

  /**
   * Get statistics
   */
  async getStats(
    orgId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    totalLogs: number;
    byAction: Array<{ action: string; _count: number }>;
    byUser: Array<{ userId: string; _count: number }>;
    byResource: Array<{ resourceType: string; _count: number }>;
  }> {
    const where: Prisma.AuditLogWhereInput = {
      organizationId: orgId
    };

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [totalLogs, byAction, byUser, byResource] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      }),
      prisma.auditLog.groupBy({
        by: ['resourceType'],
        where,
        _count: true,
        orderBy: { _count: { resourceType: 'desc' } }
      })
    ]);

    return {
      totalLogs,
      byAction,
      byUser,
      byResource
    };
  },

  /**
   * Delete old logs
   */
  async deleteOlderThan(orgId: string, beforeDate: Date): Promise<number> {
    const result = await prisma.auditLog.deleteMany({
      where: {
        organizationId: orgId,
        createdAt: { lt: beforeDate }
      }
    });

    return result.count;
  }
};
