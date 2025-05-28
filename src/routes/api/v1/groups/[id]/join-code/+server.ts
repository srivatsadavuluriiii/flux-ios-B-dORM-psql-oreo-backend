/**
 * Flux Group Join Code API
 * GET: Get the current join code for a group
 * POST: Generate a new join code for a group
 */

import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '../../../../../../lib/middleware/auth-middleware.js';
import groupService from '../../../../../../lib/services/groups/group-service.js';

/**
 * Verify user has permission to manage the group
 */
async function verifyGroupAccess(groupId: string, userId: string, requireAdmin: boolean = false): Promise<boolean> {
    // Check if user is a member
    const userRole = await groupService.getUserRole(groupId, userId);
    
    if (!userRole) {
        return false;
    }
    
    // If admin required, check role
    if (requireAdmin && userRole !== 'admin') {
        return false;
    }
    
    return true;
}

/**
 * GET /api/v1/groups/[id]/join-code
 * Get the current join code for a group
 */
export const GET = async ({ params, request, url, locals }: RequestEvent) => {
    try {
        // Authenticate user
        const user = requireAuth({ request, url, locals } as any);
        if (!user) {
            return json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        const groupId = params.id;
        if (!groupId) {
            return json({
                success: false,
                error: 'Group ID is required'
            }, { status: 400 });
        }

        // Only admins can view join codes
        const hasAccess = await verifyGroupAccess(groupId, user.id, true);
        if (!hasAccess) {
            return json({
                success: false,
                error: 'You must be a group admin to view the join code'
            }, { status: 403 });
        }

        // Get group data
        const group = await groupService.getGroupById(groupId);
        if (!group) {
            return json({
                success: false,
                error: 'Group not found'
            }, { status: 404 });
        }

        return json({
            success: true,
            data: {
                join_code: group.join_code
            }
        });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to get group join code:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get group join code'
        }, { status: 500 });
    }
};

/**
 * POST /api/v1/groups/[id]/join-code
 * Generate a new join code for a group
 */
export const POST = async ({ params, request, url, locals }: RequestEvent) => {
    try {
        // Authenticate user
        const user = requireAuth({ request, url, locals } as any);
        if (!user) {
            return json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        const groupId = params.id;
        if (!groupId) {
            return json({
                success: false,
                error: 'Group ID is required'
            }, { status: 400 });
        }

        // Only admins can regenerate join codes
        const hasAccess = await verifyGroupAccess(groupId, user.id, true);
        if (!hasAccess) {
            return json({
                success: false,
                error: 'You must be a group admin to regenerate the join code'
            }, { status: 403 });
        }

        // Regenerate join code
        const newJoinCode = await groupService.regenerateJoinCode(groupId);

        return json({
            success: true,
            data: {
                join_code: newJoinCode,
                message: 'Join code regenerated successfully'
            }
        });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to regenerate group join code:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to regenerate group join code'
        }, { status: 500 });
    }
}; 