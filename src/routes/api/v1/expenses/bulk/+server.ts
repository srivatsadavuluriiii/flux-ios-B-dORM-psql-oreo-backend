/**
 * Flux Expense Bulk Operations API
 * POST: Create multiple expenses in a batch
 * PUT: Update multiple expenses in a batch
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '../../../../../lib/middleware/auth-middleware.js';
import { fluxPostgreSQL } from '../../../../../lib/database/postgres.js';

/**
 * POST /api/v1/expenses/bulk
 * Create multiple expenses in a batch
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
        if (!body.expenses || !Array.isArray(body.expenses) || body.expenses.length === 0) {
            return json({
                success: false,
                error: 'At least one expense is required'
            }, { status: 400 });
        }

        // Validate each expense has required fields
        for (const expense of body.expenses) {
            if (!expense.description || !expense.amount) {
                return json({
                    success: false,
                    error: 'All expenses must have description and amount fields'
                }, { status: 400 });
            }
        }

        // Begin transaction
        const client = await fluxPostgreSQL.getClient();

        try {
            await client.query('BEGIN');

            const createdExpenses = [];

            // Process each expense
            for (const expenseData of body.expenses) {
                // Create expense
                const query = `
                    INSERT INTO expenses (
                        description, amount, currency, category_id, expense_date, 
                        location, paid_by_user_id, group_id, split_method, split_data, 
                        notes, receipt_url, receipt_filename
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
                    ) RETURNING *
                `;

                const values = [
                    expenseData.description,
                    parseFloat(expenseData.amount),
                    expenseData.currency || 'INR',
                    expenseData.category_id || null,
                    expenseData.expense_date || new Date().toISOString().split('T')[0],
                    expenseData.location || null,
                    user.id,
                    expenseData.group_id || null,
                    expenseData.split_method || 'equal',
                    expenseData.split_data ? JSON.stringify(expenseData.split_data) : null,
                    expenseData.notes || null,
                    expenseData.receipt_url || null,
                    expenseData.receipt_filename || null
                ];

                const result = await client.query(query, values);
                const expense = result.rows[0];

                // If this is a group expense, create expense splits
                if (expense.group_id) {
                    // Get group members
                    const groupMembersQuery = `
                        SELECT user_id FROM group_members 
                        WHERE group_id = $1 AND is_active = true
                    `;
                    
                    const groupResult = await client.query(groupMembersQuery, [expense.group_id]);
                    
                    if (groupResult.rows.length > 0) {
                        // Create splits based on split method
                        const members = groupResult.rows;
                        const totalMembers = members.length;
                        
                        // For equal splits, divide amount equally
                        if (expense.split_method === 'equal') {
                            const splitAmount = parseFloat(expense.amount) / totalMembers;
                            
                            for (const member of members) {
                                // Skip creating a split for the expense creator if they're in the group
                                // They'll be responsible for collecting from others
                                if (member.user_id === user.id) continue;
                                
                                const splitQuery = `
                                    INSERT INTO expense_splits (
                                        expense_id, user_id, amount, percentage, notes
                                    ) VALUES ($1, $2, $3, $4, $5)
                                `;
                                
                                await client.query(splitQuery, [
                                    expense.id,
                                    member.user_id,
                                    splitAmount,
                                    100 / totalMembers,
                                    null
                                ]);
                            }
                        } else if (expense.split_method === 'percentage' || expense.split_method === 'exact') {
                            // Use custom split data if provided
                            if (expense.split_data) {
                                const splitData = typeof expense.split_data === 'string' 
                                    ? JSON.parse(expense.split_data) 
                                    : expense.split_data;
                                
                                for (const split of splitData) {
                                    // Skip creating a split for the expense creator
                                    if (split.user_id === user.id) continue;
                                    
                                    const splitAmount = expense.split_method === 'percentage'
                                        ? (parseFloat(expense.amount) * (split.percentage / 100))
                                        : split.amount;
                                    
                                    const splitQuery = `
                                        INSERT INTO expense_splits (
                                            expense_id, user_id, amount, percentage, notes
                                        ) VALUES ($1, $2, $3, $4, $5)
                                    `;
                                    
                                    await client.query(splitQuery, [
                                        expense.id,
                                        split.user_id,
                                        splitAmount,
                                        split.percentage || null,
                                        split.notes || null
                                    ]);
                                }
                            }
                        }
                    }
                }

                createdExpenses.push(expense);
            }

            // Commit transaction
            await client.query('COMMIT');

            return json({
                success: true,
                data: {
                    expenses: createdExpenses,
                    count: createdExpenses.length,
                    message: `Successfully created ${createdExpenses.length} expenses`
                }
            }, { status: 201 });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('[Flux API] ❌ Failed to create bulk expenses:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create bulk expenses'
        }, { status: 500 });
    }
};

/**
 * PUT /api/v1/expenses/bulk
 * Update multiple expenses in a batch
 */
