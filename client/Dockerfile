# ==============================================================================
# BMSET Hostel Management System — Frontend Client Dockerfile
# Multi-stage production build (Node 22 -> Nginx Alpine)
# ==============================================================================

# Stage 1: Build Vite React App
FROM node:22-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_API_URL=/api/v1
ARG VITE_RAZORPAY_KEY_ID=""

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

# Copy package descriptors
COPY package*.json ./
RUN npm ci

# Copy source code and config
COPY . .

# Build production bundle
RUN npm run build

# ==============================================================================
# Stage 2: Nginx Web Server
# ==============================================================================
FROM nginx:alpine AS runner

# Copy customized Nginx server configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
