# ==============================================================================
# BMSET Hostel Management System — Backend API Dockerfile
# Multi-stage production build (Node 22 Alpine)
# ==============================================================================

# Stage 1: Build & Prisma Generate
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache openssl libc6-compat

# Copy package descriptors
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for tsc)
RUN npm ci

# Copy Prisma schema and source code
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client & compile TypeScript
RUN npx prisma generate
RUN npm run build

# Prune devDependencies for production image
RUN npm prune --production

# ==============================================================================
# Stage 2: Minimal Production Runtime
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5001

RUN apk add --no-cache openssl libc6-compat

# Create non-root user for container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy package descriptors and node_modules from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Ensure upload directory exists and is owned by appuser
RUN mkdir -p uploads && chown -R appuser:nodejs uploads

USER appuser

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api/v1/health || exit 1

CMD ["node", "dist/src/server.js"]
