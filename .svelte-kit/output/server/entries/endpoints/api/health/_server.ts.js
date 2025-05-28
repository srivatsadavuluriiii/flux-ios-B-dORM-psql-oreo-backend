import { j as json } from "../../../../chunks/index.js";
import { g as getEnabledProviders } from "../../../../chunks/oauth-providers.js";
import { c as checkSupabaseHealth } from "../../../../chunks/supabase.js";
const GET = async () => {
  const startTime = Date.now();
  try {
    const supabaseHealth = await checkSupabaseHealth();
    const oauthProviders = getEnabledProviders();
    const githubConfigured = !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
    const googleConfigured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
    const webhookConfigured = !!process.env.WEBHOOK_SECRET;
    const responseTime = Date.now() - startTime;
    return json({
      success: true,
      data: {
        status: "healthy",
        service: "flux-backend",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        // System information
        system: {
          uptime: process.uptime(),
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
            external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
          },
          node: process.version,
          platform: process.platform
        },
        // Auth status
        auth: {
          supabase: supabaseHealth.status,
          oauthProviders: {
            available: oauthProviders.map((p) => p.name),
            github: {
              enabled: oauthProviders.some((p) => p.name === "github"),
              configured: githubConfigured
            },
            google: {
              enabled: oauthProviders.some((p) => p.name === "google"),
              configured: googleConfigured
            }
          },
          webhook: {
            configured: webhookConfigured
          }
        },
        // Phase completion status
        development: {
          phase: "Phase 2 - Authentication System",
          completion: "90%",
          checkpoints: {
            "supabase-auth": "completed",
            "oauth-providers": "completed",
            "user-data-sync": "completed"
          },
          nextPhase: "Phase 3 - Core API Layer"
        }
      },
      responseTime
    }, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Check": "flux-backend-v1"
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("[Flux Health] Health check failed:", error);
    return json({
      success: false,
      error: {
        code: "HEALTH_CHECK_FAILED",
        message: "Health check encountered an error",
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      },
      data: {
        status: "unhealthy",
        service: "flux-backend",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      responseTime
    }, {
      status: 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Check": "flux-backend-v1"
      }
    });
  }
};
const HEAD = async () => {
  try {
    return new Response(null, {
      status: 200,
      headers: {
        "X-Health-Status": "healthy"
      }
    });
  } catch (error) {
    return new Response(null, { status: 503 });
  }
};
const _getSimple = async () => {
  return json({
    status: "ok",
    message: "Flux API is running",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
export {
  GET,
  HEAD,
  _getSimple
};
