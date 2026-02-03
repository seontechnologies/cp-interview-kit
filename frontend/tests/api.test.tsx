import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: () => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }),
  },
}));

describe('API Service', () => {
  describe('User Operations', () => {
    it('should export changePassword function', async () => {
      const { changePassword } = await import('../src/services/api');
      expect(changePassword).toBeDefined();
      expect(typeof changePassword).toBe('function');
    });

    it('should export deleteAccount function', async () => {
      const { deleteAccount } = await import('../src/services/api');
      expect(deleteAccount).toBeDefined();
      expect(typeof deleteAccount).toBe('function');
    });

    it('should export fetchUserPreferences function', async () => {
      const { fetchUserPreferences } = await import('../src/services/api');
      expect(fetchUserPreferences).toBeDefined();
      expect(typeof fetchUserPreferences).toBe('function');
    });

    it('should export fetchUserSessions function', async () => {
      const { fetchUserSessions } = await import('../src/services/api');
      expect(fetchUserSessions).toBeDefined();
      expect(typeof fetchUserSessions).toBe('function');
    });
  });

  describe('Organization Operations', () => {
    it('should export updateOrganization function', async () => {
      const { updateOrganization } = await import('../src/services/api');
      expect(updateOrganization).toBeDefined();
      expect(typeof updateOrganization).toBe('function');
    });

    it('should export fetchApiKeys function', async () => {
      const { fetchApiKeys } = await import('../src/services/api');
      expect(fetchApiKeys).toBeDefined();
      expect(typeof fetchApiKeys).toBe('function');
    });

    it('should export transferOwnership function', async () => {
      const { transferOwnership } = await import('../src/services/api');
      expect(transferOwnership).toBeDefined();
      expect(typeof transferOwnership).toBe('function');
    });
  });

  describe('Webhook Operations', () => {
    it('should export fetchWebhooks function', async () => {
      const { fetchWebhooks } = await import('../src/services/api');
      expect(fetchWebhooks).toBeDefined();
      expect(typeof fetchWebhooks).toBe('function');
    });

    it('should export createWebhook function', async () => {
      const { createWebhook } = await import('../src/services/api');
      expect(createWebhook).toBeDefined();
      expect(typeof createWebhook).toBe('function');
    });

    it('should export regenerateWebhookSecret function', async () => {
      const { regenerateWebhookSecret } = await import('../src/services/api');
      expect(regenerateWebhookSecret).toBeDefined();
      expect(typeof regenerateWebhookSecret).toBe('function');
    });

    it('should export testWebhook function', async () => {
      const { testWebhook } = await import('../src/services/api');
      expect(testWebhook).toBeDefined();
      expect(typeof testWebhook).toBe('function');
    });
  });

  describe('Audit Log Operations', () => {
    it('should export searchAuditLogs function', async () => {
      const { searchAuditLogs } = await import('../src/services/api');
      expect(searchAuditLogs).toBeDefined();
      expect(typeof searchAuditLogs).toBe('function');
    });

    it('should export exportAuditLogs function', async () => {
      const { exportAuditLogs } = await import('../src/services/api');
      expect(exportAuditLogs).toBeDefined();
      expect(typeof exportAuditLogs).toBe('function');
    });

    it('should export cleanupAuditLogs function', async () => {
      const { cleanupAuditLogs } = await import('../src/services/api');
      expect(cleanupAuditLogs).toBeDefined();
      expect(typeof cleanupAuditLogs).toBe('function');
    });
  });

  describe('Billing Operations', () => {
    it('should export setBudgetAlert function', async () => {
      const { setBudgetAlert } = await import('../src/services/api');
      expect(setBudgetAlert).toBeDefined();
      expect(typeof setBudgetAlert).toBe('function');
    });

    it('should export updatePaymentMethod function', async () => {
      const { updatePaymentMethod } = await import('../src/services/api');
      expect(updatePaymentMethod).toBeDefined();
      expect(typeof updatePaymentMethod).toBe('function');
    });
  });

  describe('Dashboard Operations', () => {
    it('should export duplicateDashboard function', async () => {
      const { duplicateDashboard } = await import('../src/services/api');
      expect(duplicateDashboard).toBeDefined();
      expect(typeof duplicateDashboard).toBe('function');
    });

    it('should export shareDashboard function', async () => {
      const { shareDashboard } = await import('../src/services/api');
      expect(shareDashboard).toBeDefined();
      expect(typeof shareDashboard).toBe('function');
    });

    it('should export fetchSharedDashboard function', async () => {
      const { fetchSharedDashboard } = await import('../src/services/api');
      expect(fetchSharedDashboard).toBeDefined();
      expect(typeof fetchSharedDashboard).toBe('function');
    });
  });

  describe('Notification Operations', () => {
    it('should export markAllNotificationsRead function', async () => {
      const { markAllNotificationsRead } = await import('../src/services/api');
      expect(markAllNotificationsRead).toBeDefined();
      expect(typeof markAllNotificationsRead).toBe('function');
    });

    it('should export clearAllNotifications function', async () => {
      const { clearAllNotifications } = await import('../src/services/api');
      expect(clearAllNotifications).toBeDefined();
      expect(typeof clearAllNotifications).toBe('function');
    });

    it('should export fetchNotificationPreferences function', async () => {
      const { fetchNotificationPreferences } = await import('../src/services/api');
      expect(fetchNotificationPreferences).toBeDefined();
      expect(typeof fetchNotificationPreferences).toBe('function');
    });
  });

  describe('Comment Operations', () => {
    it('should export fetchComments function', async () => {
      const { fetchComments } = await import('../src/services/api');
      expect(fetchComments).toBeDefined();
      expect(typeof fetchComments).toBe('function');
    });

    it('should export createComment function', async () => {
      const { createComment } = await import('../src/services/api');
      expect(createComment).toBeDefined();
      expect(typeof createComment).toBe('function');
    });

    it('should export deleteComment function', async () => {
      const { deleteComment } = await import('../src/services/api');
      expect(deleteComment).toBeDefined();
      expect(typeof deleteComment).toBe('function');
    });
  });
});
