import { AnalyticsEvent, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AnalyticsByDateResult = {
  date: Date;
  eventType: string;
  count: bigint;
};

export type EventTypeCount = {
  eventType: string;
  _count: number;
};

export const AnalyticsRepository = {
  /**
   * Track a single event
   */
  async trackEvent(data: Prisma.AnalyticsEventCreateInput): Promise<AnalyticsEvent> {
    return prisma.analyticsEvent.create({ data });
  },

  /**
   * Track multiple events in bulk
   */
  async trackBulk(
    events: Array<{
      organizationId: string;
      eventType: string;
      eventName: string;
      properties: any;
      userId?: string;
      sessionId?: string;
      timestamp?: Date;
    }>
  ): Promise<number> {
    const result = await prisma.analyticsEvent.createMany({
      data: events.map((e) => ({
        organizationId: e.organizationId,
        eventType: e.eventType,
        eventName: e.eventName,
        properties: e.properties,
        userId: e.userId,
        sessionId: e.sessionId,
        timestamp: e.timestamp || new Date(),
        source: 'api'
      })),
      skipDuplicates: true
    });

    return result.count;
  },

  /**
   * Get events with filters
   */
  async findMany(
    orgId: string,
    options?: {
      eventType?: string;
      eventName?: string;
      userId?: string;
      sessionId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<AnalyticsEvent[]> {
    const where: Prisma.AnalyticsEventWhereInput = {
      organizationId: orgId
    };

    if (options?.eventType) where.eventType = options.eventType;
    if (options?.eventName) where.eventName = options.eventName;
    if (options?.userId) where.userId = options.userId;
    if (options?.sessionId) where.sessionId = options.sessionId;

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    return prisma.analyticsEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options?.limit || 100
    });
  },

  /**
   * Search events by name or properties
   */
  async search(orgId: string, searchQuery: string, limit = 1000): Promise<AnalyticsEvent[]> {
    return prisma.analyticsEvent.findMany({
      where: {
        organizationId: orgId,
        eventName: {
          contains: searchQuery,
          mode: 'insensitive'
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  },

  /**
   * Get aggregated analytics by date
   */
  async getByDateRange(
    orgId: string,
    eventType: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsByDateResult[]> {
    return prisma.$queryRaw<AnalyticsByDateResult[]>`
      SELECT
        DATE_TRUNC('day', timestamp) as date,
        "eventType",
        COUNT(*) as count
      FROM "AnalyticsEvent"
      WHERE "organizationId" = ${orgId}
      AND "eventType" = ${eventType}
      AND timestamp >= ${startDate}
      AND timestamp <= ${endDate}
      GROUP BY DATE_TRUNC('day', timestamp), "eventType"
      ORDER BY date DESC
    `;
  },

  /**
   * Count events
   */
  async count(
    orgId: string,
    options?: {
      eventType?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<number> {
    const where: Prisma.AnalyticsEventWhereInput = {
      organizationId: orgId
    };

    if (options?.eventType) where.eventType = options.eventType;

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options?.startDate) where.timestamp.gte = options.startDate;
      if (options?.endDate) where.timestamp.lte = options.endDate;
    }

    return prisma.analyticsEvent.count({ where });
  },

  /**
   * Group events by type
   */
  async groupByType(
    orgId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<Array<{ eventType: string; _count: { _all: number } }>> {
    const where: any = {
      organizationId: orgId
    };

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options?.startDate) where.timestamp.gte = options.startDate;
      if (options?.endDate) where.timestamp.lte = options.endDate;
    }

    return (prisma.analyticsEvent.groupBy as any)({
      by: ['eventType'],
      where,
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      },
      take: options?.limit || 10
    });
  },

  /**
   * Delete old events (for cleanup)
   */
  async deleteOlderThan(orgId: string, beforeDate: Date): Promise<number> {
    const result = await prisma.analyticsEvent.deleteMany({
      where: {
        organizationId: orgId,
        timestamp: { lt: beforeDate }
      }
    });

    return result.count;
  }
};
