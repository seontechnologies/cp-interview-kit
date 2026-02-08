/**
 * Not a full repository pattern, but something lightweight to start with
 */

export { AnalyticsRepository } from './analytics';
export { AuditLogRepository } from './audit';
export { DashboardRepository } from './dashboards';
export { UserRepository } from './users';

// Re-export types
export type { AnalyticsByDateResult, EventTypeCount } from './analytics';
export type { AuditLogWithUser } from './audit';
export type { DashboardWithCreator, DashboardWithWidgets } from './dashboards';

