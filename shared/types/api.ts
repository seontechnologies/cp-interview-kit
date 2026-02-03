// ============================================
// User & Authentication Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  organization: Organization;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
  organization: Organization;
}

export interface TokenVerifyResponse {
  valid: boolean;
  user?: User;
}

// ============================================
// Organization Types
// ============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: SubscriptionTier;
  monthlyBudget: number;
  currentSpend: number;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface OrganizationStats {
  userCount: number;
  dashboardCount: number;
  eventCount: number;
}

export interface CreateOrganizationRequest {
  name: string;
  slug?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  monthlyBudget?: number;
}

export interface InviteMemberRequest {
  email: string;
  name: string;
  role?: UserRole;
}

export interface InviteMemberResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  temporaryPassword?: string;
}

// ============================================
// Dashboard Types
// ============================================

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdById: string;
  createdBy?: User;
  isPublic: boolean;
  layout: DashboardLayout;
  settings: DashboardSettings;
  widgets: Widget[];
  createdAt: string;
  updatedAt: string;
}

export type DashboardLayout = 'grid' | 'list' | 'freeform';

export interface DashboardSettings {
  refreshInterval?: number;
  theme?: 'light' | 'dark' | 'auto';
  dateRange?: DateRange;
}

export interface CreateDashboardRequest {
  name: string;
  description?: string;
  layout?: DashboardLayout;
}

export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  layout?: DashboardLayout;
  settings?: Partial<DashboardSettings>;
  isPublic?: boolean;
}

// ============================================
// Widget Types
// ============================================

export interface Widget {
  id: string;
  name: string;
  type: WidgetType;
  config: WidgetConfig;
  position: WidgetPosition;
  dashboardId: string;
  organizationId: string;
  dataSource?: string;
  refreshInterval: number;
  createdAt: string;
  updatedAt: string;
}

export type WidgetType = 'chart' | 'metric' | 'table' | 'text';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  // Chart widget
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  colors?: string[];

  // Metric widget
  metric?: string;
  format?: 'number' | 'currency' | 'percentage';
  prefix?: string;
  suffix?: string;
  comparison?: {
    value: number;
    label: string;
  };

  // Table widget
  columns?: TableColumn[];
  sortable?: boolean;
  pageSize?: number;

  // Text widget
  content?: string;

  // Common
  title?: string;
  description?: string;
}

export interface TableColumn {
  key: string;
  label: string;
  format?: 'string' | 'number' | 'date' | 'json' | 'boolean';
  width?: number;
  sortable?: boolean;
}

export interface CreateWidgetRequest {
  name: string;
  type: WidgetType;
  config?: WidgetConfig;
  position?: WidgetPosition;
  dataSource?: string;
  refreshInterval?: number;
}

export interface UpdateWidgetRequest {
  name?: string;
  type?: WidgetType;
  config?: WidgetConfig;
  position?: WidgetPosition;
  dataSource?: string;
  refreshInterval?: number;
}

export interface WidgetDataResponse {
  widget: Widget;
  data: any;
}

// ============================================
// Analytics Types
// ============================================

export interface AnalyticsEvent {
  id: string;
  organizationId: string;
  eventType: string;
  eventName: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  source: EventSource;
}

export type EventSource = 'api' | 'sdk' | 'webhook' | 'import';

export interface TrackEventRequest {
  eventType: string;
  eventName: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}

export interface TrackEventResponse {
  id: string;
  success: boolean;
}

export interface BatchTrackRequest {
  events: TrackEventRequest[];
}

export interface BatchTrackResponse {
  count: number;
}

export interface AnalyticsStatsResponse {
  totalEvents: number;
  eventsByType: Array<{
    eventType: string;
    _count: number;
  }>;
  recentEvents: AnalyticsEvent[];
  period: string;
}

export interface FunnelRequest {
  steps: string[];
  startDate?: string;
  endDate?: string;
}

export interface FunnelResponse {
  step: string;
  count: number;
}

export interface RealtimeMetrics {
  count: number;
  byMinute: Record<string, number>;
  events: AnalyticsEvent[];
}

// ============================================
// Billing Types
// ============================================

export interface BillingOverview {
  tier: SubscriptionTier;
  monthlyBudget: number;
  currentSpend: number;
  usage: Record<string, number>;
  invoices: Invoice[];
  hasPaymentMethod: boolean;
}

export interface Invoice {
  id: string;
  organizationId: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'failed';

export interface UsageRecord {
  id: string;
  organizationId: string;
  metric: string;
  value: number;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export interface PricingTier {
  name: string;
  price: number;
  features: {
    events: number;
    dashboards: number;
    users: number;
    retention: number;
  };
}

export interface PricingResponse {
  free: PricingTier;
  starter: PricingTier;
  pro: PricingTier;
  enterprise: PricingTier;
}

export interface UpgradeRequest {
  tier: SubscriptionTier;
  paymentMethodId?: string;
}

export interface RecordUsageRequest {
  metric: string;
  value: number;
}

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface CreateNotificationRequest {
  userId?: string;
  type?: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    digest: 'immediate' | 'daily' | 'weekly' | 'never';
    types: string[];
  };
  inApp: {
    enabled: boolean;
    types: string[];
  };
  push: {
    enabled: boolean;
  };
}

// ============================================
// Audit Log Types
// ============================================

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  user?: User;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogFilters {
  action?: string;
  resourceType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface AuditLogStats {
  totalLogs: number;
  byAction: Array<{ action: string; _count: number }>;
  byUser: Array<{ userId: string; _count: number }>;
  byResource: Array<{ resourceType: string; _count: number }>;
  period: string;
}

// ============================================
// API Key Types
// ============================================

export interface ApiKey {
  id: string;
  name: string;
  key?: string; // Only returned on creation
  organizationId: string;
  createdById: string;
  createdBy?: User;
  permissions: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  expiresInDays?: number;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  expiresAt?: string;
}

// ============================================
// Webhook Types
// ============================================

export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  organizationId: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  events?: string[];
}

export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  events?: string[];
  isActive?: boolean;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, any>;
  statusCode?: number;
  response?: string;
  success: boolean;
  deliveredAt: string;
}

export interface WebhookTestResult {
  success: boolean;
  statusCode?: number;
  response?: string;
  error?: string;
}

// ============================================
// Common Types
// ============================================

export interface DateRange {
  start: string;
  end: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  stack?: string;
}

export interface SuccessResponse {
  message: string;
}

// ============================================
// WebSocket Message Types
// ============================================

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data?: any;
}

export type WebSocketMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'dashboard_update'
  | 'widget_update'
  | 'new_notification'
  | 'broadcast_notification'
  | 'dashboard_created'
  | 'user_joined'
  | 'user_left';

export interface DashboardUpdateMessage {
  dashboardId: string;
  widgetId?: string;
  action: 'created' | 'updated' | 'deleted';
  data?: any;
}

// ============================================
// Comment Types
// ============================================

export interface Comment {
  id: string;
  content: string;
  userId: string;
  user?: User;
  resourceType: string;
  resourceId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  resourceType: string;
  resourceId: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// ============================================
// Export Types
// ============================================

export interface ExportRequest {
  format: 'csv' | 'json';
  startDate?: string;
  endDate?: string;
}

export type ExportFormat = 'csv' | 'json';
