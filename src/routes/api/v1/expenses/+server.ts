/**
 * Flux Expenses API
 * GET: List expenses with filters
 * POST: Create new expense
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { expenseService } from '../../../../lib/services/expenses/expense-service.js';
import { requireAuth } from '../../../../lib/middleware/auth-middleware.js';

/**
 * GET /api/v1/expenses
 * List expenses with optional filters
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
            group_id: searchParams.get('group_id') || undefined,
            category_id: searchParams.get('category_id') || undefined,
            start_date: searchParams.get('start_date') || undefined,
            end_date: searchParams.get('end_date') || undefined,
            min_amount: searchParams.get('min_amount') ? parseFloat(searchParams.get('min_amount')!) : undefined,
            max_amount: searchParams.get('max_amount') ? parseFloat(searchParams.get('max_amount')!) : undefined,
            currency: searchParams.get('currency') || undefined,
            status: searchParams.get('status') || undefined,
            is_settled: searchParams.get('is_settled') ? searchParams.get('is_settled') === 'true' : undefined,
            limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
            offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
            sort_by: (searchParams.get('sort_by') as any) || 'created_at',
            sort_order: (searchParams.get('sort_order') as 'ASC' | 'DESC') || 'DESC'
        };

        // Get expenses
        const result = await expenseService.getExpenses(user.id, filters);

        return json({
            success: true,
            data: {
                expenses: result.expenses,
                total: result.total,
                limit: filters.limit,
                offset: filters.offset,
                has_more: result.total > (filters.offset + filters.limit)
            }
        });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to get expenses:', error);
        return json({
            success: false,
            error: 'Failed to get expenses'
        }, { status: 500 });
    }
};

/**
 * POST /api/v1/expenses
 * Create a new expense
 */
export const POST: RequestHandler = async ({ request, url, locals }) => {
    try {
        // Authenticate user
        const user = requireAuth({ request, url, locals } as any);
        if (!user) {
            return json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        
        // Validate required fields
        if (!body.description || !body.amount) {
            return json({
                success: false,
                error: 'Description and amount are required'
            }, { status: 400 });
        }

        // Create expense
        const expense = await expenseService.createExpense(user.id, {
            description: body.description,
            amount: parseFloat(body.amount),
            currency: body.currency || 'INR',
            category_id: body.category_id || undefined,
            expense_date: body.expense_date || undefined,
            location: body.location || undefined,
            group_id: body.group_id || undefined,
            split_method: body.split_method || 'equal',
            split_data: body.split_data || undefined,
            notes: body.notes || undefined,
            receipt_url: body.receipt_url || undefined,
            receipt_filename: body.receipt_filename || undefined
        });

        return json({
            success: true,
            data: {
                expense,
                message: 'Expense created successfully'
            }
        }, { status: 201 });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to create expense:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create expense'
        }, { status: 500 });
    }
}; 