import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPostgresClient } from '$lib/database/postgres.js';
import { requireAuth } from '$lib/middleware/auth-middleware.js';

/**
 * GET /api/v1/auth/profile
 * Retrieves the user's profile from Railway PostgreSQL
 */
export const GET: RequestHandler = async (event) => {
  try {
    // Require authentication
    const user = requireAuth(event);
    
    // Get Postgres client
    const pgClient = await getPostgresClient();
    
    // Get user profile data
    const result = await pgClient.query(
      `SELECT 
        u.id, u.email, u.email_verified, u.phone, u.full_name, u.avatar_url, 
        u.provider, u.last_sign_in, u.created_at, u.updated_at,
        p.display_name, p.bio, p.location, p.language, p.currency, p.timezone,
        p.notification_preferences, p.theme
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id = $1`,
      [user.id]
    );
    
    // Release the client back to the pool
    pgClient.release();
    
    if (result.rowCount === 0) {
      return json({
        success: false,
        message: 'User profile not found'
      }, { status: 404 });
    }
    
    // Return profile data
    return json({
      success: true,
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('[Flux Auth] Profile retrieval error:', error);
    
    return json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error retrieving profile'
    }, { status: error instanceof Response ? error.status : 500 });
  }
};

/**
 * PUT /api/v1/auth/profile
 * Updates the user's profile in Railway PostgreSQL
 */
export const PUT: RequestHandler = async (event) => {
  try {
    // Require authentication
    const user = requireAuth(event);
    
    // Parse request body
    const requestData = await event.request.json();
    
    // Validate request data
    const {
      display_name,
      bio,
      location,
      language,
      currency,
      timezone,
      notification_preferences,
      theme
    } = requestData;
    
    // Get Postgres client
    const pgClient = await getPostgresClient();
    
    // Start transaction
    await pgClient.query('BEGIN');
    
    try {
      // Update user profile
      const profileResult = await pgClient.query(
        `INSERT INTO user_profiles (
          user_id, display_name, bio, location, language, currency, timezone,
          notification_preferences, theme
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id) 
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          bio = EXCLUDED.bio,
          location = EXCLUDED.location,
          language = EXCLUDED.language,
          currency = EXCLUDED.currency,
          timezone = EXCLUDED.timezone,
          notification_preferences = EXCLUDED.notification_preferences,
          theme = EXCLUDED.theme,
          updated_at = NOW()
        RETURNING *`,
        [
          user.id,
          display_name,
          bio || null,
          location || null,
          language || 'en',
          currency || 'INR',
          timezone || 'Asia/Kolkata',
          notification_preferences ? JSON.stringify(notification_preferences) : null,
          theme || 'light'
        ]
      );
      
      // Update user record if needed
      if (requestData.full_name || requestData.avatar_url) {
        await pgClient.query(
          `UPDATE users SET
            full_name = COALESCE($2, full_name),
            avatar_url = COALESCE($3, avatar_url),
            updated_at = NOW()
          WHERE id = $1`,
          [
            user.id,
            requestData.full_name || null,
            requestData.avatar_url || null
          ]
        );
      }
      
      // Log profile update in audit log
      await pgClient.query(
        `INSERT INTO auth_audit_logs (
          user_id, event_type, metadata
        ) VALUES ($1, $2, $3)`,
        [
          user.id,
          'profile_updated',
          JSON.stringify({
            fields_updated: Object.keys(requestData)
          })
        ]
      );
      
      // Commit transaction
      await pgClient.query('COMMIT');
      
      console.log(`[Flux Auth] Updated profile for user: ${user.email}`);
      
      return json({
        success: true,
        message: 'Profile updated successfully',
        profile: profileResult.rows[0]
      });
    } catch (error) {
      // Rollback transaction on error
      await pgClient.query('ROLLBACK');
      throw error;
    } finally {
      // Release the client back to the pool
      pgClient.release();
    }
  } catch (error) {
    console.error('[Flux Auth] Profile update error:', error);
    
    return json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating profile'
    }, { status: error instanceof Response ? error.status : 500 });
  }
};

/**
 * DELETE /api/v1/auth/profile
 * Deactivates a user account (soft delete)
 */
export const DELETE: RequestHandler = async (event) => {
  try {
    // Require authentication
    const user = requireAuth(event);
    
    // Get Postgres client
    const pgClient = await getPostgresClient();
    
    // Start transaction
    await pgClient.query('BEGIN');
    
    try {
      // Soft delete user (mark as inactive)
      await pgClient.query(
        `UPDATE users SET
          is_active = false,
          updated_at = NOW()
        WHERE id = $1`,
        [user.id]
      );
      
      // Log account deactivation in audit log
      await pgClient.query(
        `INSERT INTO auth_audit_logs (
          user_id, event_type, metadata
        ) VALUES ($1, $2, $3)`,
        [
          user.id,
          'account_deactivated',
          JSON.stringify({
            email: user.email,
            deactivation_time: new Date().toISOString()
          })
        ]
      );
      
      // Commit transaction
      await pgClient.query('COMMIT');
      
      console.log(`[Flux Auth] Deactivated account for user: ${user.email}`);
      
      return json({
        success: true,
        message: 'Account deactivated successfully'
      });
    } catch (error) {
      // Rollback transaction on error
      await pgClient.query('ROLLBACK');
      throw error;
    } finally {
      // Release the client back to the pool
      pgClient.release();
    }
  } catch (error) {
    console.error('[Flux Auth] Account deactivation error:', error);
    
    return json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error deactivating account'
    }, { status: error instanceof Response ? error.status : 500 });
  }
};
