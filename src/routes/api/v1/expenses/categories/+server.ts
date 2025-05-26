/**
 * Flux Expense Categories API
 * GET: List expense categories (system + user custom)
 * POST: Create custom expense category
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fluxPostgreSQL } from '../../../../../lib/database/postgres.js';
import { requireAuth, optionalAuth } from '../../../../../lib/middleware/auth-middleware.js';
import type { QueryConfig } from 'pg';

/**
 * GET /api/v1/expenses/categories
 * List expense categories
 */
export const GET: RequestHandler = async ({ request, url, locals }) => {
    try {
        // Optional authentication - show system categories + user's custom categories if authenticated
        const user = optionalAuth({ request, url, locals } as any);

        const query: QueryConfig = {
            text: `
                SELECT 
                    id, name, description, icon_name, color_hex, 
                    parent_category_id, is_system_category, is_public,
                    created_at
                FROM expense_categories 
                WHERE is_system_category = true 
                   OR (created_by_user_id = $1)
                   OR (is_public = true)
                ORDER BY 
                    is_system_category DESC,
                    name ASC
            `,
            values: [user?.id || null]
        };

        const result = await fluxPostgreSQL.query(query.text, query.values);

        return json({
            success: true,
            data: {
                categories: result.rows,
                total: result.rows.length
            }
        });

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
 * Create custom expense category
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

        // Check if category name already exists for this user
        const existingQuery: QueryConfig = {
            text: `
                SELECT id FROM expense_categories 
                WHERE name = $1 AND (created_by_user_id = $2 OR is_system_category = true)
            `,
            values: [body.name, user.id]
        };

        const existingResult = await fluxPostgreSQL.query(existingQuery.text, existingQuery.values);
        
        if (existingResult.rows.length > 0) {
            return json({
                success: false,
                error: 'Category with this name already exists'
            }, { status: 409 });
        }

        // Create category
        const insertQuery: QueryConfig = {
            text: `
                INSERT INTO expense_categories (
                    name, description, icon_name, color_hex, 
                    parent_category_id, created_by_user_id, is_public
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7
                ) RETURNING *
            `,
            values: [
                body.name,
                body.description || null,
                body.icon_name || 'tag',
                body.color_hex || '#6B7280',
                body.parent_category_id || null,
                user.id,
                body.is_public || false
            ]
        };

        const result = await fluxPostgreSQL.query(insertQuery.text, insertQuery.values);
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