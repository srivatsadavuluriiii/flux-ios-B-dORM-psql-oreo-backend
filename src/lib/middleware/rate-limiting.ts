import type { RequestEvent } from '@sveltejs/kit';
import { fluxRedis } from '$lib/database/redis';
import { json } from '@sveltejs/kit';

/**
 * Rate Limiting Configuration for Flux Backend
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: Request, clientIP: string) => string;
}

/**
 * Default rate limiting configurations for different endpoints
 */
export const RATE_LIMITS = {
  // General API endpoints
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  },
  
  // Authentication endpoints (more restrictive)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5
  },
  
  // Payment endpoints (very restrictive)
  payment: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10
  },
  
  // AI/OCR endpoints (moderate)
  ai: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50
  }
} as const;

/**
 * Rate limiting middleware function type
 */
export type RateLimitMiddleware = (event: RequestEvent) => Promise<Response | null>;

/**
 * Create rate limiting middleware for Flux backend
 */
export function createRateLimit(config: RateLimitConfig): RateLimitMiddleware {
  return async (event: RequestEvent): Promise<Response | null> => {
    try {
      const { request, getClientAddress } = event;
      const clientIP = getClientAddress();
      const key = config.keyGenerator 
        ? config.keyGenerator(request, clientIP)
        : `flux:ratelimit:${clientIP}:${new URL(request.url).pathname}`;

      // Try to get current count from Redis
      const currentCountStr = await fluxRedis.get(key);
      const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;

      // Check if limit exceeded
      if (currentCount >= config.maxRequests) {
        console.warn(`[Flux Rate Limit] Limit exceeded for ${clientIP} on ${request.url}`);
        
        return json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests, please try again later',
              details: {
                limit: config.maxRequests,
                windowMs: config.windowMs,
                retryAfter: Math.ceil(config.windowMs / 1000)
              }
            }
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': (Date.now() + config.windowMs).toString()
            }
          }
        );
      }

      // Increment counter
      const newCount = currentCount + 1;
      const ttlSeconds = Math.ceil(config.windowMs / 1000);
      
      if (currentCount === 0) {
        // First request in window, set with TTL
        await fluxRedis.set(key, newCount.toString(), ttlSeconds);
      } else {
        // Subsequent request, increment without changing TTL
        await fluxRedis.set(key, newCount.toString());
      }

      console.log(`[Flux Rate Limit] ${clientIP} - ${newCount}/${config.maxRequests} requests`);
      
      // Rate limit passed, allow request to continue
      return null;
    } catch (error) {
      console.error('[Flux Rate Limit] Error in rate limiting middleware:', error);
      // On Redis error, allow request to proceed (fail open)
      return null;
    }
  };
}

/**
 * Middleware for general API rate limiting
 */
export const generalRateLimit = createRateLimit(RATE_LIMITS.default);

/**
 * Middleware for authentication endpoint rate limiting
 */
export const authRateLimit = createRateLimit(RATE_LIMITS.auth);

/**
 * Middleware for payment endpoint rate limiting
 */
export const paymentRateLimit = createRateLimit(RATE_LIMITS.payment);

/**
 * Middleware for AI endpoint rate limiting
 */
export const aiRateLimit = createRateLimit(RATE_LIMITS.ai);

/**
 * Custom rate limit for specific use cases
 */
export function customRateLimit(windowMs: number, maxRequests: number): RateLimitMiddleware {
  return createRateLimit({ windowMs, maxRequests });
} 