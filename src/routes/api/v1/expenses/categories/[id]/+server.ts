/**
 * Flux Individual Expense Category API
 * GET: Get expense category by ID
 * PUT: Update expense category
 * DELETE: Delete expense category
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '../../../../../../lib/middleware/auth-middleware.js';
import { fluxPostgreSQL } from '../../../../../../lib/database/postgres.js';

/**
 * GET /api/v1/expenses/categories/[id]
 * Get expense category by ID
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

        const categoryId = params.id;
        if (!categoryId) {
            return json({
                success: false,
                error: 'Category ID is required'
            }, { status: 400 });
        }

        // Query to get category by ID (only if owned by user or is public/system)
        const query = `
            SELECT * FROM expense_categories
            WHERE id = $1 
            AND (created_by_user_id = $2 OR is_public = true OR is_system_category = true)
        `;

        const result = await fluxPostgreSQL.query(query, [categoryId, user.id]);
        
        if (result.rows.length === 0) {
            return json({
                success: false,
                error: 'Category not found or you do not have permission to view it'
            }, { status: 404 });
        }

        return json({
            success: true,
            data: {
                category: result.rows[0]
            }
        });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to get expense category:', error);
        return json({
            success: false,
            error: 'Failed to get expense category'
        }, { status: 500 });
    }
};

/**
 * PUT /api/v1/expenses/categories/[id]
 * Update expense category
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

        const categoryId = params.id;
        if (!categoryId) {
            return json({
                success: false,
                error: 'Category ID is required'
            }, { status: 400 });
        }

        // Parse request body
        const body = await request.json();

        // Check if category exists and belongs to user
        const checkQuery = `
            SELECT * FROM expense_categories
            WHERE id = $1
        `;

        const checkResult = await fluxPostgreSQL.query(checkQuery, [categoryId]);
        
        if (checkResult.rows.length === 0) {
            return json({
                success: false,
                error: 'Category not found'
            }, { status: 404 });
        }

        const category = checkResult.rows[0];
        
        // Check if user is authorized to update (only user's own categories, not system ones)
        if (category.is_system_category) {
            return json({
                success: false,
                error: 'Cannot modify system categories'
            }, { status: 403 });
        }

        if (category.created_by_user_id !== user.id) {
            return json({
                success: false,
                error: 'You do not have permission to update this category'
            }, { status: 403 });
        }

        // Check for duplicate name
        if (body.name && body.name !== category.name) {
            const nameCheckQuery = `
                SELECT id FROM expense_categories
                WHERE name = $1 AND created_by_user_id = $2 AND id != $3
            `;
            
            const nameCheckResult = await fluxPostgreSQL.query(nameCheckQuery, [body.name, user.id, categoryId]);
            
            if ((nameCheckResult.rowCount || 0) > 0) {
                return json({
                    success: false,
                    error: 'A category with this name already exists'
                }, { status: 400 });
            }
        }

        // Build update query
        const updates = [];
        const values = [categoryId]; // Start with category ID
        let paramIndex = 2;

        if (body.name !== undefined) {
            updates.push(`name = $${paramIndex}`);
            values.push(body.name);
            paramIndex++;
        }

        if (body.description !== undefined) {
            updates.push(`description = $${paramIndex}`);
            values.push(body.description);
            paramIndex++;
        }

        if (body.icon_name !== undefined) {
            updates.push(`icon_name = $${paramIndex}`);
            values.push(body.icon_name);
            paramIndex++;
        }

        if (body.color_hex !== undefined) {
            updates.push(`color_hex = $${paramIndex}`);
            values.push(body.color_hex);
            paramIndex++;
        }

        if (body.parent_category_id !== undefined) {
            updates.push(`parent_category_id = $${paramIndex}`);
            values.push(body.parent_category_id);
            paramIndex++;
        }

        if (body.is_public !== undefined) {
            updates.push(`is_public = $${paramIndex}`);
            values.push(body.is_public);
            paramIndex++;
        }

        // If no fields to update
        if (updates.length === 0) {
            return json({
                success: false,
                error: 'No valid fields to update'
            }, { status: 400 });
        }

        updates.push(`updated_at = NOW()`);

        // Execute update query
        const updateQuery = `
            UPDATE expense_categories
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await fluxPostgreSQL.query(updateQuery, values);
        const updatedCategory = result.rows[0];

        return json({
            success: true,
            data: {
                category: updatedCategory,
                message: 'Category updated successfully'
            }
        });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to update expense category:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update category'
        }, { status: 500 });
    }
};

/**
 * DELETE /api/v1/expenses/categories/[id]
 * Delete expense category
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

        const categoryId = params.id;
        if (!categoryId) {
            return json({
                success: false,
                error: 'Category ID is required'
            }, { status: 400 });
        }

        // Check if category exists and belongs to user
        const checkQuery = `
            SELECT * FROM expense_categories
            WHERE id = $1
        `;

        const checkResult = await fluxPostgreSQL.query(checkQuery, [categoryId]);
        
        if (checkResult.rows.length === 0) {
            return json({
                success: false,
                error: 'Category not found'
            }, { status: 404 });
        }

        const category = checkResult.rows[0];
        
        // Check if user is authorized to delete (only user's own categories, not system ones)
        if (category.is_system_category) {
            return json({
                success: false,
                error: 'Cannot delete system categories'
            }, { status: 403 });
        }

        if (category.created_by_user_id !== user.id) {
            return json({
                success: false,
                error: 'You do not have permission to delete this category'
            }, { status: 403 });
        }

        // Check if category is in use by any expenses
        const expenseCheckQuery = `
            SELECT COUNT(*) as count FROM expenses
            WHERE category_id = $1 AND paid_by_user_id = $2
        `;

        const expenseCheckResult = await fluxPostgreSQL.query(expenseCheckQuery, [categoryId, user.id]);
        const expenseCount = parseInt(expenseCheckResult.rows[0].count);
        
        if (expenseCount > 0) {
            // Option 1: Prevent deletion if category is in use
            return json({
                success: false,
                error: `Cannot delete category that is used by ${expenseCount} expenses`,
                data: {
                    expense_count: expenseCount
                }
            }, { status: 400 });
            
            // Option 2: You could implement a cascade delete or category reassignment
            // by uncommenting and modifying the code below
            /*
            // Reassign expenses to uncategorized/default category
            const defaultCategoryQuery = `
                SELECT id FROM expense_categories
                WHERE is_system_category = true AND name = 'Uncategorized'
                LIMIT 1
            `;
            
            const defaultCategoryResult = await fluxPostgreSQL.query(defaultCategoryQuery);
            
            if (defaultCategoryResult.rows.length === 0) {
                return json({
                    success: false,
                    error: 'Default category not found for reassignment'
                }, { status: 500 });
            }
            
            const defaultCategoryId = defaultCategoryResult.rows[0].id;
            
            // Reassign expenses
            const reassignQuery = `
                UPDATE expenses
                SET category_id = $1
                WHERE category_id = $2 AND paid_by_user_id = $3
            `;
            
            await fluxPostgreSQL.query(reassignQuery, [defaultCategoryId, categoryId, user.id]);
            */
        }

        // Delete the category
        const deleteQuery = `
            DELETE FROM expense_categories
            WHERE id = $1
            RETURNING id
        `;

        const deleteResult = await fluxPostgreSQL.query(deleteQuery, [categoryId]);
        
        if ((deleteResult.rowCount || 0) === 0) {
            return json({
                success: false,
                error: 'Failed to delete category'
            }, { status: 500 });
        }

        return json({
            success: true,
            data: {
                message: 'Category deleted successfully'
            }
        });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to delete expense category:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete category'
        }, { status: 500 });
    }
}; 