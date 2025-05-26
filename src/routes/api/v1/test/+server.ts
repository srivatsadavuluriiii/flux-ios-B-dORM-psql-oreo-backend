/**
 * Simple Test API Endpoint
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    return json({
        success: true,
        message: 'Test endpoint working',
        timestamp: new Date().toISOString()
    });
}; 