import { Elysia } from 'elysia';
import { eq, sql, desc, and, gte } from 'drizzle-orm';
import { pageviews, sessions, websites } from '@arjuna/db';
import { requireAuth } from '../utils/jwt.js';

const CACHE_KEYS = {
  stats: (websiteId: string, period: string) => `analytics:stats:${websiteId}:${period}`,
  topPages: (websiteId: string, period: string) => `analytics:pages:${websiteId}:${period}`,
  topCountries: (websiteId: string, period: string) => `analytics:countries:${websiteId}:${period}`,
  topReferrers: (websiteId: string, period: string) => `analytics:referrers:${websiteId}:${period}`,
  liveVisitors: (websiteId: string) => `live:${websiteId}`,
} as const;

export const analyticsRoutes = (app: Elysia) => app
  .get('/stats/:websiteId', async ({ params, query, db, redis }) => {
    const { websiteId } = params;
    const period = query.period || '7d';
    const cacheKey = CACHE_KEYS.stats(websiteId, period);
    
    try {
      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const daysAgo = getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get basic stats
      const [pageviewsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(pageviews)
        .where(and(
          eq(pageviews.websiteId, websiteId),
          gte(pageviews.timestamp, startDate)
        ));

      const [uniqueVisitors] = await db
        .select({ count: sql<number>`count(distinct ${pageviews.sessionId})` })
        .from(pageviews)
        .where(and(
          eq(pageviews.websiteId, websiteId),
          gte(pageviews.timestamp, startDate)
        ));

      const [bouncedSessions] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sessions)
        .where(and(
          eq(sessions.websiteId, websiteId),
          eq(sessions.bounced, true),
          gte(sessions.startTime, startDate)
        ));

      const [totalSessions] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sessions)
        .where(and(
          eq(sessions.websiteId, websiteId),
          gte(sessions.startTime, startDate)
        ));

      // Calculate average session duration
      const [avgDuration] = await db
        .select({ 
          avg: sql<number>`avg(extract(epoch from (end_time - start_time)))` 
        })
        .from(sessions)
        .where(and(
          eq(sessions.websiteId, websiteId),
          sql`end_time is not null`,
          gte(sessions.startTime, startDate)
        ));

      // Get live visitors
      const liveVisitors = await redis.scard(CACHE_KEYS.liveVisitors(websiteId));

      const stats = {
        pageviews: pageviewsCount.count || 0,
        uniqueVisitors: uniqueVisitors.count || 0,
        bounceRate: totalSessions.count > 0 ? 
          Math.round((bouncedSessions.count / totalSessions.count) * 100 * 10) / 10 : 0,
        avgDuration: Math.round(avgDuration.avg || 0),
        liveVisitors: liveVisitors || 0,
      };

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(stats));

      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { error: 'Failed to fetch stats' };
    }
  })

  .get('/pages/:websiteId', async ({ params, query, db, redis }) => {
    const { websiteId } = params;
    const period = query.period || '7d';
    const cacheKey = CACHE_KEYS.topPages(websiteId, period);
    
    try {
      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const daysAgo = getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const topPages = await db
        .select({
          path: pageviews.url,
          views: sql<number>`count(*)`,
        })
        .from(pageviews)
        .where(and(
          eq(pageviews.websiteId, websiteId),
          gte(pageviews.timestamp, startDate)
        ))
        .groupBy(pageviews.url)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

      const totalViews = topPages.reduce((sum, page) => sum + page.views, 0);
      
      const result = topPages.map(page => ({
        path: cleanUrl(page.path),
        views: page.views,
        percentage: totalViews > 0 ? Math.round((page.views / totalViews) * 100 * 10) / 10 : 0,
      }));

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(result));

      return result;
    } catch (error) {
      console.error('Error fetching top pages:', error);
      return { error: 'Failed to fetch top pages' };
    }
  })

  .get('/countries/:websiteId', async ({ params, query, db, redis }) => {
    const { websiteId } = params;
    const period = query.period || '7d';
    const cacheKey = CACHE_KEYS.topCountries(websiteId, period);
    
    try {
      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const daysAgo = getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const topCountries = await db
        .select({
          country: pageviews.country,
          visitors: sql<number>`count(distinct ${pageviews.sessionId})`,
        })
        .from(pageviews)
        .where(and(
          eq(pageviews.websiteId, websiteId),
          gte(pageviews.timestamp, startDate),
          sql`country is not null`
        ))
        .groupBy(pageviews.country)
        .orderBy(desc(sql`count(distinct ${pageviews.sessionId})`))
        .limit(10);

      const totalVisitors = topCountries.reduce((sum, country) => sum + country.visitors, 0);
      
      const result = topCountries.map(country => ({
        country: country.country,
        visitors: country.visitors,
        percentage: totalVisitors > 0 ? Math.round((country.visitors / totalVisitors) * 100 * 10) / 10 : 0,
      }));

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(result));

      return result;
    } catch (error) {
      console.error('Error fetching top countries:', error);
      return { error: 'Failed to fetch top countries' };
    }
  })

  .get('/referrers/:websiteId', async ({ params, query, db, redis }) => {
    const { websiteId } = params;
    const period = query.period || '7d';
    const cacheKey = CACHE_KEYS.topReferrers(websiteId, period);
    
    try {
      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const daysAgo = getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const topReferrers = await db
        .select({
          referrer: pageviews.referrer,
          visitors: sql<number>`count(distinct ${pageviews.sessionId})`,
        })
        .from(pageviews)
        .where(and(
          eq(pageviews.websiteId, websiteId),
          gte(pageviews.timestamp, startDate),
          sql`referrer is not null and referrer != ''`
        ))
        .groupBy(pageviews.referrer)
        .orderBy(desc(sql`count(distinct ${pageviews.sessionId})`))
        .limit(10);

      const totalVisitors = topReferrers.reduce((sum, ref) => sum + ref.visitors, 0);
      
      const result = topReferrers.map(ref => ({
        source: cleanReferrer(ref.referrer),
        visitors: ref.visitors,
        percentage: totalVisitors > 0 ? Math.round((ref.visitors / totalVisitors) * 100 * 10) / 10 : 0,
      }));

      // Add direct traffic
      const [directTraffic] = await db
        .select({ visitors: sql<number>`count(distinct ${pageviews.sessionId})` })
        .from(pageviews)
        .where(and(
          eq(pageviews.websiteId, websiteId),
          gte(pageviews.timestamp, startDate),
          sql`(referrer is null or referrer = '')`
        ));

      if (directTraffic.visitors > 0) {
        result.push({
          source: 'Direct',
          visitors: directTraffic.visitors,
          percentage: totalVisitors > 0 ? Math.round((directTraffic.visitors / totalVisitors) * 100 * 10) / 10 : 0,
        });
      }

      // Sort by visitors and limit
      const finalResult = result
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 10);

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(finalResult));

      return finalResult;
    } catch (error) {
      console.error('Error fetching top referrers:', error);
      return { error: 'Failed to fetch top referrers' };
    }
  })

  .get('/websites', async ({ db, headers, set }) => {
    try {
      const authResult = requireAuth(headers.authorization);
      if (!authResult.success) {
        set.status = 401;
        return { error: authResult.error };
      }

      const allWebsites = await db
        .select()
        .from(websites)
        .orderBy(websites.createdAt);

      return allWebsites;
    } catch (error) {
      console.error('Error fetching websites:', error);
      return { error: 'Failed to fetch websites' };
    }
  })

  .post('/websites', async ({ body, db, headers, set }) => {
    try {
      const authResult = requireAuth(headers.authorization);
      if (!authResult.success) {
        set.status = 401;
        return { error: authResult.error };
      }

      const { domain, name } = body as { domain: string; name: string };

      if (!domain || !domain.trim()) {
        set.status = 400;
        return { error: 'Domain is required' };
      }

      // Check if website already exists
      const existingWebsite = await db
        .select()
        .from(websites)
        .where(eq(websites.domain, domain.trim()))
        .limit(1);

      if (existingWebsite.length > 0) {
        set.status = 409;
        return { error: 'Website with this domain already exists' };
      }

      // Create new website
      const [newWebsite] = await db
        .insert(websites)
        .values({
          domain: domain.trim(),
          name: name?.trim() || domain.trim(),
          isPublic: false,
        })
        .returning();

      return newWebsite;
    } catch (error) {
      console.error('Error creating website:', error);
      set.status = 500;
      return { error: 'Failed to create website' };
    }
  });

function getPeriodDays(period: string): number {
  switch (period) {
    case '24h': return 1;
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    default: return 7;
  }
}

function cleanUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    return url;
  }
}

function cleanReferrer(referrer: string): string {
  try {
    const urlObj = new URL(referrer);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return referrer;
  }
} 