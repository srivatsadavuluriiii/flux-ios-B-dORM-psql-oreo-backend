/**
 * Flux Individual Group Member API
 * GET: Get member details
 * PUT: Update member details
 * DELETE: Remove a member from the group
 */

import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '../../../../../../../lib/middleware/auth-middleware.js';
import groupService from '../../../../../../../lib/services/groups/group-service.js';

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
 * GET /api/v1/groups/[id]/members/[userId]
 * Get details of a specific group member
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
        const memberId = params.userId;
        
        if (!groupId || !memberId) {
            return json({
                success: false,
                error: 'Group ID and User ID are required'
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

        // Get all members
        const members = await groupService.getGroupMembers(groupId, true);
        
        // Find the specific member
        const member = members.find(m => m.user_id === memberId);
        
        if (!member) {
            return json({
                success: false,
                error: 'Member not found in this group'
            }, { status: 404 });
        }

        return json({
            success: true,
            data: {
                member
            }
        });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to get group member details:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get group member details'
        }, { status: 500 });
    }
};

/**
 * PUT /api/v1/groups/[id]/members/[userId]
 * Update a group member
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
        const memberId = params.userId;
        
        if (!groupId || !memberId) {
            return json({
                success: false,
                error: 'Group ID and User ID are required'
            }, { status: 400 });
        }

        // Parse request body
        const body = await request.json();
        
        // Determine if user is trying to update their own record or someone else's
        const isSelf = user.id === memberId;
        
        // Check permissions - admin can update anyone, user can only update themselves
        const isAdmin = await verifyGroupAccess(groupId, user.id, true);
        
        if (!isAdmin && !isSelf) {
            return json({
                success: false,
                error: 'You do not have permission to update this member'
            }, { status: 403 });
        }
        
        // Prepare updates
        const updates: any = {};
        
        // Only admins can change roles
        if (body.role !== undefined) {
            if (!isAdmin) {
                return json({
                    success: false,
                    error: 'Only admins can change member roles'
                }, { status: 403 });
            }
            
            // Prevent removing the last admin
            if (body.role !== 'admin') {
                const members = await groupService.getGroupMembers(groupId);
                const admins = members.filter(m => m.role === 'admin');
                
                // If this is the only admin, prevent role change
                if (admins.length === 1 && admins[0].user_id === memberId) {
                    return json({
                        success: false,
                        error: 'Cannot remove the last admin from the group'
                    }, { status: 400 });
                }
            }
            
            updates.role = body.role;
        }
        
        // Anyone can update their own nickname and notification preferences
        if (body.nickname !== undefined) {
            updates.nickname = body.nickname;
        }
        
        if (body.notification_preferences !== undefined) {
            updates.notification_preferences = body.notification_preferences;
        }
        
        // Only admins can deactivate users
        if (body.is_active !== undefined) {
            if (!isAdmin && !isSelf) {
                return json({
                    success: false,
                    error: 'Only admins can change member status'
                }, { status: 403 });
            }
            
            // Prevent removing the last admin
            if (body.is_active === false) {
                const userRole = await groupService.getUserRole(groupId, memberId);
                if (userRole === 'admin') {
                    const members = await groupService.getGroupMembers(groupId);
                    const admins = members.filter(m => m.role === 'admin');
                    
                    // If this is the only admin, prevent deactivation
                    if (admins.length === 1) {
                        return json({
                            success: false,
                            error: 'Cannot remove the last admin from the group'
                        }, { status: 400 });
                    }
                }
            }
            
            updates.is_active = body.is_active;
        }
        
        // Update member
        const updatedMember = await groupService.updateMember(groupId, memberId, updates);
        
        if (!updatedMember) {
            return json({
                success: false,
                error: 'Failed to update member'
            }, { status: 500 });
        }

        return json({
            success: true,
            data: {
                member: updatedMember
            }
        });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to update group member:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update group member'
        }, { status: 500 });
    }
};

/**
 * DELETE /api/v1/groups/[id]/members/[userId]
 * Remove a member from the group (soft delete)
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
        const memberId = params.userId;
        
        if (!groupId || !memberId) {
            return json({
                success: false,
                error: 'Group ID and User ID are required'
            }, { status: 400 });
        }

        // Determine if user is trying to remove themselves or someone else
        const isSelf = user.id === memberId;
        
        // Check permissions - admin can remove anyone, user can only remove themselves
        const isAdmin = await verifyGroupAccess(groupId, user.id, true);
        
        if (!isAdmin && !isSelf) {
            return json({
                success: false,
                error: 'You do not have permission to remove this member'
            }, { status: 403 });
        }
        
        // Prevent removing the last admin
        if (!isSelf) {
            const userRole = await groupService.getUserRole(groupId, memberId);
            if (userRole === 'admin') {
                const members = await groupService.getGroupMembers(groupId);
                const admins = members.filter(m => m.role === 'admin');
                
                // If this is the only admin, prevent removal
                if (admins.length === 1) {
                    return json({
                        success: false,
                        error: 'Cannot remove the last admin from the group'
                    }, { status: 400 });
                }
            }
        }
        
        // Remove member
        const removed = await groupService.removeMember(groupId, memberId);
        
        if (!removed) {
            return json({
                success: false,
                error: 'Failed to remove member'
            }, { status: 500 });
        }

        return json({
            success: true,
            data: {
                message: 'Member removed successfully'
            }
        });
    } catch (error) {
        console.error('[Flux API] ❌ Failed to remove group member:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to remove group member'
        }, { status: 500 });
    }
}; 