#!/usr/bin/env bun

// Generate a test JWT token for API testing
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

// Sample test user
const testUser = {
  sub: '55ac3c0f-147e-4888-8888-618acc0d3333', // Fixed ID for test user
  email: 'test.user@flux.app',
  name: 'Test User',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  iss: 'flux-test-auth',
  aud: 'flux-api',
  role: 'user',
  test_mode: true
};

// Secret key for signing test tokens
// In a real application, this would be an environment variable
const TEST_SECRET = 'flux-test-secret-key-for-development-only';

// Generate the token
const token = jwt.sign(testUser, TEST_SECRET);

// Output token (this will be captured by the test script)
console.log(token); 