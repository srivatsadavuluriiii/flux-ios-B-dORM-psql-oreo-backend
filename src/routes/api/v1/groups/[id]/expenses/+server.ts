/**
 * Flux Group Expenses API
 * GET: Get all expenses for a group
 * POST: Create a new group expense
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
 * GET /api/v1/groups/[id]/expenses
 * Get all expenses for a group
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

        // Get expenses
        const expenses = await groupService.getGroupExpenses(groupId);

        return json({
            success: true,
            data: {
                expenses
            }
        });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to get group expenses:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get group expenses'
        }, { status: 500 });
    }
};

/**
 * POST /api/v1/groups/[id]/expenses
 * Create a new group expense and split it among members
 * 
 * This is a simplified implementation. For a complete implementation, 
 * you'd likely use your existing expense creation endpoint with group_id set.
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

        // Check group membership
        const hasAccess = await verifyGroupAccess(groupId, user.id);
        if (!hasAccess) {
            return json({
                success: false,
                error: 'You do not have access to this group'
            }, { status: 403 });
        }

        // Group exists and user is a member
        // Now redirect to the main expense creation endpoint

        return json({
            success: false,
            error: 'Please use the main expense creation endpoint with group_id set to create group expenses',
            data: {
                redirect: '/api/v1/expenses'
            }
        }, { status: 307 });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to handle group expense creation:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to handle group expense creation'
        }, { status: 500 });
    }
}; 