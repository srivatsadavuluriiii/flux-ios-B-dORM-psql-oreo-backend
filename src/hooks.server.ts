import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { generalRateLimit } from '$lib/middleware/rate-limiting';
import { cacheResponse } from '$lib/middleware/cache-middleware';
import { authMiddleware } from '$lib/middleware/auth-middleware';

/**
 * Flux Backend Server Hooks
 * Integrates all Phase 1 middleware components
 */

// Basic CORS and logging middleware
const corsMiddleware: Handle = async ({ event, resolve }) => {
  // Handle OPTIONS requests for CORS preflight
  if (event.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  const response = await resolve(event);
  
  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
};

// Security headers middleware
const securityMiddleware: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
};

// Request logging middleware
const loggingMiddleware: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  const { method, url } = event.request;
  
  console.log(`[Flux] ${method} ${url} - Started`);
  
  const response = await resolve(event);
  
  const duration = Date.now() - start;
  response.headers.set('X-Response-Time', `${duration}ms`);
  
  console.log(`[Flux] ${method} ${url} - ${response.status} (${duration}ms)`);
  
  return response;
};

// Rate limiting middleware
const rateLimitMiddleware: Handle = async ({ event, resolve }) => {
  // Apply rate limiting to API routes
  if (event.url.pathname.startsWith('/api/')) {
    const rateLimitResponse = await generalRateLimit(event);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }
  
  return resolve(event);
};

// Cache middleware (write responses to cache after route handler)
const cacheMiddleware: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  
  // Cache response if cache key is set by cache read middleware
  if (event.locals.cacheKey && event.locals.cacheTtl) {
    // Don't await caching to avoid slowing down the response
    cacheResponse(event.locals.cacheKey, response, event.locals.cacheTtl).catch(error => {
      console.error('[Flux Cache] Failed to cache response:', error);
    });
  }
  
  return response;
};

// Combine all middleware in sequence
export const handle: Handle = sequence(
  corsMiddleware,
  securityMiddleware,
  loggingMiddleware,
  authMiddleware,
  rateLimitMiddleware,
  cacheMiddleware
);

// Enhanced error handling for Flux backend
export const handleError: HandleServerError = async ({ error, event }) => {
  const errorId = crypto.randomUUID();
  
  // Log error details
  console.error(`[Flux Error ${errorId}]`, {
    error: error?.toString(),
    stack: (error as Error)?.stack,
    url: event.url.toString(),
    method: event.request.method,
    userAgent: event.request.headers.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  // Different error responses based on environment
  if (process.env.NODE_ENV === 'development') {
    return {
      message: (error as Error)?.message || 'Internal server error occurred in Flux backend',
      errorId,
      stack: (error as Error)?.stack,
      details: {
        url: event.url.pathname,
        method: event.request.method
      }
    };
  } else {
    return {
      message: 'Internal server error occurred in Flux backend',
      errorId
    };
  }
}; 