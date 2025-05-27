/**
 * Supabase Auth Webhook Handler for Flux
 * POST: Handle auth events from Supabase and sync to Railway PostgreSQL
 * Events: user.created, user.updated, user.deleted, user.signed_in, user.signed_out
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userSyncService } from '../../../../../lib/services/auth/index.js';
// Webhook event types from Supabase Auth
interface SupabaseAuthEvent {
    type: 'user.created' | 'user.updated' | 'user.deleted' | 'user.signed_in' | 'user.signed_out';
    table: 'auth.users';
    record?: any;
    old_record?: any;
    schema: 'auth';
}

/**
 * POST /api/v1/auth/webhook
 * Handle Supabase Auth webhook events
 */
export const POST: RequestHandler = async ({ request }) => {
    const startTime = Date.now();
    
    try {
        // Log request headers for debugging
        if (process.env.DEBUG_AUTH === 'true') {
            const headers: Record<string, string> = {};
            request.headers.forEach((value, key) => {
                headers[key] = value;
            });
            console.log('[Flux Auth Webhook] Request headers:', headers);
        }
        
        // Verify webhook signature (if configured)
        const signature = request.headers.get('authorization');
        const webhookSecret = process.env.WEBHOOK_SECRET || process.env.SUPABASE_WEBHOOK_SECRET;
        
        if (webhookSecret && signature !== `Bearer ${webhookSecret}`) {
            console.warn('[Flux Auth Webhook] Invalid webhook signature');
            return json(
                { 
                    success: false, 
                    error: 'Invalid webhook signature',
                    code: 'INVALID_SIGNATURE'
                },
                { status: 401 }
            );
        }

        // Parse webhook payload
        const payload = await request.json();
        console.log('[Flux Auth Webhook] Received event:', payload.type, 'for user:', payload.record?.id);
        
        // Log full payload in debug mode
        if (process.env.DEBUG_AUTH === 'true') {
            console.log('[Flux Auth Webhook] Full payload:', JSON.stringify(payload, null, 2));
        }

        const event: SupabaseAuthEvent = payload;
        let result = null;

        // Handle different event types
        switch (event.type) {
            case 'user.created':
                result = await handleUserCreated(event);
                break;
                
            case 'user.updated':
                result = await handleUserUpdated(event);
                break;
                
            case 'user.deleted':
                result = await handleUserDeleted(event);
                break;
                
            case 'user.signed_in':
                result = await handleUserSignedIn(event);
                break;
                
            case 'user.signed_out':
                result = await handleUserSignedOut(event);
                break;
                
            default:
                console.log('[Flux Auth Webhook] Unhandled event type:', event.type);
                break;
        }
        
        const responseTime = Date.now() - startTime;
        console.log(`[Flux Auth Webhook] Event ${event.type} processed in ${responseTime}ms`);

        return json({
            success: true,
            message: `Processed ${event.type} event successfully`,
            data: process.env.DEBUG_AUTH === 'true' ? result : undefined,
            responseTime
        });

    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error('[Flux Auth Webhook] Error processing webhook:', error);
        return json(
            { 
                success: false, 
                error: 'Failed to process webhook',
                code: 'WEBHOOK_PROCESSING_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error',
                responseTime
            },
            { status: 500 }
        );
    }
};

/**
 * Handle user.created event
 */
async function handleUserCreated(event: SupabaseAuthEvent) {
    if (!event.record) return null;
    
    try {
        console.log('[Flux Auth Webhook] Creating user in Railway DB:', event.record.id);
        
        // Sync new user to Railway PostgreSQL
        const fluxUser = await userSyncService.syncUserFromSupabase(event.record);
        console.log('[Flux Auth Webhook] User synced with Railway ID:', fluxUser.id);
        
        // Create default user profile
        const user = await userSyncService.getUserBySupabaseId(event.record.id);
        if (user) {
            const profile = await userSyncService.createUserProfile(user.id);
            console.log('[Flux Auth Webhook] Created user profile with ID:', profile.id);
        }
        
        console.log('[Flux Auth Webhook] ✅ User created successfully in Railway DB');
        
        return { fluxUser };
    } catch (error) {
        console.error('[Flux Auth Webhook] ❌ Failed to create user:', error);
        throw error;
    }
}

/**
 * Handle user.updated event
 */
async function handleUserUpdated(event: SupabaseAuthEvent) {
    if (!event.record) return;
    
    try {
        console.log('[Flux Auth Webhook] Updating user in Railway DB:', event.record.id);
        
        // Re-sync user data to Railway PostgreSQL
        await userSyncService.syncUserFromSupabase(event.record);
        
        console.log('[Flux Auth Webhook] ✅ User updated successfully in Railway DB');
    } catch (error) {
        console.error('[Flux Auth Webhook] ❌ Failed to update user:', error);
        throw error;
    }
}

/**
 * Handle user.deleted event
 */
async function handleUserDeleted(event: SupabaseAuthEvent) {
    if (!event.record) return;
    
    try {
        console.log('[Flux Auth Webhook] Soft deleting user in Railway DB:', event.record.id);
        
        // Delete user in Railway PostgreSQL
        await userSyncService.deleteUser(event.record.id);
        
        console.log('[Flux Auth Webhook] ✅ User soft deleted successfully in Railway DB');
    } catch (error) {
        console.error('[Flux Auth Webhook] ❌ Failed to delete user:', error);
        throw error;
    }
}

/**
 * Handle user.signed_in event
 */
async function handleUserSignedIn(event: SupabaseAuthEvent) {
    if (!event.record) return;
    
    try {
        console.log('[Flux Auth Webhook] User signed in:', event.record.id);
        
        // Update last active time
        const user = await userSyncService.getUserBySupabaseId(event.record.id);
        if (user) {
            await userSyncService.updateLastActive(user.id);
        }
        
        console.log('[Flux Auth Webhook] ✅ User sign-in processed');
    } catch (error) {
        console.error('[Flux Auth Webhook] ❌ Failed to process sign-in:', error);
        // Don't throw error for sign-in events, just log
    }
}

/**
 * Handle user.signed_out event
 */
async function handleUserSignedOut(event: SupabaseAuthEvent) {
    if (!event.record) return;
    
    try {
        console.log('[Flux Auth Webhook] User signed out:', event.record.id);
        
        // Could invalidate sessions here if needed
        // For now, just log the event
        
        console.log('[Flux Auth Webhook] ✅ User sign-out processed');
    } catch (error) {
        console.error('[Flux Auth Webhook] ❌ Failed to process sign-out:', error);
        // Don't throw error for sign-out events, just log
    }
} 