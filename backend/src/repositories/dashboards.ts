import { Dashboard, Prisma, PrismaClient, Widget } from '@prisma/client';

const prisma = new PrismaClient();

export type DashboardWithWidgets = Dashboard & { widgets: Widget[] };
export type DashboardWithCreator = Dashboard & { createdBy: { id: string; name: string; email: string } };

export const DashboardRepository = {
  /**
   * Find dashboard by ID
   */
  async findById(id: string, orgId?: string, includeWidgets = false): Promise<DashboardWithWidgets | Dashboard | null> {
    return prisma.dashboard.findFirst({
      where: {
        id,
        ...(orgId && { organizationId: orgId })
      },
      include: {
        ...(includeWidgets && { widgets: true })
      }
    }) as Promise<DashboardWithWidgets | Dashboard | null>;
  },

  /**
   * Find all dashboards in organization
   */
  async findByOrganization(
    orgId: string,
    options?: {
      includeWidgets?: boolean;
      includePublicOnly?: boolean;
      createdById?: string;
    }
  ): Promise<Dashboard[] | DashboardWithWidgets[]> {
    return prisma.dashboard.findMany({
      where: {
        organizationId: orgId,
        ...(options?.includePublicOnly && { isPublic: true }),
        ...(options?.createdById && { createdById: options.createdById })
      },
      include: {
        ...(options?.includeWidgets && { widgets: true })
      },
      orderBy: { updatedAt: 'desc' }
    });
  },

  /**
   * Create dashboard
   */
  async create(data: Prisma.DashboardCreateInput): Promise<Dashboard> {
    return prisma.dashboard.create({ data });
  },

  /**
   * Update dashboard
   */
  async update(id: string, orgId: string, data: Prisma.DashboardUpdateInput): Promise<Dashboard> {
    return prisma.dashboard.update({
      where: {
        id,
        organizationId: orgId
      } as any,
      data
    });
  },

  /**
   * Delete dashboard
   */
  async delete(id: string, orgId: string): Promise<Dashboard> {
    return prisma.dashboard.delete({
      where: {
        id,
        organizationId: orgId
      } as any
    });
  },

  /**
   * Search dashboards by name
   */
  async search(searchTerm: string, orgId: string): Promise<Dashboard[]> {
    return prisma.dashboard.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      orderBy: { updatedAt: 'desc' }
    });
  },

  /**
   * Count dashboards in organization
   */
  async countByOrganization(orgId: string): Promise<number> {
    return prisma.dashboard.count({
      where: { organizationId: orgId }
    });
  },

  /**
   * Query with dynamic filters
   */
  async query(filters: {
    id?: string;
    name?: string;
    organizationId?: string;
    createdById?: string;
    isPublic?: boolean;
    layout?: string;
  }): Promise<Dashboard[]> {
    const where: Prisma.DashboardWhereInput = {};

    if (filters.id) where.id = filters.id;
    if (filters.name) where.name = filters.name;
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.createdById) where.createdById = filters.createdById;
    if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;
    if (filters.layout) where.layout = filters.layout;

    return prisma.dashboard.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    });
  }
};
