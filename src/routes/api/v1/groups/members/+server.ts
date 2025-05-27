/**
 * Flux Group Members API
 * GET: Get members for a specific group
 * POST: Add members to a group
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '../../../../../lib/middleware/auth-middleware.js';
import { fluxPostgreSQL } from '../../../../../lib/database/postgres.js';

/**
 * GET /api/v1/groups/members
 * Get members for a specific group
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

        // Get group members
        const query = `
            SELECT 
                gm.id as member_id,
                gm.user_id,
                gm.group_id,
                gm.role,
                gm.joined_at,
                gm.is_active,
                gm.is_admin,
                u.display_name,
                u.full_name,
                u.email,
                u.phone,
                u.avatar_url,
                u.preferences
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = $1 AND gm.is_active = true
            ORDER BY gm.is_admin DESC, u.display_name ASC
        `;

        const result = await fluxPostgreSQL.query(query, [groupId]);
        
        return json({
            success: true,
            data: {
                members: result.rows,
                count: result.rows.length
            }
        });

    } catch (error) {
        console.error('[Flux API] ❌ Failed to get group members:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get group members'
        }, { status: 500 });
    }
};

/**
 * POST /api/v1/groups/members
 * Add members to a group
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
        
        if (!body.group_id) {
            return json({
                success: false,
                error: 'Group ID is required'
            }, { status: 400 });
        }

        if (!body.members || !Array.isArray(body.members) || body.members.length === 0) {
            return json({
                success: false,
                error: 'At least one member is required'
            }, { status: 400 });
        }

        // Check if user is admin of the group
        const adminCheckQuery = `
            SELECT id FROM group_members 
            WHERE group_id = $1 AND user_id = $2 AND is_admin = true AND is_active = true
        `;
        const adminCheckResult = await fluxPostgreSQL.query(adminCheckQuery, [body.group_id, user.id]);
        
        if (adminCheckResult.rows.length === 0) {
            return json({
                success: false,
                error: 'You must be an admin to add members to this group'
            }, { status: 403 });
        }

        // Begin transaction
        const client = await fluxPostgreSQL.getClient();
        
        try {
            await client.query('BEGIN');
            
            const addedMembers = [];
            const failedAdditions = [];
            
            // Process each member
            for (const member of body.members) {
                let userId = member.user_id;
                
                // If email is provided but not user_id, try to find user by email
                if (!userId && member.email) {
                    const userQuery = `SELECT id FROM users WHERE email = $1`;
                    const userResult = await client.query(userQuery, [member.email]);
                    
                    if (userResult.rows.length > 0) {
                        userId = userResult.rows[0].id;
                    } else {
                        failedAdditions.push({
                            email: member.email,
                            error: 'User not found'
                        });
                        continue;
                    }
                }
                
                if (!userId) {
                    failedAdditions.push({
                        member,
                        error: 'User ID or email is required'
                    });
                    continue;
                }
                
                // Check if user is already a member
                const checkQuery = `
                    SELECT id, is_active FROM group_members 
                    WHERE group_id = $1 AND user_id = $2
                `;
                const checkResult = await client.query(checkQuery, [body.group_id, userId]);
                
                if (checkResult.rows.length > 0) {
                    // If member exists but is inactive, reactivate
                    if (!checkResult.rows[0].is_active) {
                        const updateQuery = `
                            UPDATE group_members
                            SET is_active = true, updated_at = NOW()
                            WHERE id = $1
                            RETURNING *
                        `;
                        const updateResult = await client.query(updateQuery, [checkResult.rows[0].id]);
                        addedMembers.push(updateResult.rows[0]);
                    } else {
                        failedAdditions.push({
                            user_id: userId,
                            error: 'User is already a member of this group'
                        });
                    }
                    continue;
                }
                
                // Add new member
                const insertQuery = `
                    INSERT INTO group_members (
                        group_id, user_id, role, is_admin
                    ) VALUES ($1, $2, $3, $4)
                    RETURNING *
                `;
                
                const values = [
                    body.group_id,
                    userId,
                    member.role || 'member',
                    member.is_admin === true
                ];
                
                const result = await client.query(insertQuery, values);
                addedMembers.push(result.rows[0]);
            }
            
            // Commit transaction
            await client.query('COMMIT');
            
            return json({
                success: true,
                data: {
                    added_members: addedMembers,
                    failed_additions: failedAdditions,
                    success_count: addedMembers.length,
                    failure_count: failedAdditions.length
                }
            }, { status: 201 });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('[Flux API] ❌ Failed to add group members:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add group members'
        }, { status: 500 });
    }
}; 