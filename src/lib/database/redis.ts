import { createClient, type RedisClientType } from 'redis';
import { FLUX_CONFIG } from '../config/environment.js';

/**
 * Flux Redis Cache Connection
 * Manages connection to Railway Redis for caching and session storage
 */
class FluxRedis {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private initialized = false;

  constructor() {
    // Lazy initialization to avoid startup issues
  }

  /**
   * Initialize Redis client
   */
  private async initializeClient(): Promise<void> {
    try {
          const redisUrl = FLUX_CONFIG.redisUrl;
    
    if (!redisUrl) {
      console.warn('[Flux Redis] REDIS_URL not provided, cache features will be disabled');
      return;
    }

      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000
        }
      });

      // Handle Redis events
      this.client.on('connect', () => {
        console.log('[Flux Redis] Client connected to Redis');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('[Flux Redis] Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('[Flux Redis] Redis connection ended');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      console.log('[Flux Redis] Redis client initialized and connected');
    } catch (error) {
      console.error('[Flux Redis] Failed to initialize Redis client:', error);
    }
  }

  /**
   * Ensure client is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeClient();
      this.initialized = true;
    }
  }

  /**
   * Set a key-value pair with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!this.client || !this.isConnected) {
        console.warn('[Flux Redis] Redis not available for SET operation');
        return false;
      }

      const ttl = ttlSeconds || parseInt(process.env.CACHE_TTL_DEFAULT || '3600');
      await this.client.setEx(key, ttl, value);
      
      console.log(`[Flux Redis] SET ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error('[Flux Redis] SET error:', { key, error: error?.toString() });
      return false;
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    try {
      await this.ensureInitialized();
      
      if (!this.client || !this.isConnected) {
        console.warn('[Flux Redis] Redis not available for GET operation');
        return null;
      }

      const value = await this.client.get(key);
      console.log(`[Flux Redis] GET ${key} - ${value ? 'HIT' : 'MISS'}`);
      return value;
    } catch (error) {
      console.error('[Flux Redis] GET error:', { key, error: error?.toString() });
      return null;
    }
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!this.client || !this.isConnected) {
        console.warn('[Flux Redis] Redis not available for DEL operation');
        return false;
      }

      const result = await this.client.del(key);
      console.log(`[Flux Redis] DEL ${key} - ${result > 0 ? 'SUCCESS' : 'NOT_FOUND'}`);
      return result > 0;
    } catch (error) {
      console.error('[Flux Redis] DEL error:', { key, error: error?.toString() });
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!this.client || !this.isConnected) {
        console.warn('[Flux Redis] Redis not available for EXISTS operation');
        return false;
      }

      const exists = await this.client.exists(key);
      return exists > 0;
    } catch (error) {
      console.error('[Flux Redis] EXISTS error:', { key, error: error?.toString() });
      return false;
    }
  }

  /**
   * Set TTL for a key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!this.client || !this.isConnected) {
        console.warn('[Flux Redis] Redis not available for EXPIRE operation');
        return false;
      }

      const result = await this.client.expire(key, ttlSeconds);
      return result;
    } catch (error) {
      console.error('[Flux Redis] EXPIRE error:', { key, ttlSeconds, error: error?.toString() });
      return false;
    }
  }

  /**
   * Cache JSON data
   */
  async setJSON(key: string, data: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(data);
      return await this.set(key, serialized, ttlSeconds);
    } catch (error) {
      console.error('[Flux Redis] JSON serialization error:', { key, error: error?.toString() });
      return false;
    }
  }

  /**
   * Get JSON data from cache
   */
  async getJSON<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('[Flux Redis] JSON deserialization error:', { key, error: error?.toString() });
      return null;
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<{ status: string; message: string; details?: any }> {
    try {
      if (!process.env.REDIS_URL) {
        return {
          status: 'disabled',
          message: 'Redis not configured - REDIS_URL missing',
          details: {
            note: 'Cache features are disabled in development'
          }
        };
      }

      await this.ensureInitialized();
      
      if (!this.client) {
        return {
          status: 'unhealthy',
          message: 'Redis client not initialized',
          details: {}
        };
      }

      const start = Date.now();
      const pingResult = await this.client.ping();
      const duration = Date.now() - start;
      
      if (pingResult === 'PONG') {
        return {
          status: 'healthy',
          message: 'Redis connection successful',
          details: {
            responseTime: `${duration}ms`,
            connected: this.isConnected
          }
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Redis ping failed',
          details: { pingResult }
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Redis connection failed',
        details: {
          error: error?.toString()
        }
      };
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('[Flux Redis] Redis connection closed');
    }
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; ready: boolean } {
    return {
      connected: this.isConnected,
      ready: this.client?.isReady || false
    };
  }
}

// Export singleton instance for Flux backend
export const fluxRedis = new FluxRedis();

// Export types for use in other modules
export type { RedisClientType } from 'redis'; 