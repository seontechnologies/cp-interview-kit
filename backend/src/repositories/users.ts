import { Prisma, PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

export const UserRepository = {
  /**
   * Find user by ID
   */
  async findById(id: string, orgId?: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        id,
        ...(orgId && { organizationId: orgId })
      }
    });
  },

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email }
    });
  },

  /**
   * Search users by name or email
   */
  async search(searchTerm: string, orgId: string): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      orderBy: { name: 'asc' }
    });
  },

  /**
   * Get all users in an organization
   */
  async findByOrganization(orgId: string, options?: { includeInactive?: boolean }): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        organizationId: orgId,
        ...(options?.includeInactive ? {} : { isActive: true })
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  /**
   * Create a new user
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },

  /**
   * Update user
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data
    });
  },

  /**
   * Update last login time
   */
  async updateLastLogin(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() }
    });
  },

  /**
   * Delete user (soft delete by marking inactive)
   */
  async softDelete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { isActive: false }
    });
  },

  /**
   * Permanently delete user
   */
  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id }
    });
  },

  /**
   * Count users in organization
   */
  async countByOrganization(orgId: string): Promise<number> {
    return prisma.user.count({
      where: {
        organizationId: orgId,
        isActive: true
      }
    });
  }
};
