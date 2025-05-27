/**
 * Flux API Ping Endpoint
 * Simple endpoint to test if the API is running
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GET /api/health/ping
 * Simple ping endpoint for testing
 */
export const GET: RequestHandler = async () => {
    return json({
        status: 'ok',
        message: 'pong',
        timestamp: new Date().toISOString()
    });
}; 