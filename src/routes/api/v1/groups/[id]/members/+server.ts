/**
 * Flux Group Members API
 * GET: List all members in a group
 * POST: Add a new member to the group
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
 * GET /api/v1/groups/[id]/members
 * Get all members in a group
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

        // Check group membership
        const hasAccess = await verifyGroupAccess(groupId, user.id);
        if (!hasAccess) {
            return json({
                success: false,
                error: 'You do not have access to this group'
            }, { status: 403 });
        }

        // Get query parameters
        const includeInactive = url.searchParams.get('include_inactive') === 'true';

        // Get members
        const members = await groupService.getGroupMembers(groupId, includeInactive);

        return json({
            success: true,
            data: {
                members
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
 * POST /api/v1/groups/[id]/members
 * Add a new member to the group
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

        // Check admin permission (only admins can add members directly)
        const isAdmin = await verifyGroupAccess(groupId, user.id, true);
        
        // Parse request body
        const body = await request.json();
        
        // Check required fields
        if (!body.user_id) {
            return json({
                success: false,
                error: 'User ID is required'
            }, { status: 400 });
        }
        
        // Verify the role - only admins can add other admins
        if (body.role === 'admin' && !isAdmin) {
            return json({
                success: false,
                error: 'Only group admins can add admin members'
            }, { status: 403 });
        }
        
        // Check if member already exists
        const isMember = await groupService.isGroupMember(groupId, body.user_id);
        if (isMember) {
            return json({
                success: false,
                error: 'User is already a member of this group'
            }, { status: 400 });
        }

        // Add member
        const member = await groupService.addMember(groupId, {
            user_id: body.user_id,
            role: isAdmin ? body.role || 'member' : 'member',
            nickname: body.nickname,
            notification_preferences: body.notification_preferences
        });

        return json({
            success: true,
            data: {
                member
            }
        }, { status: 201 });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to add group member:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add group member'
        }, { status: 500 });
    }
}; 