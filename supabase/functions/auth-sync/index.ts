/// <reference types="https://deno.land/x/types/deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

console.log('Flux Auth Sync Edge Function started')

interface AuthWebhookPayload {
  type: string;
  table: string;
  schema: string;
  record?: any;
  old_record?: any;
}

serve(async (req) => {
  try {
    const startTime = Date.now();
    console.log('Auth sync function triggered:', req.method, req.url)

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    // Only handle POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse the webhook payload
    const payload: AuthWebhookPayload = await req.json()
    console.log('Received auth event:', payload.type, 'for user:', payload.record?.id)

    // Get environment variables
    // @ts-ignore - Deno is available in Supabase Edge Function runtime
    const railwayApiUrl = Deno.env.get('RAILWAY_API_URL')
    // @ts-ignore - Deno is available in Supabase Edge Function runtime
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')

    if (!railwayApiUrl) {
      console.error('RAILWAY_API_URL environment variable not set')
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error',
          details: 'RAILWAY_API_URL not configured'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Forward the webhook to Railway backend
    const webhookUrl = `${railwayApiUrl}/api/v1/auth/webhook`
    console.log('Forwarding webhook to:', webhookUrl)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add authorization header if webhook secret is configured
    if (webhookSecret) {
      headers['Authorization'] = `Bearer ${webhookSecret}`
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Railway webhook failed:', response.status, errorText)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to forward webhook',
            details: errorText,
            status: response.status
          }),
          { 
            status: 502, // Bad Gateway
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      const result = await response.json()
      const processingTime = Date.now() - startTime;
      console.log(`Railway webhook success for ${payload.type}. Processing time: ${processingTime}ms`)

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Auth event processed successfully',
          data: result,
          processingTime
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    } catch (fetchError) {
      console.error('Fetch error when forwarding webhook:', fetchError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to connect to Railway API',
          details: fetchError.message,
          retryable: true
        }),
        { 
          status: 503, // Service Unavailable
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '10' // Suggest retry after 10 seconds
          }
        }
      )
    }
  } catch (error) {
    console.error('Auth sync function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}) 