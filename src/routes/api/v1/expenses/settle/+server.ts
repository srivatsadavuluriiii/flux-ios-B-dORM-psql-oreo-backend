/**
 * Flux Expense Settlement API
 * POST: Settle expenses or splits
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '../../../../../lib/middleware/auth-middleware.js';
import { fluxPostgreSQL } from '../../../../../lib/database/postgres.js';

/**
 * POST /api/v1/expenses/settle
 * Settle one or more expense splits
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

        // Validate request
        if (!body.split_ids || !Array.isArray(body.split_ids) || body.split_ids.length === 0) {
            return json({
                success: false,
                error: 'At least one split_id is required'
            }, { status: 400 });
        }

        // Begin transaction
        const client = await fluxPostgreSQL.getClient();
        
        try {
            await client.query('BEGIN');

            // Verify the splits belong to the current user or are splits the user needs to pay
            const verifyQuery = `
                SELECT 
                    es.id, 
                    es.expense_id,
                    es.user_id,
                    es.amount,
                    e.paid_by_user_id,
                    e.description
                FROM expense_splits es
                JOIN expenses e ON es.expense_id = e.id
                WHERE 
                    es.id = ANY($1::uuid[]) AND
                    (es.user_id = $2 OR e.paid_by_user_id = $2) AND
                    es.is_settled = false
            `;
            
            const verifyResult = await client.query(verifyQuery, [body.split_ids, user.id]);
            
            if (verifyResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return json({
                    success: false,
                    error: 'No valid unsettled splits found'
                }, { status: 404 });
            }

            // Update the splits as settled
            const updateQuery = `
                UPDATE expense_splits
                SET 
                    is_settled = true,
                    settled_at = NOW(),
                    settlement_method = $3
                WHERE 
                    id = ANY($1::uuid[]) AND
                    (user_id = $2 OR 
                     expense_id IN (SELECT id FROM expenses WHERE paid_by_user_id = $2))
                RETURNING id, expense_id, user_id, amount, is_settled, settled_at
            `;
            
            const updateResult = await client.query(updateQuery, [
                body.split_ids, 
                user.id,
                body.settlement_method || 'manual'
            ]);

            // Check if any expense is fully settled (all splits settled)
            const expenseIds = [...new Set(updateResult.rows.map(row => row.expense_id))];
            
            if (expenseIds.length > 0) {
                const checkExpensesQuery = `
                    WITH unsettled_counts AS (
                        SELECT 
                            expense_id,
                            COUNT(*) AS unsettled
                        FROM expense_splits
                        WHERE 
                            expense_id = ANY($1::uuid[]) AND
                            is_settled = false
                        GROUP BY expense_id
                    )
                    UPDATE expenses e
                    SET 
                        is_settled = true,
                        settled_at = NOW(),
                        status = 'settled'
                    FROM unsettled_counts uc
                    WHERE 
                        e.id = uc.expense_id AND
                        uc.unsettled = 0 AND
                        e.is_settled = false
                    RETURNING e.id, e.description, e.amount
                `;
                
                const expenseResult = await client.query(checkExpensesQuery, [expenseIds]);
                
                // Commit transaction
                await client.query('COMMIT');
                
                return json({
                    success: true,
                    data: {
                        settled_splits: updateResult.rows,
                        settled_expenses: expenseResult.rows,
                        message: `Successfully settled ${updateResult.rows.length} split(s) and ${expenseResult.rows.length} expense(s)`
                    }
                });
            }
            
            // Commit transaction
            await client.query('COMMIT');
            
            return json({
                success: true,
                data: {
                    settled_splits: updateResult.rows,
                    settled_expenses: [],
                    message: `Successfully settled ${updateResult.rows.length} split(s)`
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[Flux API] ❌ Failed to settle expenses:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to settle expenses'
        }, { status: 500 });
    }
}; 