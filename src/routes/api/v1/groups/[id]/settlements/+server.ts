/**
 * Flux Group Settlements API
 * GET: Get settlement history for a group
 * POST: Create a new settlement between group members
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
 * GET /api/v1/groups/[id]/settlements
 * Get settlement history for a group
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

        // Get settlements
        const settlements = await groupService.getGroupSettlements(groupId);

        return json({
            success: true,
            data: {
                settlements
            }
        });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to get group settlements:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get group settlements'
        }, { status: 500 });
    }
};

/**
 * POST /api/v1/groups/[id]/settlements
 * Create a new settlement between group members
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

        // Parse request body
        const body = await request.json();
        
        // Validate required fields
        if (!body.payer_user_id || !body.payee_user_id || !body.amount) {
            return json({
                success: false,
                error: 'Payer ID, payee ID, and amount are required'
            }, { status: 400 });
        }
        
        // Validate amount
        if (typeof body.amount !== 'number' || body.amount <= 0) {
            return json({
                success: false,
                error: 'Amount must be a positive number'
            }, { status: 400 });
        }
        
        // Validate that payer and payee are different users
        if (body.payer_user_id === body.payee_user_id) {
            return json({
                success: false,
                error: 'Payer and payee must be different users'
            }, { status: 400 });
        }
        
        // Validate that both users are group members
        const isPayerMember = await groupService.isGroupMember(groupId, body.payer_user_id);
        const isPayeeMember = await groupService.isGroupMember(groupId, body.payee_user_id);
        
        if (!isPayerMember || !isPayeeMember) {
            return json({
                success: false,
                error: 'Both payer and payee must be active members of the group'
            }, { status: 400 });
        }

        // Create settlement
        const settlement = await groupService.createSettlement(
            body.payer_user_id,
            body.payee_user_id,
            groupId,
            body.amount,
            body.description || 'Group expense settlement',
            body.payment_method || 'manual'
        );

        // Recalculate balances after settlement
        const updatedBalances = await groupService.calculateGroupBalances(groupId);

        return json({
            success: true,
            data: {
                settlement,
                balances: updatedBalances,
                message: 'Settlement recorded successfully'
            }
        }, { status: 201 });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to create settlement:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create settlement'
        }, { status: 500 });
    }
}; 