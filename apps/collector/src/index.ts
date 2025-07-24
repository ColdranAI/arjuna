import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { createDatabase, createRedis, getDatabase, getRedis } from '@arjuna/db';
import { defaultGeoResolver } from '@arjuna/geo';
import UAParser from 'ua-parser-js';
import { collectEvent } from './handlers/collect.js';
import { authRoutes } from './routes/auth.js';
import { analyticsRoutes } from './routes/analytics.js';
import { trackingScript } from './handlers/script.js';

// Initialize database and redis
const db = createDatabase(process.env.DATABASE_URL || 'postgresql://localhost:5432/arjuna');
const redis = createRedis(process.env.REDIS_URL || 'redis://localhost:6379');

// Connect to Redis
await redis.connect();

const app = new Elysia()
  .use(cors({
    origin: true,
    credentials: true,
  }))
  .decorate('db', db)
  .decorate('redis', redis)
  .decorate('geoResolver', defaultGeoResolver)
  
  // Health check
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  
  // Tracking script
  .get('/tracker.js', trackingScript)
  .get('/js/script.js', trackingScript) // Alternative path to avoid adblockers
  
  // Event collection
  .post('/collect', collectEvent)
  .post('/api/collect', collectEvent) // Alternative path
  
  // Authentication routes
  .group('/auth', authRoutes)
  
  // Analytics routes
  .group('/analytics', analyticsRoutes)
  
  // CORS preflight
  .options('*', () => '', {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
  
  .listen(process.env.PORT || 3001);

console.log(`🚀 Collector API running at http://localhost:${app.server?.port}`);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await redis.quit();
  process.exit(0);
}); 