import { Pool, type PoolClient, type QueryResult } from 'pg';

/**
 * Flux PostgreSQL Database Connection
 * Manages connection to Railway PostgreSQL database for app data storage
 */
class FluxPostgreSQL {
  private pool: Pool | null = null;
  private isConnected = false;
  private initialized = false;

  constructor() {
    // Lazy initialization to avoid startup issues
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  private initializePool(): void {
    try {
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        console.warn('[Flux PostgreSQL] DATABASE_URL not provided, database features will be disabled');
        return;
      }

      this.pool = new Pool({
        connectionString: databaseUrl,
        min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
        max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
        idleTimeoutMillis: parseInt(process.env.DATABASE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DATABASE_TIMEOUT || '30000'),
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Handle pool events
      this.pool.on('connect', () => {
        console.log('[Flux PostgreSQL] Client connected to database');
        this.isConnected = true;
      });

      this.pool.on('error', (err) => {
        console.error('[Flux PostgreSQL] Unexpected error on idle client:', err);
        this.isConnected = false;
      });

      console.log('[Flux PostgreSQL] Connection pool initialized');
    } catch (error) {
      console.error('[Flux PostgreSQL] Failed to initialize connection pool:', error);
    }
  }

  /**
   * Ensure pool is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      this.initializePool();
      this.initialized = true;
    }
  }

  /**
   * Get a client from the connection pool
   */
  async getClient(): Promise<PoolClient> {
    await this.ensureInitialized();
    
    if (!this.pool) {
      throw new Error('Flux PostgreSQL pool not initialized - DATABASE_URL may be missing');
    }

    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      console.error('[Flux PostgreSQL] Failed to get client from pool:', error);
      throw error;
    }
  }

  /**
   * Execute a query with automatic client management
   */
  async query<T extends Record<string, any> = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const client = await this.getClient();
    
    try {
      const start = Date.now();
      const result = await client.query<T>(text, params);
      const duration = Date.now() - start;
      
      console.log('[Flux PostgreSQL] Query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
      
      return result;
    } catch (error) {
      console.error('[Flux PostgreSQL] Query error:', {
        query: text,
        params,
        error: error?.toString()
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      
      console.log('[Flux PostgreSQL] Transaction completed successfully');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Flux PostgreSQL] Transaction rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check database connectivity
   */
  async healthCheck(): Promise<{ status: string; message: string; details?: any }> {
    try {
      if (!process.env.DATABASE_URL) {
        return {
          status: 'disabled',
          message: 'PostgreSQL not configured - DATABASE_URL missing',
          details: {
            note: 'Database features are disabled in development'
          }
        };
      }

      await this.ensureInitialized();
      
      if (!this.pool) {
        return {
          status: 'unhealthy',
          message: 'PostgreSQL pool not initialized',
          details: {}
        };
      }

      const start = Date.now();
      const result = await this.query('SELECT NOW() as current_time, version() as version');
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        message: 'PostgreSQL connection successful',
        details: {
          responseTime: `${duration}ms`,
          serverTime: result.rows[0]?.current_time,
          version: result.rows[0]?.version?.split(' ')[0],
          poolSize: this.pool?.totalCount || 0,
          idleConnections: this.pool?.idleCount || 0
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'PostgreSQL connection failed',
        details: {
          error: error?.toString()
        }
      };
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('[Flux PostgreSQL] Connection pool closed');
    }
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; poolInfo?: any } {
    return {
      connected: this.isConnected,
      poolInfo: this.pool ? {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      } : null
    };
  }
}

// Export singleton instance for Flux backend
export const fluxPostgreSQL = new FluxPostgreSQL();

// Export types for use in other modules
export type { PoolClient, QueryResult } from 'pg'; 