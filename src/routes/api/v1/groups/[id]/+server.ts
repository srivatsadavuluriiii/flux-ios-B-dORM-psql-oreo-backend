/**
 * Flux Individual Group API
 * GET: Get group details
 * PUT: Update group details
 * DELETE: Delete a group
 */

import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '../../../../../lib/middleware/auth-middleware.js';
import groupService from '../../../../../lib/services/groups/group-service.js';

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
 * GET /api/v1/groups/[id]
 * Get a group by ID
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

        // Get group data
        const group = await groupService.getGroupById(groupId);
        if (!group) {
            return json({
                success: false,
                error: 'Group not found'
            }, { status: 404 });
        }

        // Get members
        const members = await groupService.getGroupMembers(groupId);
        
        // Get group balances
        const balances = await groupService.calculateGroupBalances(groupId);

        return json({
            success: true,
            data: {
                group,
                members,
                balances
            }
        });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to get group details:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get group details'
        }, { status: 500 });
    }
};

/**
 * PUT /api/v1/groups/[id]
 * Update a group
 */
export const PUT = async ({ params, request, url, locals }: RequestEvent) => {
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

        // Check admin permission
        const hasAccess = await verifyGroupAccess(groupId, user.id, true);
        if (!hasAccess) {
            return json({
                success: false,
                error: 'You must be a group admin to update the group'
            }, { status: 403 });
        }

        // Parse request body
        const body = await request.json();

        // Update group
        const updatedGroup = await groupService.updateGroup(groupId, {
            name: body.name,
            description: body.description,
            currency: body.currency,
            default_split_method: body.default_split_method,
            is_public: body.is_public,
            is_active: body.is_active
        });

        if (!updatedGroup) {
            return json({
                success: false,
                error: 'Failed to update group'
            }, { status: 500 });
        }

        return json({
            success: true,
            data: {
                group: updatedGroup
            }
        });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to update group:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update group'
        }, { status: 500 });
    }
};

/**
 * DELETE /api/v1/groups/[id]
 * Delete a group (soft delete)
 */
export const DELETE = async ({ params, request, url, locals }: RequestEvent) => {
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

        // Check admin permission
        const hasAccess = await verifyGroupAccess(groupId, user.id, true);
        if (!hasAccess) {
            return json({
                success: false,
                error: 'You must be a group admin to delete the group'
            }, { status: 403 });
        }

        // Delete group (soft delete)
        const deleted = await groupService.deleteGroup(groupId);
        if (!deleted) {
            return json({
                success: false,
                error: 'Failed to delete group'
            }, { status: 500 });
        }

        return json({
            success: true,
            data: {
                message: 'Group deleted successfully'
            }
        });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to delete group:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete group'
        }, { status: 500 });
    }
}; 