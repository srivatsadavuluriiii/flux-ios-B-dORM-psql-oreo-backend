import { createClient } from "redis";
import { j as json } from "./index.js";
function sequence(...handlers) {
  const length = handlers.length;
  if (!length) return ({ event, resolve }) => resolve(event);
  return ({ event, resolve }) => {
    return apply_handle(0, event, {});
    function apply_handle(i, event2, parent_options) {
      const handle2 = handlers[i];
      return handle2({
        event: event2,
        resolve: (event3, options) => {
          const transformPageChunk = async ({ html, done }) => {
            if (options?.transformPageChunk) {
              html = await options.transformPageChunk({ html, done }) ?? "";
            }
            if (parent_options?.transformPageChunk) {
              html = await parent_options.transformPageChunk({ html, done }) ?? "";
            }
            return html;
          };
          const filterSerializedResponseHeaders = parent_options?.filterSerializedResponseHeaders ?? options?.filterSerializedResponseHeaders;
          const preload = parent_options?.preload ?? options?.preload;
          return i < length - 1 ? apply_handle(i + 1, event3, {
            transformPageChunk,
            filterSerializedResponseHeaders,
            preload
          }) : resolve(event3, { transformPageChunk, filterSerializedResponseHeaders, preload });
        }
      });
    }
  };
}
class FluxRedis {
  client = null;
  isConnected = false;
  initialized = false;
  constructor() {
  }
  /**
   * Initialize Redis client
   */
  async initializeClient() {
    try {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        console.warn("[Flux Redis] REDIS_URL not provided, cache features will be disabled");
        return;
      }
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5e3
        }
      });
      this.client.on("connect", () => {
        console.log("[Flux Redis] Client connected to Redis");
        this.isConnected = true;
      });
      this.client.on("error", (err) => {
        console.error("[Flux Redis] Redis client error:", err);
        this.isConnected = false;
      });
      this.client.on("end", () => {
        console.log("[Flux Redis] Redis connection ended");
        this.isConnected = false;
      });
      await this.client.connect();
      console.log("[Flux Redis] Redis client initialized and connected");
    } catch (error) {
      console.error("[Flux Redis] Failed to initialize Redis client:", error);
    }
  }
  /**
   * Ensure client is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeClient();
      this.initialized = true;
    }
  }
  /**
   * Set a key-value pair with optional TTL
   */
  async set(key, value, ttlSeconds) {
    try {
      await this.ensureInitialized();
      if (!this.client || !this.isConnected) {
        console.warn("[Flux Redis] Redis not available for SET operation");
        return false;
      }
      const ttl = ttlSeconds || parseInt(process.env.CACHE_TTL_DEFAULT || "3600");
      await this.client.setEx(key, ttl, value);
      console.log(`[Flux Redis] SET ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error("[Flux Redis] SET error:", { key, error: error?.toString() });
      return false;
    }
  }
  /**
   * Get value by key
   */
  async get(key) {
    try {
      await this.ensureInitialized();
      if (!this.client || !this.isConnected) {
        console.warn("[Flux Redis] Redis not available for GET operation");
        return null;
      }
      const value = await this.client.get(key);
      console.log(`[Flux Redis] GET ${key} - ${value ? "HIT" : "MISS"}`);
      return value;
    } catch (error) {
      console.error("[Flux Redis] GET error:", { key, error: error?.toString() });
      return null;
    }
  }
  /**
   * Delete a key
   */
  async del(key) {
    try {
      await this.ensureInitialized();
      if (!this.client || !this.isConnected) {
        console.warn("[Flux Redis] Redis not available for DEL operation");
        return false;
      }
      const result = await this.client.del(key);
      console.log(`[Flux Redis] DEL ${key} - ${result > 0 ? "SUCCESS" : "NOT_FOUND"}`);
      return result > 0;
    } catch (error) {
      console.error("[Flux Redis] DEL error:", { key, error: error?.toString() });
      return false;
    }
  }
  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      await this.ensureInitialized();
      if (!this.client || !this.isConnected) {
        console.warn("[Flux Redis] Redis not available for EXISTS operation");
        return false;
      }
      const exists = await this.client.exists(key);
      return exists > 0;
    } catch (error) {
      console.error("[Flux Redis] EXISTS error:", { key, error: error?.toString() });
      return false;
    }
  }
  /**
   * Set TTL for a key
   */
  async expire(key, ttlSeconds) {
    try {
      await this.ensureInitialized();
      if (!this.client || !this.isConnected) {
        console.warn("[Flux Redis] Redis not available for EXPIRE operation");
        return false;
      }
      const result = await this.client.expire(key, ttlSeconds);
      return result;
    } catch (error) {
      console.error("[Flux Redis] EXPIRE error:", { key, ttlSeconds, error: error?.toString() });
      return false;
    }
  }
  /**
   * Cache JSON data
   */
  async setJSON(key, data, ttlSeconds) {
    try {
      const serialized = JSON.stringify(data);
      return await this.set(key, serialized, ttlSeconds);
    } catch (error) {
      console.error("[Flux Redis] JSON serialization error:", { key, error: error?.toString() });
      return false;
    }
  }
  /**
   * Get JSON data from cache
   */
  async getJSON(key) {
    try {
      const value = await this.get(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error("[Flux Redis] JSON deserialization error:", { key, error: error?.toString() });
      return null;
    }
  }
  /**
   * Health check for Redis connection
   */
  async healthCheck() {
    try {
      if (!process.env.REDIS_URL) {
        return {
          status: "disabled",
          message: "Redis not configured - REDIS_URL missing",
          details: {
            note: "Cache features are disabled in development"
          }
        };
      }
      await this.ensureInitialized();
      if (!this.client) {
        return {
          status: "unhealthy",
          message: "Redis client not initialized",
          details: {}
        };
      }
      const start = Date.now();
      const pingResult = await this.client.ping();
      const duration = Date.now() - start;
      if (pingResult === "PONG") {
        return {
          status: "healthy",
          message: "Redis connection successful",
          details: {
            responseTime: `${duration}ms`,
            connected: this.isConnected
          }
        };
      } else {
        return {
          status: "unhealthy",
          message: "Redis ping failed",
          details: { pingResult }
        };
      }
    } catch (error) {
      return {
        status: "unhealthy",
        message: "Redis connection failed",
        details: {
          error: error?.toString()
        }
      };
    }
  }
  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log("[Flux Redis] Redis connection closed");
    }
  }
  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      ready: this.client?.isReady || false
    };
  }
}
const fluxRedis = new FluxRedis();
const RATE_LIMITS = {
  // General API endpoints
  default: {
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    maxRequests: 100
  }
};
function createRateLimit(config) {
  return async (event) => {
    try {
      const { request, getClientAddress } = event;
      const clientIP = getClientAddress();
      const key = config.keyGenerator ? config.keyGenerator(request, clientIP) : `flux:ratelimit:${clientIP}:${new URL(request.url).pathname}`;
      const currentCountStr = await fluxRedis.get(key);
      const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;
      if (currentCount >= config.maxRequests) {
        console.warn(`[Flux Rate Limit] Limit exceeded for ${clientIP} on ${request.url}`);
        return json(
          {
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Too many requests, please try again later",
              details: {
                limit: config.maxRequests,
                windowMs: config.windowMs,
                retryAfter: Math.ceil(config.windowMs / 1e3)
              }
            }
          },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil(config.windowMs / 1e3).toString(),
              "X-RateLimit-Limit": config.maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": (Date.now() + config.windowMs).toString()
            }
          }
        );
      }
      const newCount = currentCount + 1;
      const ttlSeconds = Math.ceil(config.windowMs / 1e3);
      if (currentCount === 0) {
        await fluxRedis.set(key, newCount.toString(), ttlSeconds);
      } else {
        await fluxRedis.set(key, newCount.toString());
      }
      console.log(`[Flux Rate Limit] ${clientIP} - ${newCount}/${config.maxRequests} requests`);
      return null;
    } catch (error) {
      console.error("[Flux Rate Limit] Error in rate limiting middleware:", error);
      return null;
    }
  };
}
const generalRateLimit = createRateLimit(RATE_LIMITS.default);
async function cacheResponse(cacheKey, response, ttl) {
  try {
    if (response.status < 200 || response.status >= 300) {
      return;
    }
    const responseClone = response.clone();
    const body = await responseClone.json();
    const headers = {};
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
    console.error("[Flux Cache] Cache write error:", { cacheKey, error });
  }
}
const corsMiddleware = async ({ event, resolve }) => {
  if (event.request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  const response = await resolve(event);
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
};
const securityMiddleware = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
};
const loggingMiddleware = async ({ event, resolve }) => {
  const start = Date.now();
  const { method, url } = event.request;
  console.log(`[Flux] ${method} ${url} - Started`);
  const response = await resolve(event);
  const duration = Date.now() - start;
  response.headers.set("X-Response-Time", `${duration}ms`);
  console.log(`[Flux] ${method} ${url} - ${response.status} (${duration}ms)`);
  return response;
};
const rateLimitMiddleware = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/api/")) {
    const rateLimitResponse = await generalRateLimit(event);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }
  return resolve(event);
};
const cacheMiddleware = async ({ event, resolve }) => {
  const response = await resolve(event);
  if (event.locals.cacheKey && event.locals.cacheTtl) {
    cacheResponse(event.locals.cacheKey, response, event.locals.cacheTtl).catch((error) => {
      console.error("[Flux Cache] Failed to cache response:", error);
    });
  }
  return response;
};
const handle = sequence(
  corsMiddleware,
  securityMiddleware,
  loggingMiddleware,
  rateLimitMiddleware,
  cacheMiddleware
);
const handleError = async ({ error, event }) => {
  const errorId = crypto.randomUUID();
  console.error(`[Flux Error ${errorId}]`, {
    error: error?.toString(),
    stack: error?.stack,
    url: event.url.toString(),
    method: event.request.method,
    userAgent: event.request.headers.get("user-agent"),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (process.env.NODE_ENV === "development") {
    return {
      message: error?.message || "Internal server error occurred in Flux backend",
      errorId,
      stack: error?.stack,
      details: {
        url: event.url.pathname,
        method: event.request.method
      }
    };
  } else {
    return {
      message: "Internal server error occurred in Flux backend",
      errorId
    };
  }
};
export {
  handle,
  handleError
};
