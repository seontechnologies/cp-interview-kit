# API Documentation

_Version: 2.1.1_

Base URL: `http://localhost:3001/api`

## Authentication

All endpoints except `/auth/*` require authentication via Bearer token:

```
Authorization: Bearer <token>
```

Tokens expire after 1 hour. Use the refresh endpoint to get a new token.

---

## Adding Documentation to Routes

To document an endpoint, add a JSDoc comment above the route handler:

```typescript
/**
 * @openapi
 * /api/dashboards:
 *   get:
 *     summary: Get all dashboards
 *     description: Retrieve all dashboards for the authenticated user's organization
 *     tags:
 *       - Dashboards
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of dashboards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dashboard'
 */
router.get('/', async (req, res) => {
  // ... implementation
});
```

Changes will be reflected in Swagger UI which is available at /api-docs only in dev mode.

---

TODO: With Swagger UI, you don't need to document routes manually like this, which creates inconsistencies:

## Endpoints

### Auth

#### POST /auth/login

Login with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "token": "eyJhbG...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "member"
  }
}
```

#### POST /auth/register

Register a new user and organization.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "organizationName": "My Company"
}
```

#### POST /auth/refresh

Refresh an expired token.

**Request:**

```json
{
  "refreshToken": "..."
}
```

#### POST /auth/logout

Invalidate current session.

---

### Dashboards

#### GET /dashboards

List all dashboards for current organization.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sort` (default: "createdAt")
- `order` (default: "desc")

**Response:**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### POST /dashboards

Create a new dashboard.

**Request:**

```json
{
  "name": "My Dashboard",
  "description": "Optional description",
  "layout": "grid"
}
```

#### GET /dashboards/:id

Get dashboard with all widgets.

#### PUT /dashboards/:id

Update dashboard properties.

#### DELETE /dashboards/:id

Delete dashboard (requires owner/admin role).

---

### Widgets

#### POST /dashboards/:id/widgets

Add widget to dashboard.

**Request:**

```json
{
  "name": "Revenue Chart",
  "type": "chart",
  "config": {
    "chartType": "line",
    "dataSource": "analytics",
    "metric": "revenue"
  },
  "position": { "x": 0, "y": 0, "w": 6, "h": 4 }
}
```

#### PUT /dashboards/:dashboardId/widgets/:widgetId

Update widget configuration.

#### DELETE /dashboards/:dashboardId/widgets/:widgetId

Remove widget from dashboard.

---

### Analytics

#### POST /analytics/track

Track an analytics event.

**Request:**

```json
{
  "eventType": "page_view",
  "eventName": "dashboard_viewed",
  "properties": {
    "dashboardId": "uuid",
    "duration": 1234
  },
  "userId": "optional-user-id",
  "sessionId": "optional-session-id"
}
```

#### POST /analytics/track/batch

Track multiple events at once (max 100 per request).

**Request:**

```json
{
  "events": [
    { "eventType": "...", "eventName": "...", "properties": {} },
    { "eventType": "...", "eventName": "...", "properties": {} }
  ]
}
```

#### GET /analytics/data

Query analytics data.

**Query Parameters:**

- `eventType` - Filter by event type
- `startDate` - ISO date string
- `endDate` - ISO date string
- `groupBy` - Group results (hour, day, week, month)

#### GET /analytics/stats

Get aggregated statistics.

**Query Parameters:**

- `period` - Time period (day, week, month, year)

---

### Organizations

#### GET /organizations/current

Get current organization details.

#### PUT /organizations/current

Update organization (owner/admin only).

**Request:**

```json
{
  "name": "New Name",
  "slug": "new-slug"
}
```

#### GET /organizations/members

List organization members.

#### POST /organizations/invite

Invite a new member.

**Request:**

```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "role": "member"
}
```

---

### Users

#### GET /users/me

Get current user profile.

#### PUT /users/me

Update current user profile.

#### PUT /users/me/password

Change password.

**Request:**

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

---

### Billing

#### GET /billing/overview

Get billing summary and current usage.

#### GET /billing/invoices

List invoices.

#### POST /billing/subscribe

Subscribe to a plan.

**Request:**

```json
{
  "plan": "pro",
  "paymentMethodId": "pm_..."
}
```

---

### Notifications

#### GET /notifications

List notifications for current user.

**Query Parameters:**

- `unreadOnly` (default: false)
- `limit` (default: 20)

#### PUT /notifications/:id/read

Mark notification as read.

#### POST /notifications/mark-all-read

Mark all notifications as read.

---

### Webhooks

#### GET /webhooks

List configured webhooks.

#### POST /webhooks

Create a new webhook.

**Request:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["dashboard.created", "dashboard.updated"],
  "secret": "optional-signing-secret"
}
```

#### DELETE /webhooks/:id

Delete a webhook.

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code             | HTTP Status | Description              |
| ---------------- | ----------- | ------------------------ |
| UNAUTHORIZED     | 401         | Missing or invalid token |
| FORBIDDEN        | 403         | Insufficient permissions |
| NOT_FOUND        | 404         | Resource not found       |
| VALIDATION_ERROR | 400         | Invalid request body     |
| RATE_LIMITED     | 429         | Too many requests        |
| INTERNAL_ERROR   | 500         | Server error             |

---

## Rate Limits

- Standard endpoints: 100 requests/minute
- Auth endpoints: 10 requests/minute
- Analytics tracking: 1000 requests/minute
- Batch endpoints: 10 requests/minute

Rate limit headers included in responses:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Webhooks

Webhook payloads are signed using HMAC-SHA256. Verify the signature using the `X-Webhook-Signature` header:

```javascript
const crypto = require('crypto');
const signature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
const isValid = signature === req.headers['x-webhook-signature'];
```

---

_Note: This documentation may not reflect the latest API changes. When in doubt, check the source code._
