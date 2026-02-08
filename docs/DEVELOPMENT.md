# Development Guide

## Prerequisites

- Node.js 20+ (we recommend using nvm)
- PostgreSQL 14+
- Redis 6+
- Docker (optional, for containerized development)

## Initial Setup

### 1. Clone and Install

```bash
git clone <repository>
cd insighthub
npm install  # Installs all workspace dependencies
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@localhost:5432/insighthub |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| JWT_SECRET | Secret for signing JWTs | any-long-random-string |
| ENCRYPTION_KEY | 32-byte key for data encryption | use `openssl rand -hex 32` |

### 3. Database Setup

```bash
cd backend

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed demo data
npx prisma db seed
```

### 4. Start Development Servers

```bash
# From root directory
npm run dev
```

This starts:
- Backend on http://localhost:3001
- Frontend on http://localhost:3000

Redis is not currently in use.

## Development Workflow

### Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `npm test`
4. TODO: Add linter: `npm run lint`
5. Commit with conventional commits: `git commit -m "feat: add new feature"`

### Database Changes

When modifying the Prisma schema:

```bash
# Create a migration
npx prisma migrate dev --name describe_your_change

# If you need to reset (WARNING: deletes all data)
npx prisma migrate reset
```

### Adding API Endpoints

1. Create route file in `backend/src/routes/`
2. Add route to `backend/src/index.ts`
3. Add TypeScript types to `shared/types/api.ts`
4. Update API documentation in `docs/API.md`

### Adding Frontend Components

1. Create component in appropriate directory under `frontend/src/components/`
2. Add TypeScript props interface
3. Add unit tests in `frontend/tests/`
4. Use existing design tokens from Tailwind config

## Testing

### Backend Tests

```bash
cd backend
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # Coverage report
```

Test files should be in `backend/tests/` and named `*.test.ts`.

### Frontend Tests

```bash
cd frontend
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

We use React Testing Library. Test files should be co-located with components or in `frontend/tests/`.

### E2E Tests

```bash
npm run test:e2e
```

E2E tests use Playwright and require the full stack to be running.

## Code Style

TODO: We will use ESLint and Prettier for code style. Prettier config is added in `.prettierrc`. ESLint configuration will be added later in the root `eslint.config.js`.


### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## Debugging

### Backend

TODO: Use the built-in Node.js debugger:

```bash
cd backend
npm run dev:debug
```

Then attach your IDE debugger to port 9229.

### Frontend

React DevTools and Redux DevTools are recommended browser extensions.

### Database

```bash
# Open Prisma Studio (database GUI)
cd backend
npx prisma studio
```

## Common Issues

### "Cannot connect to database"

1. Ensure PostgreSQL is running
2. Check DATABASE_URL in .env
3. Try: `docker-compose up -d postgres`

### "Redis connection refused"

1. Ensure Redis is running
2. Check REDIS_URL in .env
3. Try: `docker-compose up -d redis`

### "Module not found" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules */node_modules
npm install
```

### "Prisma client not generated"

```bash
cd backend
npx prisma generate
```

## Performance Profiling

### Backend

Use the `--inspect` flag and Chrome DevTools Performance tab.

### Frontend

React Profiler (in React DevTools) helps identify render performance issues.

### Database Queries

Enable Prisma query logging:

```typescript
// In backend/src/index.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## Deployment

TODO: See `docs/DEPLOYMENT.md` for production deployment instructions.

---

*Last updated: February 2026*
