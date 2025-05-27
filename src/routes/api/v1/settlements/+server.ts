/**
 * Flux Settlements API
 * GET: Get settlement history and status
 * POST: Create a new settlement
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '../../../../lib/middleware/auth-middleware.js';
import { fluxPostgreSQL } from '../../../../lib/database/postgres.js';

/**
 * Interface for expense split to fix TypeScript linter error
 */
interface ExpenseSplit {
    id: string;
    expense_id?: string;
    user_id?: string;
    amount?: number;
    percentage?: number;
    notes?: string;
}

/**
 * GET /api/v1/settlements
 * Get settlement history and status
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
        const groupId = url.searchParams.get('group_id');
        const userId = url.searchParams.get('user_id');
        const status = url.searchParams.get('status');
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20;
        const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0;

        // Build where clause
        const conditions = [];
        const values = [user.id];
        let paramIndex = 2;

        // Base condition: settlements involving the user
        conditions.push(`(s.payer_id = $1 OR s.recipient_id = $1)`);

        // Filter by group
        if (groupId) {
            conditions.push(`s.group_id = $${paramIndex}`);
            values.push(groupId);
            paramIndex++;
        }

        // Filter by other user
        if (userId) {
            conditions.push(`(s.payer_id = $${paramIndex} OR s.recipient_id = $${paramIndex})`);
            values.push(userId);
            paramIndex++;
        }

        // Filter by status
        if (status) {
            conditions.push(`s.status = $${paramIndex}`);
            values.push(status);
            paramIndex++;
        }

        // Construct where clause
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Query for settlements
        const query = `
            SELECT 
                s.id, s.group_id, s.payer_id, s.recipient_id, 
                s.amount, s.currency, s.status, s.payment_method,
                s.payment_reference, s.settled_at, s.notes,
                s.created_at, s.updated_at,
                g.name as group_name,
                p.full_name as payer_name, p.display_name as payer_display_name, p.avatar_url as payer_avatar,
                r.full_name as recipient_name, r.display_name as recipient_display_name, r.avatar_url as recipient_avatar
            FROM settlements s
            LEFT JOIN groups g ON s.group_id = g.id
            JOIN users p ON s.payer_id = p.id
            JOIN users r ON s.recipient_id = r.id
            ${whereClause}
            ORDER BY s.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        // Add limit and offset to values
        values.push(limit.toString(), offset.toString());

        // Count query for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM settlements s
            ${whereClause}
        `;

        // Execute both queries
        const [settlementResult, countResult] = await Promise.all([
            fluxPostgreSQL.query(query, values),
            fluxPostgreSQL.query(countQuery, values.slice(0, values.length - 2)) // Exclude limit and offset
        ]);

        const settlements = settlementResult.rows;
        const total = parseInt(countResult.rows[0].total);

        // Get settlement balances
        const balancesQuery = `
            WITH outgoing AS (
                -- Money the user owes to others
                SELECT 
                    s.recipient_id as user_id,
                    SUM(s.amount) as total_owed
                FROM settlements s
                WHERE s.payer_id = $1 AND s.status != 'cancelled'
                GROUP BY s.recipient_id
            ),
            incoming AS (
                -- Money others owe to the user
                SELECT 
                    s.payer_id as user_id,
                    SUM(s.amount) as total_due
                FROM settlements s
                WHERE s.recipient_id = $1 AND s.status != 'cancelled'
                GROUP BY s.payer_id
            ),
            all_users AS (
                -- All users with whom the user has settlements
                SELECT DISTINCT 
                    CASE 
                        WHEN s.payer_id = $1 THEN s.recipient_id
                        ELSE s.payer_id
                    END as user_id
                FROM settlements s
                WHERE s.payer_id = $1 OR s.recipient_id = $1
            )
            SELECT 
                au.user_id,
                u.full_name,
                u.display_name,
                u.avatar_url,
                COALESCE(o.total_owed, 0) as total_owed,
                COALESCE(i.total_due, 0) as total_due,
                COALESCE(i.total_due, 0) - COALESCE(o.total_owed, 0) as net_balance
            FROM all_users au
            JOIN users u ON au.user_id = u.id
            LEFT JOIN outgoing o ON au.user_id = o.user_id
            LEFT JOIN incoming i ON au.user_id = i.user_id
            ORDER BY net_balance DESC
        `;

        const balancesResult = await fluxPostgreSQL.query(balancesQuery, [user.id]);

        return json({
            success: true,
            data: {
                settlements,
                total,
                pagination: {
                    limit,
                    offset,
                    has_more: total > (offset + limit)
                },
                balances: balancesResult.rows
            }
        });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to get settlements:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get settlements'
        }, { status: 500 });
    }
};

/**
 * POST /api/v1/settlements
 * Create a new settlement
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
        if (!body.payer_id || !body.recipient_id || !body.amount) {
            return json({
                success: false,
                error: 'Payer ID, recipient ID, and amount are required'
            }, { status: 400 });
        }

        // User must be either the payer or recipient
        if (body.payer_id !== user.id && body.recipient_id !== user.id) {
            return json({
                success: false,
                error: 'You must be either the payer or recipient of the settlement'
            }, { status: 403 });
        }

        // Begin transaction
        const client = await fluxPostgreSQL.getClient();

        try {
            await client.query('BEGIN');

            // If group_id is provided, check if both users are members of the group
            if (body.group_id) {
                const groupMemberQuery = `
                    SELECT user_id FROM group_members
                    WHERE group_id = $1 AND user_id IN ($2, $3) AND is_active = true
                `;
                
                const groupMemberResult = await client.query(groupMemberQuery, [
                    body.group_id, body.payer_id, body.recipient_id
                ]);
                
                if (groupMemberResult.rows.length !== 2) {
                    throw new Error('Both users must be members of the group');
                }
            }

            // Create settlement
            const settlementQuery = `
                INSERT INTO settlements (
                    group_id, payer_id, recipient_id, amount, currency,
                    status, payment_method, payment_reference, settled_at, notes
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
                ) RETURNING *
            `;

            const settlementValues = [
                body.group_id || null,
                body.payer_id,
                body.recipient_id,
                parseFloat(body.amount.toString()),
                body.currency || 'INR',
                body.status || 'pending',
                body.payment_method || null,
                body.payment_reference || null,
                body.status === 'completed' ? new Date() : null,
                body.notes || null
            ];

            const settlementResult = await client.query(settlementQuery, settlementValues);
            const settlement = settlementResult.rows[0];

            // If expense splits are provided, mark them as settled
            if (body.expense_splits && Array.isArray(body.expense_splits) && body.expense_splits.length > 0) {
                const splitIds = body.expense_splits.map((split: ExpenseSplit) => split.id);
                
                // Update expense splits
                const updateSplitsQuery = `
                    UPDATE expense_splits
                    SET status = 'settled', settlement_id = $1, settled_at = NOW()
                    WHERE id = ANY($2::uuid[])
                    RETURNING *
                `;
                
                await client.query(updateSplitsQuery, [settlement.id, splitIds]);
                
                // Check if all splits for each expense are settled, and if so, mark the expense as settled
                const checkExpensesQuery = `
                    WITH split_expenses AS (
                        SELECT DISTINCT expense_id
                        FROM expense_splits
                        WHERE id = ANY($1::uuid[])
                    ),
                    expense_split_status AS (
                        SELECT 
                            se.expense_id,
                            BOOL_AND(es.status = 'settled') as all_settled
                        FROM split_expenses se
                        JOIN expense_splits es ON se.expense_id = es.expense_id
                        GROUP BY se.expense_id
                    )
                    SELECT expense_id, all_settled
                    FROM expense_split_status
                    WHERE all_settled = true
                `;
                
                const checkExpensesResult = await client.query(checkExpensesQuery, [splitIds]);
                
                // Update expenses that have all splits settled
                if (checkExpensesResult.rows.length > 0) {
                    const expenseIds = checkExpensesResult.rows.map(row => row.expense_id);
                    
                    const updateExpensesQuery = `
                        UPDATE expenses
                        SET is_settled = true, status = 'settled', updated_at = NOW()
                        WHERE id = ANY($1::uuid[])
                    `;
                    
                    await client.query(updateExpensesQuery, [expenseIds]);
                }
            }

            // Get the complete settlement with user details
            const completeSettlementQuery = `
                SELECT 
                    s.id, s.group_id, s.payer_id, s.recipient_id, 
                    s.amount, s.currency, s.status, s.payment_method,
                    s.payment_reference, s.settled_at, s.notes,
                    s.created_at, s.updated_at,
                    g.name as group_name,
                    p.full_name as payer_name, p.display_name as payer_display_name, p.avatar_url as payer_avatar,
                    r.full_name as recipient_name, r.display_name as recipient_display_name, r.avatar_url as recipient_avatar
                FROM settlements s
                LEFT JOIN groups g ON s.group_id = g.id
                JOIN users p ON s.payer_id = p.id
                JOIN users r ON s.recipient_id = r.id
                WHERE s.id = $1
            `;

            const completeSettlementResult = await client.query(completeSettlementQuery, [settlement.id]);
            const completeSettlement = completeSettlementResult.rows[0];

            // Commit transaction
            await client.query('COMMIT');

            return json({
                success: true,
                data: completeSettlement
            }, { status: 201 });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[Flux API] ❌ Failed to create settlement:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create settlement'
        }, { status: 500 });
    }
}; 