import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { fluxRedis } from '$lib/database/redis';

/**
 * Cache middleware type for Flux backend
 */
export type CacheMiddleware = (event: RequestEvent) => Promise<Response | null>;

/**
 * Cache configuration options
 */
interface CacheConfig {
  ttl: number; // Time to live in seconds
  keyPrefix?: string;
  keyGenerator?: (event: RequestEvent) => string;
  skipCache?: (event: RequestEvent) => boolean;
  onlyMethods?: string[];
}

/**
 * Default cache configurations for different endpoints
 */
export const CACHE_CONFIGS = {
  // Short cache for frequently accessed data
  short: {
    ttl: 300, // 5 minutes
    keyPrefix: 'flux:cache:short'
  },
  
  // Medium cache for stable data
  medium: {
    ttl: 3600, // 1 hour
    keyPrefix: 'flux:cache:medium'
  },
  
  // Long cache for rarely changing data
  long: {
    ttl: 86400, // 24 hours
    keyPrefix: 'flux:cache:long'
  },
  
  // User-specific data cache
  user: {
    ttl: 1800, // 30 minutes
    keyPrefix: 'flux:cache:user'
  },
  
  // Expense data cache
  expenses: {
    ttl: 600, // 10 minutes
    keyPrefix: 'flux:cache:expenses'
  },
  
  // Group data cache
  groups: {
    ttl: 1800, // 30 minutes
    keyPrefix: 'flux:cache:groups'
  }
} as const;

/**
 * Generate cache key for request
 */
function generateCacheKey(event: RequestEvent, config: CacheConfig): string {
  if (config.keyGenerator) {
    return config.keyGenerator(event);
  }

  const url = new URL(event.request.url);
  const prefix = config.keyPrefix || 'flux:cache';
  const method = event.request.method;
  const pathname = url.pathname;
  const search = url.search;
  
  // Include user ID in key if available (from auth)
  const userId = event.locals.userId || 'anonymous';
  
  return `${prefix}:${method}:${pathname}${search}:${userId}`;
}

/**
 * Check if request should be cached
 */
function shouldCache(event: RequestEvent, config: CacheConfig): boolean {
  // Skip cache if configured to do so
  if (config.skipCache && config.skipCache(event)) {
    return false;
  }

  // Only cache specific methods if configured
  if (config.onlyMethods && !config.onlyMethods.includes(event.request.method)) {
    return false;
  }

  // Default: only cache GET requests
  return event.request.method === 'GET';
}

/**
 * Create cache middleware for reading from cache
 */
export function createCacheRead(config: CacheConfig): CacheMiddleware {
  return async (event: RequestEvent): Promise<Response | null> => {
    try {
      // Check if we should cache this request
      if (!shouldCache(event, config)) {
        return null;
      }

      const cacheKey = generateCacheKey(event, config);
      
      // Try to get cached response
      const cachedData = await fluxRedis.getJSON<{
        status: number;
        headers: Record<string, string>;
        body: any;
        timestamp: number;
      }>(cacheKey);

      if (cachedData) {
        console.log(`[Flux Cache] HIT - ${cacheKey}`);
        
        // Add cache headers
        const headers = new Headers(cachedData.headers);
        headers.set('X-Cache', 'HIT');
        headers.set('X-Cache-Key', cacheKey);
        headers.set('X-Cached-At', new Date(cachedData.timestamp).toISOString());
        
        return new Response(
          JSON.stringify(cachedData.body),
          {
            status: cachedData.status,
            headers
          }
        );
      }

      console.log(`[Flux Cache] MISS - ${cacheKey}`);
      
      // Cache miss, continue to route handler
      // Store cache key in locals for cache write middleware
      event.locals.cacheKey = cacheKey;
      event.locals.cacheTtl = config.ttl;
      
      return null;
    } catch (error) {
      console.error('[Flux Cache] Cache read error:', error);
      // On cache error, continue to route handler
      return null;
    }
  };
}

/**
 * Create cache middleware for writing to cache
 */
export function createCacheWrite(): CacheMiddleware {
  return async (event: RequestEvent): Promise<Response | null> => {
    // This middleware runs after the route handler
    // It intercepts the response and caches it if appropriate
    return null; // This will be handled in hooks.server.ts
  };
}

/**
 * Cache response data
 */
export async function cacheResponse(
  cacheKey: string,
  response: Response,
  ttl: number
): Promise<void> {
  try {
    // Only cache successful responses
    if (response.status < 200 || response.status >= 300) {
      return;
    }

    // Clone response to read body without consuming it
    const responseClone = response.clone();
    const body = await responseClone.json();

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const cacheData = {
      status: response.status,
      headers,
      body,
      timestamp: Date.now()
    };

    await fluxRedis.setJSON(cacheKey, cacheData, ttl);
    console.log(`[Flux Cache] CACHED - ${cacheKey} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error('[Flux Cache] Cache write error:', { cacheKey, error });
  }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<boolean> {
  try {
    // This is a simplified implementation
    // In production, you'd use Redis SCAN with pattern matching
    console.log(`[Flux Cache] Invalidating cache pattern: ${pattern}`);
    
    // For now, just log the invalidation request
    // Full implementation would require Redis SCAN and DEL operations
    return true;
  } catch (error) {
    console.error('[Flux Cache] Cache invalidation error:', { pattern, error });
    return false;
  }
}

/**
 * Pre-configured cache middleware instances
 */

// Short-term cache (5 minutes)
export const shortCache = createCacheRead(CACHE_CONFIGS.short);

// Medium-term cache (1 hour)
export const mediumCache = createCacheRead(CACHE_CONFIGS.medium);

// Long-term cache (24 hours)
export const longCache = createCacheRead(CACHE_CONFIGS.long);

// User-specific cache (30 minutes)
export const userCache = createCacheRead(CACHE_CONFIGS.user);

// Expense data cache (10 minutes)
export const expenseCache = createCacheRead(CACHE_CONFIGS.expenses);

// Group data cache (30 minutes)
export const groupCache = createCacheRead(CACHE_CONFIGS.groups);

/**
 * Custom cache middleware creator
 */
export function createCustomCache(
  ttl: number,
  keyPrefix?: string,
  options?: Partial<CacheConfig>
): CacheMiddleware {
  return createCacheRead({
    ttl,
    keyPrefix: keyPrefix || 'flux:cache:custom',
    ...options
  });
} 