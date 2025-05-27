/**
 * Database Health Check API for Flux
 * GET: Check database connection details and health
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fluxPostgreSQL } from '../../../lib/database/postgres.js';
import { FLUX_CONFIG } from '../../../lib/config/environment.js';

/**
 * GET /api/database-health
 * Check database connection details and health
 */
export const GET: RequestHandler = async ({ url }) => {
    try {
        // Check if debug param is provided
        const debug = url.searchParams.get('debug') === 'true';
        
        // Get basic health status
        const healthStatus = await fluxPostgreSQL.healthCheck();
        
        // Get a count of users in the database
        let userCount = 0;
        let databaseDetails = null;
        
        try {
            const userCountResult = await fluxPostgreSQL.query('SELECT COUNT(*) as count FROM users');
            userCount = parseInt(userCountResult.rows[0].count);
            
            // If debug is enabled, add more details
            if (debug) {
                const databaseResult = await fluxPostgreSQL.query(
                    'SELECT current_database() as db_name, current_user as db_user, version() as version'
                );
                databaseDetails = databaseResult.rows[0];
                
                // List the first 5 users for debugging
                const usersResult = await fluxPostgreSQL.query(
                    'SELECT id, supabase_user_id, email, full_name, created_at FROM users LIMIT 5'
                );
                databaseDetails.sample_users = usersResult.rows;
            }
        } catch (error) {
            console.error('[Database Health] Error querying database:', error);
        }
        
        // Return health status with connection details
        return json({
            success: true,
            data: {
                database_status: healthStatus.status,
                message: healthStatus.message,
                connection: {
                    database_url: debug ? FLUX_CONFIG.databaseUrl : '***redacted***',
                    connected: fluxPostgreSQL.getStatus().connected,
                    pool_info: fluxPostgreSQL.getStatus().poolInfo,
                    environment: FLUX_CONFIG.environment
                },
                users_count: userCount,
                database_details: databaseDetails,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[Database Health] Error checking database health:', error);
        return json({
            success: false,
            error: 'Failed to check database health',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}; 