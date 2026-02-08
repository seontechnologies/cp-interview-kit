import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app, { prisma } from '../src/index';

// Mock encryption utilities
const mockHashPassword = jest.fn();
const mockVerifyPassword = jest.fn();
const mockGenerateRandomToken = jest.fn();

jest.mock('../src/utils/encryption', () => ({
  hashPassword: (password: string) => mockHashPassword(password),
  verifyPassword: (password: string, hash: string) =>
    mockVerifyPassword(password, hash),
  generateToken: () => mockGenerateRandomToken(),
}));

// Mock the background jobs to prevent them from running during tests
jest.mock('../src/jobs/notifications', () => ({
  startNotificationJob: jest.fn(),
}));

jest.mock('../src/jobs/reports', () => ({
  startReportJob: jest.fn(),
}));

// Mock rate limiters to avoid rate limit issues in tests
jest.mock('../src/middleware/rateLimit', () => ({
  rateLimiter: (req: any, res: any, next: any) => next(),
  authRateLimiter: (req: any, res: any, next: any) => next(),
}));

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHashPassword.mockReturnValue('hashed_password');
    mockVerifyPassword.mockReturnValue(true);
    mockGenerateRandomToken.mockReturnValue('random_token_123');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        isActive: true,
        role: 'member',
        organizationId: 'org-1',
        name: 'Test User',
        lastLoginAt: new Date(),
        organization: {
          id: 'org-1',
          name: 'Test Org',
          slug: 'test-org',
          tier: 'free',
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.session, 'create').mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        token: 'random_token_123',
        expiresAt: new Date(),
        createdAt: new Date(),
      } as any);

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.organizationId).toBe('org-1');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { organization: true },
      });
      expect(prisma.session.create).toHaveBeenCalled();
    });

    it('should reject invalid credentials when user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const response = await request(app).post('/api/auth/login').send({
        email: 'invalid@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should reject invalid credentials when password is wrong', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        isActive: true,
        role: 'member',
        organizationId: 'org-1',
        organization: { id: 'org-1', name: 'Test Org' },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      mockVerifyPassword.mockReturnValue(false);

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should reject login for inactive user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        isActive: false,
        role: 'member',
        organizationId: 'org-1',
        organization: { id: 'org-1', name: 'Test Org' },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Account is deactivated');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user with organization', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.organization, 'create').mockResolvedValue({
        id: 'org-1',
        name: 'New Org',
        slug: 'new-org',
        tier: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jest.spyOn(prisma.user, 'create').mockResolvedValue({
        id: 'user-1',
        email: 'new@example.com',
        name: 'New User',
        role: 'owner',
        organizationId: 'org-1',
        passwordHash: 'hashed_password',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const response = await request(app).post('/api/auth/register').send({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        organizationName: 'New Org',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('organization');
      expect(response.body.user.email).toBe('new@example.com');
      expect(response.body.user.role).toBe('owner');
      expect(response.body.organization.name).toBe('New Org');
    });

    it('should reject registration with existing email', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
      } as any);

      const response = await request(app).post('/api/auth/register').send({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        organizationName: 'Test Org',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email already registered');
    });

    it('should reject registration without organization name', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const response = await request(app).post('/api/auth/register').send({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'Organization name required'
      );
    });

    it('should reject registration with existing organization slug', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue({
        id: 'org-1',
        slug: 'existing-org',
      } as any);

      const response = await request(app).post('/api/auth/register').send({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        organizationName: 'Existing Org',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'Organization name already taken'
      );
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      jest.spyOn(prisma.session, 'deleteMany').mockResolvedValue({ count: 1 });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer some_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Logged out successfully'
      );
    });

    it('should handle logout without token', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Logged out successfully'
      );
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should verify valid token', async () => {
      const jwt = require('jsonwebtoken');
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        isActive: true,
      };

      jest.spyOn(jwt, 'decode').mockReturnValue({ userId: 'user-1' });
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('valid', false);
    });

    it('should reject invalid token', async () => {
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'decode').mockReturnValue(null);

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('valid', false);
    });

    it('should reject token for inactive user', async () => {
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'decode').mockReturnValue({ userId: 'user-1' });
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-1',
        isActive: false,
      } as any);

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('valid', false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token for valid user', async () => {
      const jwt = require('jsonwebtoken');
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        organizationId: 'org-1',
        role: 'member',
        isActive: true,
        organization: { id: 'org-1', name: 'Test Org' },
      };

      jest.spyOn(jwt, 'decode').mockReturnValue({ userId: 'user-1' });
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer old_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should reject refresh without token', async () => {
      const response = await request(app).post('/api/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should reject refresh for inactive user', async () => {
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'decode').mockReturnValue({ userId: 'user-1' });
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-1',
        isActive: false,
      } as any);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        'error',
        'User not found or inactive'
      );
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should handle forgot password request', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      } as any);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should not reveal if user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should accept valid reset password request', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid_reset_token',
          newPassword: 'newpassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Password reset successfully'
      );
    });

    it('should reject reset without token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ newPassword: 'newpassword123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'Token and new password required'
      );
    });

    it('should reject reset without new password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid_token' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'Token and new password required'
      );
    });
  });
});
