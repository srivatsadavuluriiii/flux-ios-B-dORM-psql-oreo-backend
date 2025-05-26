/**
 * Flux Individual Expense API
 * GET: Get expense by ID
 * PUT: Update expense
 * DELETE: Delete expense
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { expenseService } from '../../../../../lib/services/expenses/expense-service.js';
import { requireAuth } from '../../../../../lib/middleware/auth-middleware.js';

/**
 * GET /api/v1/expenses/[id]
 * Get expense by ID
 */
export const GET: RequestHandler = async ({ params, request, url, locals }) => {
    try {
        // Authenticate user
        const user = requireAuth({ request, url, locals } as any);
        if (!user) {
            return json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        const expenseId = params.id;
        if (!expenseId) {
            return json({
                success: false,
                error: 'Expense ID is required'
            }, { status: 400 });
        }

        // Get expense
        const expense = await expenseService.getExpenseById(expenseId, user.id);
        
        if (!expense) {
            return json({
                success: false,
                error: 'Expense not found'
            }, { status: 404 });
        }

        return json({
            success: true,
            data: {
                expense
            }
        });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to get expense:', error);
        return json({
            success: false,
            error: 'Failed to get expense'
        }, { status: 500 });
    }
};

/**
 * PUT /api/v1/expenses/[id]
 * Update expense
 */
export const PUT: RequestHandler = async ({ params, request, url, locals }) => {
    try {
        // Authenticate user
        const user = requireAuth({ request, url, locals } as any);
        if (!user) {
            return json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        const expenseId = params.id;
        if (!expenseId) {
            return json({
                success: false,
                error: 'Expense ID is required'
            }, { status: 400 });
        }

        // Parse request body
        const body = await request.json();
        
        // Update expense
        const expense = await expenseService.updateExpense(expenseId, user.id, {
            description: body.description,
            amount: body.amount ? parseFloat(body.amount) : undefined,
            currency: body.currency,
            category_id: body.category_id,
            expense_date: body.expense_date,
            location: body.location,
            split_method: body.split_method,
            split_data: body.split_data,
            notes: body.notes,
            status: body.status
        });

        return json({
            success: true,
            data: {
                expense,
                message: 'Expense updated successfully'
            }
        });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to update expense:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update expense'
        }, { status: 500 });
    }
};

/**
 * DELETE /api/v1/expenses/[id]
 * Delete expense (soft delete)
 */
export const DELETE: RequestHandler = async ({ params, request, url, locals }) => {
    try {
        // Authenticate user
        const user = requireAuth({ request, url, locals } as any);
        if (!user) {
            return json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        const expenseId = params.id;
        if (!expenseId) {
            return json({
                success: false,
                error: 'Expense ID is required'
            }, { status: 400 });
        }

        // Delete expense
        const success = await expenseService.deleteExpense(expenseId, user.id);
        
        if (!success) {
            return json({
                success: false,
                error: 'Failed to delete expense'
            }, { status: 500 });
        }

        return json({
            success: true,
            data: {
                message: 'Expense deleted successfully'
            }
        });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to delete expense:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete expense'
        }, { status: 500 });
    }
}; 