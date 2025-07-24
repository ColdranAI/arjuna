import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://arjuna:arjuna_dev_password@localhost:5432/arjuna',
  },
} satisfies Config; 