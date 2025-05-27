/**
 * Flux Dashboard API
 * GET: Get user dashboard data including expenses, analytics, and balances
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '../../../../lib/middleware/auth-middleware.js';
import { fluxPostgreSQL } from '../../../../lib/database/postgres.js';

/**
 * GET /api/v1/dashboard
 * Get user dashboard data
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

        // Get time period filter from query params
        const searchParams = url.searchParams;
        const period = searchParams.get('period') || 'month'; // 'week', 'month', 'year', 'all'
        
        // Determine date range based on period
        let startDate = '';
        const now = new Date();
        
        switch (period) {
            case 'week':
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                startDate = weekAgo.toISOString().split('T')[0];
                break;
            case 'month':
                const monthAgo = new Date(now);
                monthAgo.setMonth(now.getMonth() - 1);
                startDate = monthAgo.toISOString().split('T')[0];
                break;
            case 'year':
                const yearAgo = new Date(now);
                yearAgo.setFullYear(now.getFullYear() - 1);
                startDate = yearAgo.toISOString().split('T')[0];
                break;
            case 'all':
            default:
                startDate = '1970-01-01'; // All time
        }
        
        const endDate = now.toISOString().split('T')[0];
        
        // Begin database queries
        const client = await fluxPostgreSQL.getClient();
        
        try {
            // 1. Recent expenses (last 5)
            const recentExpensesQuery = `
                SELECT 
                    e.id, e.description, e.amount, e.currency, e.expense_date,
                    e.category_id, e.receipt_url, e.status, e.is_settled,
                    e.group_id, e.paid_by_user_id, e.created_at,
                    ec.name as category_name, ec.icon_name as category_icon, ec.color_hex as category_color,
                    g.name as group_name,
                    u.full_name as paid_by_name, u.display_name as paid_by_display_name, u.avatar_url as paid_by_avatar
                FROM expenses e
                LEFT JOIN expense_categories ec ON e.category_id = ec.id
                LEFT JOIN groups g ON e.group_id = g.id
                LEFT JOIN users u ON e.paid_by_user_id = u.id
                WHERE 
                    (e.paid_by_user_id = $1 OR
                     e.id IN (
                        SELECT expense_id FROM expense_splits WHERE user_id = $1
                     ))
                    AND e.is_deleted = false
                ORDER BY e.created_at DESC
                LIMIT 5
            `;
            
            // 2. Expense summary by category
            const categorySummaryQuery = `
                SELECT 
                    ec.id, ec.name, ec.icon_name, ec.color_hex,
                    COUNT(e.id) as expense_count,
                    SUM(e.amount) as total_amount
                FROM expenses e
                JOIN expense_categories ec ON e.category_id = ec.id
                WHERE 
                    (e.paid_by_user_id = $1 OR
                     e.id IN (
                        SELECT expense_id FROM expense_splits WHERE user_id = $1
                     ))
                    AND e.is_deleted = false
                    AND e.expense_date BETWEEN $2 AND $3
                GROUP BY ec.id, ec.name, ec.icon_name, ec.color_hex
                ORDER BY total_amount DESC
                LIMIT 5
            `;
            
            // 3. Balance summary (who owes you, who you owe)
            const balanceSummaryQuery = `
                WITH my_expenses AS (
                    -- Expenses paid by user
                    SELECT 
                        e.id as expense_id,
                        es.user_id as user_id,
                        es.amount as amount,
                        true as paid_by_me,
                        es.is_settled
                    FROM expenses e
                    JOIN expense_splits es ON e.id = es.expense_id
                    WHERE 
                        e.paid_by_user_id = $1 AND
                        es.user_id != $1 AND
                        e.is_deleted = false AND
                        e.expense_date BETWEEN $2 AND $3
                ),
                other_expenses AS (
                    -- Expenses where user owes money
                    SELECT 
                        e.id as expense_id,
                        e.paid_by_user_id as user_id,
                        es.amount as amount,
                        false as paid_by_me,
                        es.is_settled
                    FROM expenses e
                    JOIN expense_splits es ON e.id = es.expense_id
                    WHERE 
                        es.user_id = $1 AND
                        e.paid_by_user_id != $1 AND
                        e.is_deleted = false AND
                        e.expense_date BETWEEN $2 AND $3
                ),
                all_balances AS (
                    SELECT * FROM my_expenses
                    UNION ALL
                    SELECT * FROM other_expenses
                ),
                user_balances AS (
                    SELECT
                        user_id,
                        SUM(CASE WHEN paid_by_me AND NOT is_settled THEN amount ELSE 0 END) as they_owe,
                        SUM(CASE WHEN NOT paid_by_me AND NOT is_settled THEN amount ELSE 0 END) as you_owe
                    FROM all_balances
                    GROUP BY user_id
                )
                SELECT
                    ub.user_id,
                    u.full_name,
                    u.display_name,
                    u.avatar_url,
                    ub.they_owe,
                    ub.you_owe,
                    (ub.they_owe - ub.you_owe) as net_balance
                FROM user_balances ub
                JOIN users u ON ub.user_id = u.id
                WHERE (ub.they_owe > 0 OR ub.you_owe > 0)
                ORDER BY ABS(ub.they_owe - ub.you_owe) DESC
                LIMIT 10
            `;
            
            // 4. Overall expense analytics
            const analyticsQuery = `
                SELECT
                    COUNT(e.id) as total_expenses,
                    SUM(e.amount) as total_amount,
                    AVG(e.amount) as average_amount,
                    (
                        SELECT COUNT(DISTINCT category_id)
                        FROM expenses
                        WHERE (paid_by_user_id = $1 OR
                               id IN (SELECT expense_id FROM expense_splits WHERE user_id = $1))
                          AND is_deleted = false
                          AND expense_date BETWEEN $2 AND $3
                    ) as categories_used,
                    (
                        SELECT COUNT(*)
                        FROM (
                            SELECT DISTINCT DATE_TRUNC('month', expense_date) as month
                            FROM expenses
                            WHERE (paid_by_user_id = $1 OR
                                   id IN (SELECT expense_id FROM expense_splits WHERE user_id = $1))
                              AND is_deleted = false
                              AND expense_date BETWEEN $2 AND $3
                        ) AS distinct_months
                    ) as active_months,
                    (
                        SELECT SUM(amount)
                        FROM expenses
                        WHERE paid_by_user_id = $1
                          AND is_deleted = false
                          AND expense_date BETWEEN $2 AND $3
                    ) as total_paid,
                    (
                        SELECT SUM(es.amount)
                        FROM expense_splits es
                        JOIN expenses e ON es.expense_id = e.id
                        WHERE es.user_id = $1
                          AND e.paid_by_user_id != $1
                          AND e.is_deleted = false
                          AND e.expense_date BETWEEN $2 AND $3
                    ) as total_owed
                FROM expenses e
                WHERE (e.paid_by_user_id = $1 OR
                       e.id IN (SELECT expense_id FROM expense_splits WHERE user_id = $1))
                  AND e.is_deleted = false
                  AND e.expense_date BETWEEN $2 AND $3
            `;
            
            // Execute all queries in parallel
            const [
                recentExpensesResult,
                categorySummaryResult,
                balanceSummaryResult,
                analyticsResult
            ] = await Promise.all([
                client.query(recentExpensesQuery, [user.id]),
                client.query(categorySummaryQuery, [user.id, startDate, endDate]),
                client.query(balanceSummaryQuery, [user.id, startDate, endDate]),
                client.query(analyticsQuery, [user.id, startDate, endDate])
            ]);
            
            // Process analytics data
            const analytics = analyticsResult.rows[0] || {};
            const netBalance = (parseFloat(analytics.total_paid || 0) - parseFloat(analytics.total_owed || 0));
            
            // Organize expense trend by month
            const expenseTrendQuery = `
                SELECT
                    DATE_TRUNC('month', e.expense_date) as month,
                    SUM(e.amount) as total_amount,
                    COUNT(e.id) as expense_count
                FROM expenses e
                WHERE (e.paid_by_user_id = $1 OR
                       e.id IN (SELECT expense_id FROM expense_splits WHERE user_id = $1))
                  AND e.is_deleted = false
                  AND e.expense_date BETWEEN $2 AND $3
                GROUP BY DATE_TRUNC('month', e.expense_date)
                ORDER BY month ASC
            `;
            
            const expenseTrendResult = await client.query(expenseTrendQuery, [user.id, startDate, endDate]);
            
            return json({
                success: true,
                data: {
                    period: {
                        name: period,
                        start_date: startDate,
                        end_date: endDate
                    },
                    recent_expenses: recentExpensesResult.rows,
                    category_summary: categorySummaryResult.rows,
                    balances: balanceSummaryResult.rows,
                    analytics: {
                        total_expenses: parseInt(analytics.total_expenses) || 0,
                        total_amount: parseFloat(analytics.total_amount) || 0,
                        average_amount: parseFloat(analytics.average_amount) || 0,
                        categories_used: parseInt(analytics.categories_used) || 0,
                        active_months: parseInt(analytics.active_months) || 0,
                        total_paid: parseFloat(analytics.total_paid) || 0,
                        total_owed: parseFloat(analytics.total_owed) || 0,
                        net_balance: netBalance,
                        you_are_owed: netBalance > 0 ? netBalance : 0,
                        you_owe: netBalance < 0 ? -netBalance : 0
                    },
                    expense_trend: expenseTrendResult.rows.map(row => ({
                        month: row.month,
                        total_amount: parseFloat(row.total_amount) || 0,
                        expense_count: parseInt(row.expense_count) || 0
                    }))
                }
            });
            
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('[Flux API] ❌ Failed to get dashboard data:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get dashboard data'
        }, { status: 500 });
    }
}; 