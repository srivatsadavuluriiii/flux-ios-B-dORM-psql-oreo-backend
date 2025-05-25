import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Flux Health Check Endpoint
 * Provides basic system status information
 */
export const GET: RequestHandler = async () => {
  const startTime = Date.now();

  try {
    const responseTime = Date.now() - startTime;

    return json({
      success: true,
      data: {
        status: 'healthy',
        service: 'flux-backend',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        
        // System information
        system: {
          uptime: process.uptime(),
          memory: {
            used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
            total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
            external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100
          },
          node: process.version,
          platform: process.platform
        },

        // Phase completion status
        development: {
          phase: 'Phase 1 - Backend Foundation',
          completion: '100%',
          checkpoints: {
            'project-foundation': 'completed',
            'database-infrastructure': 'completed',
            'middleware-stack': 'completed'
          },
          nextPhase: 'Phase 2 - Frontend Development'
        }
      },
      responseTime
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'flux-backend-v1'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('[Flux Health] Health check failed:', error);
    
    return json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check encountered an error',
        details: {
          error: error?.toString()
        }
      },
      data: {
        status: 'unhealthy',
        service: 'flux-backend',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      },
      responseTime
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'flux-backend-v1'
      }
    });
  }
};

/**
 * HEAD request for simple health check (used by load balancers)
 */
export const HEAD: RequestHandler = async () => {
  try {
    return new Response(null, { 
      status: 200,
      headers: {
        'X-Health-Status': 'healthy'
      }
    });
  } catch (error) {
    return new Response(null, { status: 503 });
  }
}; 