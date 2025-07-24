import { pgTable, text, timestamp, integer, boolean, uuid, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isAdmin: boolean('is_admin').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const websites = pgTable('websites', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: text('domain').notNull().unique(),
  name: text('name').notNull(),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const pageviews = pgTable('pageviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  websiteId: uuid('website_id').references(() => websites.id).notNull(),
  sessionId: text('session_id').notNull(),
  url: text('url').notNull(),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  ipHash: text('ip_hash').notNull(),
  country: text('country'),
  region: text('region'),
  city: text('city'),
  os: text('os'),
  browser: text('browser'),
  device: text('device'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  timestamp: timestamp('timestamp').defaultNow(),
}, (table) => ({
  websiteIdx: index('pageviews_website_idx').on(table.websiteId),
  timestampIdx: index('pageviews_timestamp_idx').on(table.timestamp),
  sessionIdx: index('pageviews_session_idx').on(table.sessionId),
  countryIdx: index('pageviews_country_idx').on(table.country),
}));

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  websiteId: uuid('website_id').references(() => websites.id).notNull(),
  ipHash: text('ip_hash').notNull(),
  userAgent: text('user_agent'),
  country: text('country'),
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time'),
  pageviews: integer('pageviews').default(0),
  bounced: boolean('bounced').default(true),
}, (table) => ({
  websiteIdx: index('sessions_website_idx').on(table.websiteId),
  startTimeIdx: index('sessions_start_time_idx').on(table.startTime),
}));

export type User = typeof users.$inferSelect;
export type Website = typeof websites.$inferSelect;
export type Pageview = typeof pageviews.$inferSelect;
export type Session = typeof sessions.$inferSelect; 