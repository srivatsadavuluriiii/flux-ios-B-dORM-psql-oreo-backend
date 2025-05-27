/**
 * Flux Expense Search API
 * GET: Search expenses with full-text search and advanced filtering
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '../../../../../lib/middleware/auth-middleware.js';
import { fluxPostgreSQL } from '../../../../../lib/database/postgres.js';

/**
 * GET /api/v1/expenses/search
 * Search expenses with full-text search and advanced filtering
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
        const query = searchParams.get('q') || '';
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
        
        // Additional filters
        const categoryId = searchParams.get('category_id');
        const groupId = searchParams.get('group_id');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const minAmount = searchParams.get('min_amount');
        const maxAmount = searchParams.get('max_amount');
        const currency = searchParams.get('currency');
        const status = searchParams.get('status');
        const isSettled = searchParams.get('is_settled');
        const sortBy = searchParams.get('sort_by') || 'created_at';
        const sortOrder = searchParams.get('sort_order')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Build where clause and parameters
        const conditions = [];
        const values = [user.id];
        let paramIndex = 2;

        // Base condition: user's expenses (paid by user or involved in splits)
        conditions.push(`(e.paid_by_user_id = $1 OR e.id IN (SELECT expense_id FROM expense_splits WHERE user_id = $1))`);
        conditions.push(`e.is_deleted = false`);

        // Search text (full-text search on description, notes, and location)
        if (query && query.trim() !== '') {
            conditions.push(`(
                e.description ILIKE $${paramIndex} OR 
                e.notes ILIKE $${paramIndex} OR 
                e.location ILIKE $${paramIndex} OR
                ec.name ILIKE $${paramIndex} OR
                g.name ILIKE $${paramIndex}
            )`);
            values.push(`%${query}%`);
            paramIndex++;
        }

        // Category filter
        if (categoryId) {
            conditions.push(`e.category_id = $${paramIndex}`);
            values.push(categoryId);
            paramIndex++;
        }

        // Group filter
        if (groupId) {
            conditions.push(`e.group_id = $${paramIndex}`);
            values.push(groupId);
            paramIndex++;
        }

        // Date range
        if (startDate) {
            conditions.push(`e.expense_date >= $${paramIndex}`);
            values.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            conditions.push(`e.expense_date <= $${paramIndex}`);
            values.push(endDate);
            paramIndex++;
        }

        // Amount range
        if (minAmount) {
            conditions.push(`e.amount >= $${paramIndex}`);
            values.push(minAmount.toString());
            paramIndex++;
        }

        if (maxAmount) {
            conditions.push(`e.amount <= $${paramIndex}`);
            values.push(maxAmount.toString());
            paramIndex++;
        }

        // Currency
        if (currency) {
            conditions.push(`e.currency = $${paramIndex}`);
            values.push(currency);
            paramIndex++;
        }

        // Status
        if (status) {
            conditions.push(`e.status = $${paramIndex}`);
            values.push(status);
            paramIndex++;
        }

        // Settlement status
        if (isSettled !== null && isSettled !== undefined) {
            const settledValue = isSettled === 'true';
            conditions.push(`e.is_settled = $${paramIndex}`);
            values.push(settledValue.toString());
            paramIndex++;
        }

        // Construct where clause
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Construct order by clause (validate sortBy to prevent SQL injection)
        const validSortFields = [
            'created_at', 'expense_date', 'amount', 'description', 'status', 'is_settled'
        ];
        const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        const orderClause = `ORDER BY e.${orderField} ${sortOrder}`;

        // Main search query
        const searchQuery = `
            SELECT 
                e.id, e.description, e.amount, e.currency, e.expense_date,
                e.category_id, e.receipt_url, e.status, e.is_settled,
                e.group_id, e.paid_by_user_id, e.created_at, e.notes, e.location,
                ec.name as category_name, ec.icon_name as category_icon, ec.color_hex as category_color,
                g.name as group_name,
                u.full_name as paid_by_name, u.display_name as paid_by_display_name, u.avatar_url as paid_by_avatar
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN groups g ON e.group_id = g.id
            LEFT JOIN users u ON e.paid_by_user_id = u.id
            ${whereClause}
            ${orderClause}
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        
        // Add limit and offset to values
        values.push(limit.toString(), offset.toString());

        // Count query for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN groups g ON e.group_id = g.id
            ${whereClause}
        `;

        // Execute both queries
        const [searchResult, countResult] = await Promise.all([
            fluxPostgreSQL.query(searchQuery, values),
            fluxPostgreSQL.query(countQuery, values.slice(0, values.length - 2)) // Exclude limit and offset
        ]);

        const expenses = searchResult.rows;
        const total = parseInt(countResult.rows[0].total);

        // Return search results
        return json({
            success: true,
            data: {
                expenses,
                total,
                query,
                filters: {
                    category_id: categoryId,
                    group_id: groupId,
                    start_date: startDate,
                    end_date: endDate,
                    min_amount: minAmount,
                    max_amount: maxAmount,
                    currency,
                    status,
                    is_settled: isSettled
                },
                pagination: {
                    limit,
                    offset,
                    has_more: total > (offset + limit)
                },
                sorting: {
                    sort_by: sortBy,
                    sort_order: sortOrder
                }
            }
        });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to search expenses:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to search expenses'
        }, { status: 500 });
    }
}; 