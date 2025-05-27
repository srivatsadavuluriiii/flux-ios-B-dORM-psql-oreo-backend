/**
 * Flux Expense Categories API
 * GET: List expense categories
 * POST: Create new expense category
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '../../../../../lib/middleware/auth-middleware.js';
import { requireTestAuth } from '../../../../../lib/middleware/test-auth-middleware.js';
import { fluxPostgreSQL } from '../../../../../lib/database/postgres.js';

/**
 * GET /api/v1/expenses/categories
 * List expense categories
 */
export const GET: RequestHandler = async ({ request, url, locals }) => {
    try {
        console.log('[Flux Debug] Received request for expense categories');
        console.log('[Flux Debug] Authorization header:', request.headers.get('Authorization'));
        
        // Authenticate user - try test auth first, then regular auth
        let user;
        try {
            console.log('[Flux Debug] Attempting test auth...');
            user = requireTestAuth({ request, url, locals } as any);
            console.log('[Flux Debug] Test auth successful:', user.id);
        } catch (e) {
            console.log('[Flux Debug] Test auth failed, trying regular auth');
            // Fall back to regular auth
            try {
                user = requireAuth({ request, url, locals } as any);
                console.log('[Flux Debug] Regular auth successful:', user.id);
            } catch (e2) {
                console.error('[Flux Debug] All auth methods failed:', e2);
                throw e2;
            }
        }
        
        if (!user) {
            console.log('[Flux Debug] No user returned from auth');
            return json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        console.log('[Flux Debug] User authenticated, proceeding with query. User ID:', user.id);

        // Parse query parameters
        const searchParams = url.searchParams;
        const includeSystem = searchParams.get('include_system') === 'true';
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

        // Build query
        let whereClause = `WHERE (created_by_user_id = $1 OR is_public = true)`;
        const values = [user.id];

        if (!includeSystem) {
            whereClause += ` AND is_system_category = false`;
        }

        const query = `
            SELECT 
                id, name, description, icon_name, color_hex, 
                parent_category_id, is_system_category, is_public,
                created_at, updated_at
            FROM expense_categories
            ${whereClause}
            ORDER BY is_system_category DESC, name ASC
            LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `;

        console.log('[Flux Debug] Query:', query);
        console.log('[Flux Debug] Values:', values);

        // Convert numbers to strings for the query
        values.push(limit.toString(), offset.toString());

        // Count total
        const countQuery = `
            SELECT COUNT(*) as total
            FROM expense_categories
            ${whereClause}
        `;

        console.log('[Flux Debug] Count Query:', countQuery);

        // Execute queries
        try {
            console.log('[Flux Debug] Executing queries...');
            const [result, countResult] = await Promise.all([
                fluxPostgreSQL.query(query, values),
                fluxPostgreSQL.query(countQuery, [user.id])
            ]);

            console.log('[Flux Debug] Query results:', result.rowCount, 'rows');

            const categories = result.rows;
            const total = parseInt(countResult.rows[0].total);

            console.log('[Flux Debug] Query successful. Returning', categories.length, 'categories');

            return json({
                success: true,
                data: {
                    categories,
                    total,
                    limit,
                    offset,
                    has_more: total > (offset + limit)
                }
            });
        } catch (dbError) {
            console.error('[Flux Debug] Database error:', dbError);
            throw dbError;
        }

    } catch (error) {
        console.error('[Flux API] ❌ Failed to get expense categories:', error);
        return json({
            success: false,
            error: 'Failed to get expense categories'
        }, { status: 500 });
    }
};

/**
 * POST /api/v1/expenses/categories
 * Create new expense category
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
        if (!body.name) {
            return json({
                success: false,
                error: 'Category name is required'
            }, { status: 400 });
        }

        // Check for duplicate category name
        const checkQuery = `
            SELECT id FROM expense_categories
            WHERE name = $1 AND created_by_user_id = $2
        `;

        const checkResult = await fluxPostgreSQL.query(checkQuery, [body.name, user.id]);
        
        if (checkResult && checkResult.rowCount && checkResult.rowCount > 0) {
            return json({
                success: false,
                error: 'A category with this name already exists'
            }, { status: 400 });
        }

        // Create new category
        const query = `
            INSERT INTO expense_categories (
                name, description, icon_name, color_hex, 
                parent_category_id, is_public, created_by_user_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, description, icon_name, color_hex, 
                      parent_category_id, is_system_category, is_public,
                      created_at, updated_at
        `;

        const values = [
            body.name,
            body.description || null,
            body.icon_name || null,
            body.color_hex || null,
            body.parent_category_id || null,
            body.is_public || false,
            user.id
        ];

        const result = await fluxPostgreSQL.query(query, values);
        const category = result.rows[0];

        return json({
            success: true,
            data: {
                category,
                message: 'Category created successfully'
            }
        }, { status: 201 });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to create expense category:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create category'
        }, { status: 500 });
    }
}; 