/**
 * Flux Group API
 * GET: List groups
 * POST: Create a new group
 */

import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '../../../../lib/middleware/auth-middleware.js';
import groupService from '../../../../lib/services/groups/group-service.js';

/**
 * GET /api/v1/groups
 * Get all groups for the authenticated user
 */
export const GET = async ({ request, url, locals }: RequestEvent) => {
    try {
        // Authenticate user
        const user = requireAuth({ request, url, locals } as any);
        if (!user) {
            return json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        // Get query parameters
        const includeArchived = url.searchParams.get('include_archived') === 'true';

        // Get groups for the user
        const groups = await groupService.getUserGroups(user.id, includeArchived);

        return json({
            success: true,
            data: {
                groups
            }
        });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to get groups:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get groups'
        }, { status: 500 });
    }
};

/**
 * POST /api/v1/groups
 * Create a new group
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
        if (!body.name) {
            return json({
                success: false,
                error: 'Group name is required'
            }, { status: 400 });
        }

        // Create group
        const group = await groupService.createGroup(user.id, {
            name: body.name,
            description: body.description,
            currency: body.currency,
            default_split_method: body.default_split_method,
            is_public: body.is_public
        });

        return json({
            success: true,
            data: {
                group
            }
        }, { status: 201 });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to create group:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create group'
        }, { status: 500 });
    }
}; 