# Architecture Overview

*Last updated: 2024-03*

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React     │  │   Zustand   │  │    React Query          │  │
│  │   Router    │  │   Store     │  │    (data fetching)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                          Backend                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Express   │  │   Auth      │  │    Background Jobs      │  │
│  │   Routes    │  │   (JWT)     │  │    (Bull Queue)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │     Redis       │  │   S3 Storage    │
│   (Primary DB)  │  │   (Cache/Queue) │  │   (Exports)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Key Components

### Frontend

**State Management**: We use Redux for global state with Redux Toolkit for simplified setup. React Query handles all server state and caching.

**Routing**: React Router v6 with protected routes. Authentication state is checked on each navigation.

**Styling**: TailwindCSS with custom design tokens defined in `tailwind.config.js`.

### Backend

**API Layer**: Express.js with route-level middleware for authentication and validation.

**Database**: PostgreSQL via Prisma ORM. All queries are parameterized to prevent SQL injection.

**Caching**: Redis is used for:
- Session storage
- API response caching (5 minute TTL)
- Rate limiting state
- Background job queues (Bull)

**Background Jobs**: Bull queue processes:
- Email sending
- Report generation
- Analytics aggregation
- Webhook delivery

### Data Flow

1. User authenticates via `/api/auth/login`
2. JWT token stored in httpOnly cookie
3. All subsequent requests include cookie automatically
4. Backend validates JWT on each request
5. Prisma queries include organization filter for tenant isolation

## Security Architecture

### Authentication
- bcrypt for password hashing (cost factor 12)
- JWT with RS256 signing
- Refresh token rotation
- Sessions stored in Redis with 7-day expiry

### Authorization
- Role-based access control (RBAC)
- Roles: Owner > Admin > Member > Viewer
- Permission checks at route level AND service level
- Organization ID validated on every query

### Data Protection
- AES-256-GCM for sensitive data encryption
- Encryption keys rotated quarterly
- PII fields encrypted at rest
- Audit log for all data access

## Scalability Considerations

### Horizontal Scaling
- Backend is stateless (session in Redis)
- Can run multiple instances behind load balancer
- Database connection pooling via PgBouncer

### Performance
- Database indexes on all foreign keys and common query patterns
- Query result caching with automatic invalidation
- Pagination enforced on all list endpoints (max 100 items)
- Background jobs for heavy operations

## Monitoring

- Prometheus metrics exposed at `/metrics`
- Grafana dashboards for:
  - Request latency (p50, p95, p99)
  - Error rates by endpoint
  - Database query performance
  - Cache hit rates
- PagerDuty integration for critical alerts

## Deployment

- Docker containers orchestrated via Kubernetes
- Blue-green deployments with automatic rollback
- Database migrations run as init containers
- Secrets managed via Vault

---

*Note: This document describes the intended architecture. Some features may be in development.*
