/**
 * Test Authentication Utility for Flux
 * 
 * This utility provides functions to generate test JWT tokens
 * for authenticating API test requests
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Set up file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envFilePath = path.join(__dirname, '..', '..', '.env');

// Read JWT secret from .env file
function getJwtSecret() {
  try {
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)$/m);
    
    if (jwtSecretMatch && jwtSecretMatch[1]) {
      return jwtSecretMatch[1].trim();
    }
    
    // Fallback to a default secret for testing if not found
    console.warn('JWT_SECRET not found in .env file, using default test secret');
    return 'flux_development_secret';
  } catch (error) {
    console.warn('Error reading JWT_SECRET from .env:', error.message);
    // Fallback to a default secret for testing
    return 'flux_development_secret';
  }
}

/**
 * Generate a test JWT token for a specific user
 * @param {string} userId - The user ID to include in the token
 * @param {string} email - The user email to include in the token
 * @returns {Promise<string>} The generated JWT token
 */
export async function generateTestToken(userId, email) {
  const jwtSecret = getJwtSecret();
  
  // Create payload with standard JWT claims and user data
  const payload = {
    sub: userId,
    email: email,
    name: 'Test User',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
    iss: 'flux-test-auth',
    aud: 'flux-api',
    role: 'user',
    test_mode: true
  };
  
  // Sign and return token
  return new Promise((resolve, reject) => {
    jwt.sign(payload, jwtSecret, { algorithm: 'HS256' }, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
}

/**
 * Verify a JWT token and return decoded payload
 * @param {string} token - The JWT token to verify
 * @returns {Promise<Object>} The decoded token payload
 */
export async function verifyTestToken(token) {
  const jwtSecret = getJwtSecret();
  
  return new Promise((resolve, reject) => {
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

/**
 * Generate a quick test token for command line usage
 * Useful for manual API testing
 */
export async function generateQuickToken() {
  const testUserId = process.env.TEST_USER_ID || '55ac3c0f-147e-4888-8888-618acc0d3333';
  const testEmail = process.env.TEST_USERNAME || 'test.user@flux.app';
  
  try {
    const token = await generateTestToken(testUserId, testEmail);
    console.log('\nTest JWT Token:');
    console.log(token);
    console.log('\nUse this token in the Authorization header:');
    console.log(`Authorization: Bearer ${token}\n`);
  } catch (error) {
    console.error('Failed to generate test token:', error);
  }
}

// Allow this module to be run directly to generate a token
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateQuickToken();
} 