/**
 * Flux Admin Migration API
 * POST: Run database migrations on Railway
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { runMigrations } from '../../../../lib/database/migrate-on-railway.js';

/**
 * POST /api/admin/migrate
 * Run database migrations
 */
export const POST: RequestHandler = async ({ request }) => {
    try {
        // Simple API key check for admin operations
        const apiKey = request.headers.get('X-API-Key');
        const expectedKey = process.env.ADMIN_API_KEY || 'flux-admin-2025';
        
        if (apiKey !== expectedKey) {
            return json({
                success: false,
                error: 'Unauthorized - Invalid API key'
            }, { status: 401 });
        }

        console.log('[Flux Admin] Running database migrations...');
        
        // Run migrations
        await runMigrations();

        return json({
            success: true,
            data: {
                message: 'Database migrations completed successfully'
            }
        });

    } catch (error) {
        console.error('[Flux Admin] ❌ Migration failed:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Migration failed'
        }, { status: 500 });
    }
}; 