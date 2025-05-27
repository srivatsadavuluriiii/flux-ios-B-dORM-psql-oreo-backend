/**
 * Flux Expenses Test API
 * GET: List expenses without authentication (for testing only)
 * NOT FOR PRODUCTION USE
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { expenseService } from '../../../../../lib/services/expenses/expense-service.js';
import { fluxPostgreSQL } from '../../../../../lib/database/postgres.js';

/**
 * GET /api/v1/expenses/test
 * Test endpoint to list expenses without authentication
 */
export const GET: RequestHandler = async ({ url }) => {
    try {
        console.log('[Flux Test API] Getting test expenses...');
        
        // Get the first user in the database
        const userResult = await fluxPostgreSQL.query('SELECT id FROM users LIMIT 1');
        
        if (userResult.rows.length === 0) {
            return json({
                success: false,
                error: 'No users found in database'
            }, { status: 500 });
        }
        
        const userId = userResult.rows[0].id;
        console.log('[Flux Test API] Using user ID:', userId);
        
        // Parse query parameters
        const searchParams = url.searchParams;
        const filters = {
            limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
            offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
            sort_by: (searchParams.get('sort_by') as any) || 'created_at',
            sort_order: (searchParams.get('sort_order') as 'ASC' | 'DESC') || 'DESC'
        };

        // Get expenses
        const result = await expenseService.getExpenses(userId, filters);

        return json({
            success: true,
            data: {
                expenses: result.expenses,
                total: result.total,
                limit: filters.limit,
                offset: filters.offset,
                has_more: result.total > (filters.offset + filters.limit),
                test_user_id: userId
            }
        });

    } catch (error) {
        console.error('[Flux Test API] ❌ Failed to get test expenses:', error);
        return json({
            success: false,
            error: 'Failed to get test expenses',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}; 