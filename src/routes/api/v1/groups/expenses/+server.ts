/**
 * Flux Group Expenses API
 * GET: Get expenses for a specific group
 * POST: Create a new group expense
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '../../../../../lib/middleware/auth-middleware.js';
import { fluxPostgreSQL } from '../../../../../lib/database/postgres.js';

/**
 * GET /api/v1/groups/expenses
 * Get expenses for a specific group
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

        // Get group ID from query parameters
        const groupId = url.searchParams.get('group_id');
        if (!groupId) {
            return json({
                success: false,
                error: 'Group ID is required'
            }, { status: 400 });
        }

        // Check if user is a member of the group
        const memberCheckQuery = `
            SELECT id FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND is_active = true
        `;
        const memberCheckResult = await fluxPostgreSQL.query(memberCheckQuery, [groupId, user.id]);
        
        if (memberCheckResult.rows.length === 0) {
            return json({
                success: false,
                error: 'You are not a member of this group'
            }, { status: 403 });
        }

        // Parse query parameters
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20;
        const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0;
        const sortBy = url.searchParams.get('sort_by') || 'created_at';
        const sortOrder = url.searchParams.get('sort_order')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Validate sort field
        const validSortFields = [
            'created_at', 'expense_date', 'amount', 'description', 'status', 'is_settled'
        ];
        const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';

        // Get group expenses
        const query = `
            SELECT 
                e.id, e.description, e.amount, e.currency, e.expense_date,
                e.category_id, e.receipt_url, e.status, e.is_settled,
                e.paid_by_user_id, e.group_id, e.split_method, e.split_data,
                e.created_at, e.updated_at, e.notes, e.location,
                ec.name as category_name, ec.icon_name as category_icon, ec.color_hex as category_color,
                u.display_name as paid_by_display_name, u.full_name as paid_by_name, 
                u.avatar_url as paid_by_avatar,
                g.name as group_name
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN users u ON e.paid_by_user_id = u.id
            LEFT JOIN groups g ON e.group_id = g.id
            WHERE e.group_id = $1 AND e.is_deleted = false
            ORDER BY e.${orderField} ${sortOrder}
            LIMIT $2 OFFSET $3
        `;

        const countQuery = `
            SELECT COUNT(*) as total
            FROM expenses
            WHERE group_id = $1 AND is_deleted = false
        `;

        // Execute both queries
        const [expensesResult, countResult] = await Promise.all([
            fluxPostgreSQL.query(query, [groupId, limit.toString(), offset.toString()]),
            fluxPostgreSQL.query(countQuery, [groupId])
        ]);

        const expenses = expensesResult.rows;
        const total = parseInt(countResult.rows[0].total);

        // For each expense, get the splits
        const expensesWithSplits = await Promise.all(expenses.map(async (expense) => {
            const splitsQuery = `
                SELECT 
                    es.id, es.expense_id, es.user_id, es.amount, es.percentage,
                    es.status, es.settled_at, es.notes,
                    u.display_name, u.full_name, u.avatar_url
                FROM expense_splits es
                JOIN users u ON es.user_id = u.id
                WHERE es.expense_id = $1
            `;
            
            const splitsResult = await fluxPostgreSQL.query(splitsQuery, [expense.id]);
            
            return {
                ...expense,
                splits: splitsResult.rows
            };
        }));

        // Get total balances for the group
        const balancesQuery = `
            WITH member_expenses AS (
                -- Expenses paid by members
                SELECT 
                    paid_by_user_id as user_id,
                    SUM(amount) as total_paid
                FROM expenses
                WHERE group_id = $1 AND is_deleted = false
                GROUP BY paid_by_user_id
            ),
            member_splits AS (
                -- Expenses owed by members
                SELECT 
                    es.user_id,
                    SUM(es.amount) as total_owed
                FROM expense_splits es
                JOIN expenses e ON es.expense_id = e.id
                WHERE e.group_id = $1 AND e.is_deleted = false
                GROUP BY es.user_id
            ),
            all_members AS (
                -- All group members
                SELECT 
                    gm.user_id,
                    u.display_name,
                    u.full_name,
                    u.avatar_url
                FROM group_members gm
                JOIN users u ON gm.user_id = u.id
                WHERE gm.group_id = $1 AND gm.is_active = true
            )
            SELECT 
                am.user_id,
                am.display_name,
                am.full_name,
                am.avatar_url,
                COALESCE(me.total_paid, 0) as total_paid,
                COALESCE(ms.total_owed, 0) as total_owed,
                COALESCE(me.total_paid, 0) - COALESCE(ms.total_owed, 0) as balance
            FROM all_members am
            LEFT JOIN member_expenses me ON am.user_id = me.user_id
            LEFT JOIN member_splits ms ON am.user_id = ms.user_id
            ORDER BY balance DESC
        `;
        
        const balancesResult = await fluxPostgreSQL.query(balancesQuery, [groupId]);
        
        return json({
            success: true,
            data: {
                expenses: expensesWithSplits,
                total,
                pagination: {
                    limit,
                    offset,
                    has_more: total > (offset + limit)
                },
                sorting: {
                    sort_by: sortBy,
                    sort_order: sortOrder
                },
                balances: balancesResult.rows
            }
        });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to get group expenses:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get group expenses'
        }, { status: 500 });
    }
};

/**
 * POST /api/v1/groups/expenses
 * Create a new group expense
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
        if (!body.group_id) {
            return json({
                success: false,
                error: 'Group ID is required'
            }, { status: 400 });
        }

        if (!body.description || !body.amount) {
            return json({
                success: false,
                error: 'Description and amount are required'
            }, { status: 400 });
        }

        // Check if user is a member of the group
        const memberCheckQuery = `
            SELECT id FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND is_active = true
        `;
        const memberCheckResult = await fluxPostgreSQL.query(memberCheckQuery, [body.group_id, user.id]);
        
        if (memberCheckResult.rows.length === 0) {
            return json({
                success: false,
                error: 'You are not a member of this group'
            }, { status: 403 });
        }

        // Begin transaction
        const client = await fluxPostgreSQL.getClient();
        
        try {
            await client.query('BEGIN');
            
            // Create expense
            const expenseQuery = `
                INSERT INTO expenses (
                    description, amount, currency, category_id, expense_date,
                    location, paid_by_user_id, group_id, split_method, split_data,
                    notes, receipt_url, receipt_filename
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
                ) RETURNING *
            `;
            
            const expenseValues = [
                body.description,
                parseFloat(body.amount.toString()),
                body.currency || 'INR',
                body.category_id || null,
                body.expense_date || new Date().toISOString().split('T')[0],
                body.location || null,
                // The person who paid the expense - could be user or another group member
                body.paid_by_user_id || user.id,
                body.group_id,
                body.split_method || 'equal',
                body.split_data ? JSON.stringify(body.split_data) : null,
                body.notes || null,
                body.receipt_url || null,
                body.receipt_filename || null
            ];
            
            const expenseResult = await client.query(expenseQuery, expenseValues);
            const expense = expenseResult.rows[0];
            
            // Get group members
            const membersQuery = `
                SELECT user_id FROM group_members
                WHERE group_id = $1 AND is_active = true
            `;
            
            const membersResult = await client.query(membersQuery, [body.group_id]);
            const members = membersResult.rows;
            
            // Create splits based on split method
            if (expense.split_method === 'equal') {
                // Equal split
                const splitAmount = parseFloat(expense.amount) / members.length;
                const splitPercentage = 100 / members.length;
                
                for (const member of members) {
                    // Skip creating a split for the person who paid
                    if (member.user_id === expense.paid_by_user_id) continue;
                    
                    const splitQuery = `
                        INSERT INTO expense_splits (
                            expense_id, user_id, amount, percentage, notes
                        ) VALUES ($1, $2, $3, $4, $5)
                        RETURNING *
                    `;
                    
                    await client.query(splitQuery, [
                        expense.id,
                        member.user_id,
                        splitAmount,
                        splitPercentage,
                        null
                    ]);
                }
            } else if (expense.split_method === 'percentage' || expense.split_method === 'exact') {
                // Custom split
                if (!expense.split_data) {
                    throw new Error('Split data is required for percentage or exact splits');
                }
                
                const splitData = typeof expense.split_data === 'string'
                    ? JSON.parse(expense.split_data)
                    : expense.split_data;
                
                for (const split of splitData) {
                    // Skip creating a split for the person who paid
                    if (split.user_id === expense.paid_by_user_id) continue;
                    
                    const splitAmount = expense.split_method === 'percentage'
                        ? (parseFloat(expense.amount) * (split.percentage / 100))
                        : split.amount;
                    
                    const splitQuery = `
                        INSERT INTO expense_splits (
                            expense_id, user_id, amount, percentage, notes
                        ) VALUES ($1, $2, $3, $4, $5)
                        RETURNING *
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
            
            // Get the expense with splits
            const completeExpenseQuery = `
                SELECT 
                    e.id, e.description, e.amount, e.currency, e.expense_date,
                    e.category_id, e.receipt_url, e.status, e.is_settled,
                    e.paid_by_user_id, e.group_id, e.split_method, e.split_data,
                    e.created_at, e.updated_at, e.notes, e.location,
                    ec.name as category_name, ec.icon_name as category_icon, ec.color_hex as category_color,
                    u.display_name as paid_by_display_name, u.full_name as paid_by_name, 
                    u.avatar_url as paid_by_avatar,
                    g.name as group_name
                FROM expenses e
                LEFT JOIN expense_categories ec ON e.category_id = ec.id
                LEFT JOIN users u ON e.paid_by_user_id = u.id
                LEFT JOIN groups g ON e.group_id = g.id
                WHERE e.id = $1
            `;
            
            const splitsQuery = `
                SELECT 
                    es.id, es.expense_id, es.user_id, es.amount, es.percentage,
                    es.status, es.settled_at, es.notes,
                    u.display_name, u.full_name, u.avatar_url
                FROM expense_splits es
                JOIN users u ON es.user_id = u.id
                WHERE es.expense_id = $1
            `;
            
            const [completeExpenseResult, splitsResult] = await Promise.all([
                client.query(completeExpenseQuery, [expense.id]),
                client.query(splitsQuery, [expense.id])
            ]);
            
            const completeExpense = {
                ...completeExpenseResult.rows[0],
                splits: splitsResult.rows
            };
            
            // Commit transaction
            await client.query('COMMIT');
            
            return json({
                success: true,
                data: completeExpense
            }, { status: 201 });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('[Flux API] ❌ Failed to create group expense:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create group expense'
        }, { status: 500 });
    }
}; 