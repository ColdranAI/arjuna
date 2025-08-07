# 🚀 Arjuna Analytics - Production Setup Guide

Complete guide to run both collector and dashboard apps in development and production.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Development Mode](#development-mode)
4. [Production Build](#production-build)
5. [Docker Deployment](#docker-deployment)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Docker & Docker Compose (for production)
- PostgreSQL & Redis (if running locally)

### 1. Clone and Install
```bash
git clone <your-repo>
cd arjuna
pnpm install  # or npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env with your values
nano .env
```

### 3. Run Development
```bash
# Option A: Run both apps separately
pnpm run dev:collector  # Port 3001
pnpm run dev:dashboard  # Port 3000

# Option B: Run with Docker
docker-compose --profile dev up
```

## 🔧 Environment Setup

### Required Environment Variables

Create `.env` in project root:

```bash
# Database Configuration
DATABASE_URL=postgresql://arjuna:arjuna_dev_password@localhost:5432/arjuna

# Redis Configuration  
REDIS_URL=redis://localhost:6379

# Authentication
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password_here
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# Collector API
PORT=3001

# Dashboard
VITE_API_URL=http://localhost:3001

# IPinfo.io Integration (Optional but recommended)
IPINFO_TOKEN=your_ipinfo_token_here  # Get from https://ipinfo.io/signup
```

### App-Specific Environment Files

**apps/collector/.env:**
```bash
DATABASE_URL=postgresql://your_db_connection_string
REDIS_URL=redis://your_redis_connection_string
PORT=3001
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_here
IPINFO_TOKEN=your_ipinfo_token_here
```

**apps/dashboard/.env:**
```bash
VITE_API_URL=http://localhost:3001
```

## 🛠️ Development Mode

### Option 1: Run Apps Separately

**Terminal 1 - Collector API:**
```bash
cd apps/collector
bun run dev
# or: bun src/simple-auth-server.ts (JWT-only version)
```

**Terminal 2 - Dashboard:**
```bash
cd apps/dashboard  
bun run dev
```

**Terminal 3 - Database (if local):**
```bash
# Start PostgreSQL and Redis locally
# or use Docker:
docker-compose up postgres redis
```

### Option 2: Docker Development
```bash
# Run everything with Docker
docker-compose --profile dev up

# Or run individual services
docker-compose up postgres redis  # Just databases
```

### Available Scripts

```bash
# Root level
pnpm run dev:collector    # Start collector API
pnpm run dev:dashboard    # Start dashboard
pnpm run build           # Build all apps
pnpm run test            # Run tests

# Collector specific
cd apps/collector
bun run dev              # Full collector with analytics
bun run build            # Build for production
bun run start            # Start production build
bun src/simple-auth-server.ts  # JWT-only server

# Dashboard specific  
cd apps/dashboard
bun run dev              # Development server
bun run build            # Build for production
bun run preview          # Preview production build
```

## 🏗️ Production Build

### 1. Build Applications
```bash
# Build all applications
pnpm run build

# Or build individually
cd apps/collector && bun run build
cd apps/dashboard && bun run build
```

### 2. Production Environment Variables

Create production `.env`:
```bash
# Production Database (use your cloud provider)
DATABASE_URL=postgresql://user:password@your-db-host:5432/dbname

# Production Redis (use your cloud provider)  
REDIS_URL=redis://user:password@your-redis-host:6379

# Secure Authentication
ADMIN_EMAIL=your-admin@domain.com
ADMIN_PASSWORD=very_secure_password_here
JWT_SECRET=very_long_random_jwt_secret_key_for_production

# Production API URL
VITE_API_URL=https://your-api-domain.com

# IPinfo Token (recommended for production)
IPINFO_TOKEN=your_production_ipinfo_token
```

### 3. Run Production Build
```bash
# Collector
cd apps/collector
bun run start

# Dashboard  
cd apps/dashboard
bun run preview
# or serve dist/ with nginx/apache
```

## 🐳 Docker Deployment

### Production Docker Compose

```bash
# Production deployment
docker-compose up -d

# Scale services
docker-compose up -d --scale collector=3

# View logs
docker-compose logs -f collector
docker-compose logs -f dashboard
```

### Individual Service Deployment

```bash
# Just databases
docker-compose up -d postgres redis

# Just collector API
docker-compose up -d collector

# Just dashboard
docker-compose up -d dashboard
```

### Environment Variables for Docker

Create `.env` file in project root:
```bash
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_production_jwt_secret
IPINFO_TOKEN=your_ipinfo_token
```

## 🧪 Testing Guide

### 1. Test Geo IP Functionality

```bash
# Test the geo resolver directly
cd packages/geo
bun test

# Test with real IP
curl "http://localhost:3001/test-geo?ip=8.8.8.8"
```

### 2. Test JWT Authentication

```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'

# Verify token
curl -X POST http://localhost:3001/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Analytics Collection

```bash
# Send test event
curl -X POST http://localhost:3001/collect \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/page",
    "domain": "example.com",
    "referrer": "https://google.com"
  }'
```

### 4. Test Dashboard

1. Open http://localhost:3000
2. Login with your admin credentials
3. Check analytics data display

## 🔍 Health Checks

### API Health Check
```bash
curl http://localhost:3001/health
```

### Database Connection
```bash
# Check if collector can connect to DB
docker-compose logs collector | grep -i "database\|postgres"
```

### Redis Connection  
```bash
# Check if collector can connect to Redis
docker-compose logs collector | grep -i "redis"
```

## 🌐 Production Deployment Options

### 1. Cloud Platforms

**Vercel (Dashboard):**
```bash
# Deploy dashboard to Vercel
cd apps/dashboard
vercel --prod
```

**Railway/Render (Collector):**
```bash
# Deploy collector API
# Set environment variables in platform dashboard
```

**Docker Cloud Platforms:**
- AWS ECS/Fargate
- Google Cloud Run  
- DigitalOcean App Platform
- Azure Container Instances

### 2. VPS Deployment

```bash
# On your VPS
git clone <your-repo>
cd arjuna
cp env.example .env
# Edit .env with production values
docker-compose up -d
```

### 3. Kubernetes Deployment

```yaml
# k8s-deployment.yaml (example)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arjuna-collector
spec:
  replicas: 3
  selector:
    matchLabels:
      app: arjuna-collector
  template:
    metadata:
      labels:
        app: arjuna-collector
    spec:
      containers:
      - name: collector
        image: your-registry/arjuna-collector:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: arjuna-secrets
              key: database-url
```

## 🔧 Troubleshooting

### Common Issues

**1. Geo IP not working:**
```bash
# Check IPINFO_TOKEN format
echo $IPINFO_TOKEN  # Should be just the token, not a curl command

# Test geo resolution
curl "https://ipinfo.io/8.8.8.8?token=$IPINFO_TOKEN"
```

**2. Database connection issues:**
```bash
# Check connection string format
# PostgreSQL: postgresql://user:password@host:port/database
# Make sure SSL settings match your provider
```

**3. JWT issues:**
```bash
# Make sure JWT_SECRET is set and consistent
# Check token expiration (7 days default)
```

**4. CORS issues:**
```bash
# Make sure VITE_API_URL matches your collector URL
# Check collector CORS settings
```

### Logs and Debugging

```bash
# Docker logs
docker-compose logs -f collector
docker-compose logs -f dashboard

# Application logs
cd apps/collector && bun run dev  # Check console output
cd apps/dashboard && bun run dev  # Check browser console
```

## 📊 Monitoring

### Application Metrics
- Collector API: `/health` endpoint
- Database connections: Monitor PostgreSQL logs
- Redis performance: Monitor Redis metrics
- Geo IP usage: Monitor IPinfo.io quota

### Performance Optimization
- Enable Redis caching for geo lookups
- Use connection pooling for PostgreSQL
- Implement rate limiting for public endpoints
- Use CDN for dashboard static assets

## 🔒 Security Checklist

- [ ] Change default admin credentials
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS origins
- [ ] Use environment variables for secrets
- [ ] Enable database SSL connections
- [ ] Implement rate limiting
- [ ] Regular security updates

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale collector instances
docker-compose up -d --scale collector=5

# Use load balancer (nginx, traefik, etc.)
# Database read replicas for analytics queries
```

### Performance Tips
- Use Redis for session storage and caching
- Implement database indexing for analytics queries
- Use CDN for static assets
- Enable gzip compression
- Optimize database queries with proper indexes

---

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables are set correctly
3. Test individual components (DB, Redis, API, Dashboard)
4. Check network connectivity between services

For production deployments, ensure you have:
- Proper monitoring and alerting
- Database backups
- SSL certificates
- Domain configuration
- Security hardening