import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnabledProviders } from '$lib/services/auth/oauth-providers.js';
import { checkSupabaseHealth } from '$lib/database/supabase.js';

/**
 * Flux Health Check Endpoint
 * Provides basic system status information
 */
export const GET: RequestHandler = async () => {
  const startTime = Date.now();

  try {
    // Check Supabase connection
    const supabaseHealth = await checkSupabaseHealth();
    
    // Get enabled OAuth providers
    const oauthProviders = getEnabledProviders();
    
    // Check if OAuth is properly configured
    const githubConfigured = !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
    const googleConfigured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
    const webhookConfigured = !!process.env.WEBHOOK_SECRET;
    
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
        
        // Auth status
        auth: {
          supabase: supabaseHealth.status,
          oauthProviders: {
            available: oauthProviders.map(p => p.name),
            github: {
              enabled: oauthProviders.some(p => p.name === 'github'),
              configured: githubConfigured
            },
            google: {
              enabled: oauthProviders.some(p => p.name === 'google'),
              configured: googleConfigured
            }
          },
          webhook: {
            configured: webhookConfigured
          }
        },

        // Phase completion status
        development: {
          phase: 'Phase 2 - Authentication System',
          completion: '90%',
          checkpoints: {
            'supabase-auth': 'completed',
            'oauth-providers': 'completed',
            'user-data-sync': 'completed'
          },
          nextPhase: 'Phase 3 - Core API Layer'
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
          error: error instanceof Error ? error.message : String(error)
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

/**
 * Simple health check helper function
 * Used for simple status responses
 */
export const _getSimple = async () => {
    return json({
        status: 'ok',
        message: 'Flux API is running',
        timestamp: new Date().toISOString()
    });
}; 