export const PUT: RequestHandler = async ({ request, url, locals }) => {
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
        if (!body.expenses || !Array.isArray(body.expenses) || body.expenses.length === 0) {
            return json({
                success: false,
                error: 'At least one expense is required'
            }, { status: 400 });
        }

        // Validate each expense has id
        for (const expense of body.expenses) {
            if (!expense.id) {
                return json({
                    success: false,
                    error: 'All expenses must have an id field'
                }, { status: 400 });
            }
        }

        // Begin transaction
        const client = await fluxPostgreSQL.getClient();

        try {
            await client.query('BEGIN');

            const updatedExpenses = [];
            const failedUpdates = [];

            // Process each expense
            for (const expenseData of body.expenses) {
                // First check if user owns the expense
                const checkQuery = `
                    SELECT id FROM expenses 
                    WHERE id = $1 AND paid_by_user_id = $2 AND is_deleted = false
                `;
                
                const checkResult = await client.query(checkQuery, [expenseData.id, user.id]);
                
                if (checkResult.rows.length === 0) {
                    failedUpdates.push({
                        id: expenseData.id,
                        error: 'Expense not found or not owned by user'
                    });
                    continue;
                }

                // Build update query dynamically based on provided fields
                const updateFields = [];
                const values = [expenseData.id];
                let paramIndex = 2;

                if (expenseData.description !== undefined) {
                    updateFields.push(`description = $${paramIndex++}`);
                    values.push(expenseData.description);
                }

                if (expenseData.amount !== undefined) {
                    updateFields.push(`amount = $${paramIndex++}`);
                    values.push(parseFloat(expenseData.amount));
                }

                if (expenseData.currency !== undefined) {
                    updateFields.push(`currency = $${paramIndex++}`);
                    values.push(expenseData.currency);
                }

                if (expenseData.category_id !== undefined) {
                    updateFields.push(`category_id = $${paramIndex++}`);
                    values.push(expenseData.category_id);
                }

                if (expenseData.expense_date !== undefined) {
                    updateFields.push(`expense_date = $${paramIndex++}`);
                    values.push(expenseData.expense_date);
                }

                if (expenseData.location !== undefined) {
                    updateFields.push(`location = $${paramIndex++}`);
                    values.push(expenseData.location);
                }

                if (expenseData.notes !== undefined) {
                    updateFields.push(`notes = $${paramIndex++}`);
                    values.push(expenseData.notes);
                }

                if (expenseData.status !== undefined) {
                    updateFields.push(`status = $${paramIndex++}`);
                    values.push(expenseData.status);
                }

                // Always update updated_at timestamp
                updateFields.push(`updated_at = NOW()`);

                // Only update if there are fields to update
                if (updateFields.length > 0) {
                    const updateQuery = `
                        UPDATE expenses
                        SET ${updateFields.join(', ')}
                        WHERE id = $1
                        RETURNING *
                    `;

                    const result = await client.query(updateQuery, values);
                    updatedExpenses.push(result.rows[0]);
                } else {
                    failedUpdates.push({
                        id: expenseData.id,
                        error: 'No fields to update'
                    });
                }
            }

            // Commit transaction
            await client.query('COMMIT');

            return json({
                success: true,
                data: {
                    updated_expenses: updatedExpenses,
                    failed_updates: failedUpdates,
                    success_count: updatedExpenses.length,
                    failure_count: failedUpdates.length,
                    message: `Successfully updated ${updatedExpenses.length} expenses with ${failedUpdates.length} failures`
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('[Flux API] ❌ Failed to update bulk expenses:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update bulk expenses'
        }, { status: 500 });
    }
}; 