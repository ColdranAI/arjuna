import { Context } from 'elysia';
import { eq, and, sql } from 'drizzle-orm';
import { pageviews, sessions, websites, generateSessionId, hashIP } from '@arjuna/db';
import UAParser from 'ua-parser-js';
import crypto from 'crypto';

interface CollectData {
  url: string;
  referrer?: string;
  title?: string;
  domain: string;
  sessionId?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

// Cache keys
const CACHE_KEYS = {
  website: (domain: string) => `website:${domain}`,
  session: (sessionId: string) => `session:${sessionId}`,
  geoLocation: (ip: string) => `geo:${ip}`,
  dailyStats: (websiteId: string, date: string) => `stats:daily:${websiteId}:${date}`,
  liveVisitors: (websiteId: string) => `live:${websiteId}`,
} as const;

export async function collectEvent({ 
  body, 
  headers, 
  db, 
  redis, 
  geoResolver 
}: Context & { 
  db: any; 
  redis: any; 
  geoResolver: any;
}) {
  try {
    const data = body as CollectData;
    
    if (!data.url || !data.domain) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Get client IP (considering proxies)
    const clientIP = headers['x-forwarded-for']?.split(',')[0] || // Standard proxy
                    headers['x-real-ip'] ||                      // Nginx proxy
                    headers['true-client-ip'] ||                 // Akamai/other CDNs
                    '127.0.0.1';                                // Fallback

    const userAgent = headers['user-agent'] || '';
    
    // Parse user agent
    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();
    
    // Generate session hash
    const today = new Date().toISOString().split('T')[0];
    const sessionHash = crypto
      .createHash('sha256')
      .update(clientIP + userAgent + today)
      .digest('hex')
      .substring(0, 32);

    // Bot detection using user-agent
    if (isBot(userAgent)) {
      return new Response('Bot detected', { status: 200 });
    }

    // Find or create website with caching
    let website = await getCachedWebsite(data.domain, db, redis);
    const websiteId = website.id;

    // Hash IP for privacy
    const ipHash = await hashIP(clientIP, userAgent);

    // Resolve geolocation with caching
    const geoLocation = await getCachedGeoLocation(clientIP, geoResolver, redis);

    const sessionId = data.sessionId || sessionHash;

    // Handle session with caching
    await handleSession(sessionId, websiteId, ipHash, userAgent, geoLocation, db, redis);

    // Insert pageview
    await db.insert(pageviews).values({
      websiteId,
      sessionId,
      url: data.url,
      referrer: data.referrer,
      userAgent,
      ipHash,
      country: geoLocation?.country,
      region: geoLocation?.region,
      city: geoLocation?.city,
      os: uaResult.os.name,
      browser: uaResult.browser.name,
      device: getDeviceType(uaResult),
      utmSource: data.utm_source,
      utmMedium: data.utm_medium,
      utmCampaign: data.utm_campaign,
    });

    // Update live visitors count in Redis
    const liveKey = CACHE_KEYS.liveVisitors(websiteId);
    await redis.sadd(liveKey, sessionId);
    await redis.expire(liveKey, 300); // 5 minutes

    // Update daily stats cache
    await updateDailyStatsCache(websiteId, today, redis);

    return new Response('OK', { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Collection error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function getCachedWebsite(domain: string, db: any, redis: any) {
  const cacheKey = CACHE_KEYS.website(domain);
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Query database
  let website = await db
    .select()
    .from(websites)
    .where(eq(websites.domain, domain))
    .limit(1);

  if (!website.length) {
    // Auto-create website for new domains
    const newWebsite = await db
      .insert(websites)
      .values({
        domain: domain,
        name: domain,
        isPublic: false,
      })
      .returning();
    website = newWebsite;
  }

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(website[0]));
  
  return website[0];
}

async function getCachedGeoLocation(ip: string, geoResolver: any, redis: any) {
  const cacheKey = CACHE_KEYS.geoLocation(ip);
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached && cached !== 'null') {
    return JSON.parse(cached);
  }

  // Resolve geolocation
  const geoLocation = await geoResolver.resolveIP(ip);
  
  // Cache for 24 hours
  if (geoLocation) {
    await redis.setex(cacheKey, 86400, JSON.stringify(geoLocation));
  } else {
    // Cache null results for 1 hour to avoid repeated lookups
    await redis.setex(cacheKey, 3600, 'null');
  }
  
  return geoLocation;
}

async function handleSession(sessionId: string, websiteId: string, ipHash: string, userAgent: string, geoLocation: any, db: any, redis: any) {
  const cacheKey = CACHE_KEYS.session(sessionId);
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    const session = JSON.parse(cached);
    
    // Update session
    session.pageviews += 1;
    session.bounced = session.pageviews === 1;
    session.endTime = new Date().toISOString();
    
    // Update cache
    await redis.setex(cacheKey, 3600, JSON.stringify(session));
    
    // Update database
    await db
      .update(sessions)
      .set({
        endTime: new Date(),
        pageviews: session.pageviews,
        bounced: session.bounced,
      })
      .where(eq(sessions.id, sessionId));
  } else {
    // Check database
    let session = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.id, sessionId),
        eq(sessions.websiteId, websiteId)
      ))
      .limit(1);

    if (!session.length) {
      // Create new session
      const newSession = {
        id: sessionId,
        websiteId,
        ipHash,
        userAgent,
        country: geoLocation?.country,
        startTime: new Date(),
        endTime: null,
        pageviews: 1,
        bounced: true,
      };

      await db.insert(sessions).values(newSession);
      
      // Cache new session
      await redis.setex(cacheKey, 3600, JSON.stringify(newSession));
    } else {
      // Update existing session
      const updatedSession = {
        ...session[0],
        endTime: new Date(),
        pageviews: session[0].pageviews + 1,
        bounced: session[0].pageviews === 0,
      };

      await db
        .update(sessions)
        .set({
          endTime: updatedSession.endTime,
          pageviews: updatedSession.pageviews,
          bounced: updatedSession.bounced,
        })
        .where(eq(sessions.id, sessionId));

      // Cache updated session
      await redis.setex(cacheKey, 3600, JSON.stringify(updatedSession));
    }
  }
}

async function updateDailyStatsCache(websiteId: string, date: string, redis: any) {
  const cacheKey = CACHE_KEYS.dailyStats(websiteId, date);
  
  // Increment pageviews count
  await redis.hincrby(cacheKey, 'pageviews', 1);
  
  // Set expiry for 48 hours
  await redis.expire(cacheKey, 172800);
}

function isBot(userAgent: string): boolean {
  // User-agent pattern matching for bot detection
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'parser',
    'googlebot', 'bingbot', 'slurp', 'duckduckbot',
    'facebookexternalhit', 'twitterbot', 'whatsapp',
    'lighthouse', 'pingdom', 'uptimerobot', 'headless',
    'phantom', 'selenium', 'webdriver', 'curl', 'wget'
  ];
  
  const ua = userAgent.toLowerCase();
  return botPatterns.some(pattern => ua.includes(pattern));
}

function getDeviceType(uaResult: UAParser.IResult): string {
  if (uaResult.device.type) {
    return uaResult.device.type;
  }
  
  // Fallback detection
  const ua = uaResult.ua.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  return 'desktop';
} 