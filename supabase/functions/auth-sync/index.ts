/// <reference types="https://deno.land/x/types/deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

console.log('Flux Auth Sync Edge Function started')

serve(async (req) => {
  try {
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
    const payload = await req.json()
    console.log('Received auth event:', payload.type, 'for user:', payload.record?.id)

    // Get environment variables
    // @ts-ignore - Deno is available in Supabase Edge Function runtime
    const railwayApiUrl = Deno.env.get('RAILWAY_API_URL')
    // @ts-ignore - Deno is available in Supabase Edge Function runtime
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')

    if (!railwayApiUrl) {
      console.error('RAILWAY_API_URL environment variable not set')
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
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
          details: errorText
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const result = await response.json()
    console.log('Railway webhook success:', result)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Auth event processed successfully',
        data: result
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Auth sync function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}) 