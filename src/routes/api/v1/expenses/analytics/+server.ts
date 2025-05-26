/**
 * Flux Expense Analytics API
 * GET: Get expense analytics and statistics
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { expenseService } from '../../../../../lib/services/expenses/expense-service.js';
import { requireAuth } from '../../../../../lib/middleware/auth-middleware.js';

/**
 * GET /api/v1/expenses/analytics
 * Get expense analytics and statistics
 */
export const GET: RequestHandler = async ({ request, url, locals }) => {
    try {
        // Authenticate user
        const user = requireAuth({ request, url, locals } as any);
        if (!user) {
            return json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        // Parse query parameters
        const searchParams = url.searchParams;
        const filters = {
            start_date: searchParams.get('start_date') || undefined,
            end_date: searchParams.get('end_date') || undefined,
            group_id: searchParams.get('group_id') || undefined
        };

        // Get expense statistics
        const stats = await expenseService.getExpenseStats(user.id, filters);

        // Calculate additional analytics
        const analytics = {
            overview: {
                total_expenses: parseInt(stats.total_expenses) || 0,
                total_paid: parseFloat(stats.total_paid) || 0,
                total_owed: parseFloat(stats.total_owed) || 0,
                average_expense: parseFloat(stats.average_expense) || 0,
                categories_used: parseInt(stats.categories_used) || 0,
                months_active: parseInt(stats.months_active) || 0
            },
            balance: {
                net_balance: (parseFloat(stats.total_paid) || 0) - (parseFloat(stats.total_owed) || 0),
                you_are_owed: Math.max(0, (parseFloat(stats.total_paid) || 0) - (parseFloat(stats.total_owed) || 0)),
                you_owe: Math.max(0, (parseFloat(stats.total_owed) || 0) - (parseFloat(stats.total_paid) || 0))
            },
            insights: {
                spending_frequency: (parseInt(stats.total_expenses) || 0) / Math.max(1, parseInt(stats.months_active) || 1),
                category_diversity: (parseInt(stats.categories_used) || 0) / Math.max(1, parseInt(stats.total_expenses) || 1),
                average_monthly_spending: ((parseFloat(stats.total_paid) || 0) + (parseFloat(stats.total_owed) || 0)) / Math.max(1, parseInt(stats.months_active) || 1)
            }
        };

        return json({
            success: true,
            data: {
                analytics,
                period: {
                    start_date: filters.start_date,
                    end_date: filters.end_date,
                    group_id: filters.group_id
                }
            }
        });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to get expense analytics:', error);
        return json({
            success: false,
            error: 'Failed to get expense analytics'
        }, { status: 500 });
    }
}; 