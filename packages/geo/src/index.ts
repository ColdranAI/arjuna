import { lookup } from 'ip-location-api';
import { IPinfoWrapper } from 'node-ipinfo';

export interface GeoLocation {
  country: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

export interface GeoResolver {
  resolveIP(ip: string): Promise<GeoLocation | null>;
}

// High-performance local database resolver using ip-location-api
export class LocalGeoResolver implements GeoResolver {
  private cache = new Map<string, GeoLocation | null>();
  private isInitialized = false;

  async resolveIP(ip: string): Promise<GeoLocation | null> {
    // Skip local/private IPs
    if (this.isPrivateIP(ip)) {
      return null;
    }

    // Check cache first
    if (this.cache.has(ip)) {
      return this.cache.get(ip) || null;
    }

    try {
      // ip-location-api uses in-memory database for ultra-fast lookups
      const result = await lookup(ip);
      
      if (result) {
        const location: GeoLocation = {
          country: result.country_name || result.country || 'Unknown',
          region: result.region1_name || result.region1,
          city: result.city,
          timezone: result.timezone,
          latitude: result.latitude,
          longitude: result.longitude,
        };
        
        // Cache the result
        this.cache.set(ip, location);
        return location;
      } else {
        // Cache null result
        this.cache.set(ip, null);
        return null;
      }
    } catch (error) {
      console.error(`Failed to resolve IP ${ip}:`, error);
      // Cache null result to avoid repeated failed requests
      this.cache.set(ip, null);
      return null;
    }
  }

  private isPrivateIP(ip: string): boolean {
    // Check for common private IP ranges
    const privateRanges = [
      /^127\./, // Loopback
      /^192\.168\./, // Private Class C
      /^10\./, // Private Class A
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
      /^::1$/, // IPv6 loopback
      /^fc00:/, // IPv6 private
      /^fe80:/, // IPv6 link-local
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  // Clean old cache entries to prevent memory leaks
  cleanCache(maxSize = 50000) {
    if (this.cache.size > maxSize) {
      // Remove oldest 25% of entries
      const entriesToRemove = Math.floor(this.cache.size * 0.25);
      const keys = Array.from(this.cache.keys()).slice(0, entriesToRemove);
      keys.forEach(key => this.cache.delete(key));
    }
  }
}


// IPinfo.io resolver using their official API
export class IPinfoResolver implements GeoResolver {
  private ipinfo: IPinfoWrapper;
  private cache = new Map<string, GeoLocation | null>();

  constructor(token?: string) {
    this.ipinfo = new IPinfoWrapper(token || '');
  }

  async resolveIP(ip: string): Promise<GeoLocation | null> {
    // Skip local/private IPs
    if (this.isPrivateIP(ip)) {
      return null;
    }

    // Check cache first
    if (this.cache.has(ip)) {
      return this.cache.get(ip) || null;
    }

    try {
      const response = await this.ipinfo.lookupIp(ip);
      
      if (response) {
        const location: GeoLocation = {
          country: response.country || 'Unknown',
          region: response.region,
          city: response.city,
          timezone: response.timezone,
          latitude: response.loc ? parseFloat(response.loc.split(',')[0]) : undefined,
          longitude: response.loc ? parseFloat(response.loc.split(',')[1]) : undefined,
        };
        
        // Cache the result
        this.cache.set(ip, location);
        return location;
      } else {
        // Cache null result
        this.cache.set(ip, null);
        return null;
      }
    } catch (error) {
      console.error(`IPinfo lookup failed for ${ip}:`, error);
      // Cache null result to avoid repeated failed requests
      this.cache.set(ip, null);
      return null;
    }
  }

  private isPrivateIP(ip: string): boolean {
    // Check for common private IP ranges
    const privateRanges = [
      /^127\./, // Loopback
      /^192\.168\./, // Private Class C
      /^10\./, // Private Class A
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
      /^::1$/, // IPv6 loopback
      /^fc00:/, // IPv6 private
      /^fe80:/, // IPv6 link-local
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  // Clean old cache entries to prevent memory leaks
  cleanCache(maxSize = 50000) {
    if (this.cache.size > maxSize) {
      // Remove oldest 25% of entries
      const entriesToRemove = Math.floor(this.cache.size * 0.25);
      const keys = Array.from(this.cache.keys()).slice(0, entriesToRemove);
      keys.forEach(key => this.cache.delete(key));
    }
  }
}

// Hybrid resolver with IPinfo + local database fallback
export class HybridGeoResolver implements GeoResolver {
  private localResolver = new LocalGeoResolver();
  private ipinfoResolver: IPinfoResolver;

  constructor(ipinfoToken?: string) {
    this.ipinfoResolver = new IPinfoResolver(ipinfoToken);
  }

  async resolveIP(ip: string): Promise<GeoLocation | null> {
    // 1. Try IPinfo.io API (high accuracy, rate limited)
    try {
      const ipinfoResult = await this.ipinfoResolver.resolveIP(ip);
      if (ipinfoResult) {
        return ipinfoResult;
      }
    } catch (error) {
      console.warn('IPinfo.io lookup failed, falling back to local database:', error);
    }

    // 2. Fallback to local database (always available)
    return await this.localResolver.resolveIP(ip);
  }
}

// Create default resolver with IPinfo + local database hybrid
export const defaultGeoResolver = new HybridGeoResolver(process.env.IPINFO_TOKEN);

// Pre-initialize the database on module load for faster first requests
(async () => {
  try {
    console.log('Initializing ip-location-api database...');
    // Trigger database initialization with a dummy lookup
    await defaultGeoResolver.resolveIP('8.8.8.8');
    console.log('ip-location-api database initialized successfully');
  } catch (error) {
    console.warn('Failed to pre-initialize ip-location-api:', error);
  }
})(); 