FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy backend prisma schema FIRST (before npm install runs postinstall)
COPY backend/prisma ./prisma

# Copy package files, build config, and setup script
COPY jobs/package.json jobs/tsconfig.json jobs/setup-prisma.js jobs/yarn.lock* jobs/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source
COPY jobs/src ./src

RUN npx prisma generate

# Run
CMD ["npm", "run", "dev"]
