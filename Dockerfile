# Multi-stage build for Arjuna Analytics
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.0.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build stage
FROM base AS builder

# Build all packages and apps
RUN pnpm build

# Production stage for collector
FROM node:18-alpine AS collector

# Install pnpm
RUN npm install -g pnpm@10.0.0

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/
COPY apps/collector/package.json ./apps/collector/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built packages
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/collector/dist ./apps/collector/dist
COPY --from=builder /app/apps/collector/package.json ./apps/collector/

# Expose port
EXPOSE 3001

# Start collector
CMD ["node", "apps/collector/dist/index.js"]

# Production stage for dashboard
FROM node:18-alpine AS dashboard

# Install pnpm
RUN npm install -g pnpm@10.0.0

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/
COPY apps/dashboard/package.json ./apps/dashboard/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built packages and dashboard
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/dashboard/build ./apps/dashboard/build
COPY --from=builder /app/apps/dashboard/package.json ./apps/dashboard/

# Expose port
EXPOSE 3000

# Start dashboard
CMD ["node", "apps/dashboard/build/index.js"]

# All-in-one development stage
FROM base AS development

# Expose ports
EXPOSE 3000 3001

# Start development servers
CMD ["pnpm", "dev"]