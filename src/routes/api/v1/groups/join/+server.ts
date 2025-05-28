/**
 * Flux Group Join API
 * POST: Join a group using a join code
 */

import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '../../../../../lib/middleware/auth-middleware.js';
import groupService from '../../../../../lib/services/groups/group-service.js';

/**
 * POST /api/v1/groups/join
 * Join a group using a join code
 */
export const POST = async ({ request, url, locals }: RequestEvent) => {
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
        if (!body.join_code) {
            return json({
                success: false,
                error: 'Join code is required'
            }, { status: 400 });
        }

        // Join group
        const group = await groupService.joinGroupByCode(user.id, body.join_code);
        
        if (!group) {
            return json({
                success: false,
                error: 'Invalid join code or group not found'
            }, { status: 404 });
        }

        // Get group details
        const members = await groupService.getGroupMembers(group.id);
        const balances = await groupService.calculateGroupBalances(group.id);

        return json({
            success: true,
            data: {
                group,
                members,
                balances,
                message: 'Successfully joined group'
            }
        });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to join group:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to join group'
        }, { status: 500 });
    }
}; 