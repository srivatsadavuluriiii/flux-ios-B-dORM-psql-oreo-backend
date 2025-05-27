/**
 * Generate a test JWT token for API testing
 */

import * as jwt from 'jsonwebtoken';
import { fluxPostgreSQL } from '../lib/database/postgres.js';

// Get first user for the token
async function generateTestToken() {
    try {
        console.log('Generating test JWT token...');
        
        // Get first user
        const usersResult = await fluxPostgreSQL.query('SELECT id FROM users LIMIT 1');
        
        if (usersResult.rowCount === 0) {
            console.error('No users found in the database. Please create users first.');
            process.exit(1);
        }
        
        const userId = usersResult.rows[0].id;
        console.log(`Using user ID ${userId} for test token`);
        
        // Generate JWT token
        const secretKey = 'flux_development_secret';
        const payload = {
            sub: userId,
            role: 'authenticated',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
        };
        
        const token = jwt.sign(payload, secretKey);
        
        console.log('\n✅ Test JWT Token:');
        console.log(token);
        console.log('\nUse this token in API requests:');
        console.log(`curl -X GET "http://localhost:3000/api/v1/expenses" -H "Authorization: Bearer ${token}"`);
        
    } catch (error) {
        console.error('Error generating test token:', error);
    } finally {
        process.exit(0);
    }
}

// Run the function
generateTestToken(); 