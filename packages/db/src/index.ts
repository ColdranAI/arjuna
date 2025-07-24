import { drizzle } from 'drizzle-orm/postgres-js';
import { createClient } from 'redis';
import postgres from 'postgres';
import * as schema from './schema.js';

// PostgreSQL connection
let db: ReturnType<typeof drizzle> | null = null;

export function createDatabase(connectionString: string) {
  if (!db) {
    const client = postgres(connectionString);
    db = drizzle(client, { schema });
  }
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call createDatabase first.');
  }
  return db;
}

// Redis connection
let redis: ReturnType<typeof createClient> | null = null;

export function createRedis(url: string) {
  if (!redis) {
    redis = createClient({ url });
  }
  return redis;
}

export function getRedis() {
  if (!redis) {
    throw new Error('Redis not initialized. Call createRedis first.');
  }
  return redis;
}

// Re-export schema
export * from './schema.js';

// Utility functions
export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function hashIP(ip: string, userAgent: string): string {
  const data = new TextEncoder().encode(ip + userAgent);
  return crypto.subtle.digest('SHA-256', data).then(hash => {
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  });
} 