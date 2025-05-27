#!/usr/bin/env node

/**
 * OAuth Environment Update Script for Flux
 * 
 * This script updates the .env file with proper OAuth credentials
 * SECURITY NOTE: Never hardcode OAuth credentials in scripts.
 * Use environment variables or secure credential management instead.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Set up file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envFilePath = path.join(__dirname, '..', '.env');

// Read the .env file
function readEnvFile() {
  try {
    return fs.readFileSync(envFilePath, 'utf8');
  } catch (error) {
    console.error(`Error reading .env file: ${error.message}`);
    process.exit(1);
  }
}

// Write to the .env file
function writeEnvFile(content) {
  try {
    fs.writeFileSync(envFilePath, content);
    return true;
  } catch (error) {
    console.error(`Error writing to .env file: ${error.message}`);
    return false;
  }
}

// Update environment variable in .env
function updateEnvVar(envContent, varName, varValue) {
  const regex = new RegExp(`^${varName}=.*`, 'm');
  
  if (regex.test(envContent)) {
    // Update existing variable
    return envContent.replace(regex, `${varName}=${varValue}`);
  } else {
    // Add new variable
    return `${envContent}\n${varName}=${varValue}`;
  }
}

// Main function
function main() {
  console.log('\n=== Updating Flux OAuth Configuration ===\n');
  
  // Read current .env file
  let envContent = readEnvFile();
  
  // GitHub OAuth credentials - use environment variables or prompt user
  const githubClientId = process.env.GITHUB_CLIENT_ID || '<YOUR_GITHUB_CLIENT_ID>';
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || '<YOUR_GITHUB_CLIENT_SECRET>';
  
  // Google OAuth credentials - use environment variables or prompt user
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '<YOUR_GOOGLE_CLIENT_ID>';
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '<YOUR_GOOGLE_CLIENT_SECRET>';
  
  // Check if using placeholders and provide instructions
  if (googleClientId.includes('<YOUR_') || githubClientId.includes('<YOUR_')) {
    console.log('⚠️ WARNING: Using placeholder credentials');
    console.log('Please set your OAuth credentials using environment variables:');
    console.log('  export GITHUB_CLIENT_ID="your_client_id"');
    console.log('  export GITHUB_CLIENT_SECRET="your_client_secret"');
    console.log('  export GOOGLE_CLIENT_ID="your_client_id"');
    console.log('  export GOOGLE_CLIENT_SECRET="your_client_secret"');
    console.log('Then run this script again.');
    
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Cannot use placeholder credentials in production');
      process.exit(1);
    }
  }
  
  // Update .env file
  envContent = updateEnvVar(envContent, 'GITHUB_CLIENT_ID', githubClientId);
  envContent = updateEnvVar(envContent, 'GITHUB_CLIENT_SECRET', githubClientSecret);
  envContent = updateEnvVar(envContent, 'GOOGLE_CLIENT_ID', googleClientId);
  envContent = updateEnvVar(envContent, 'GOOGLE_CLIENT_SECRET', googleClientSecret);
  
  // Write updated content to .env file
  if (writeEnvFile(envContent)) {
    console.log('✅ OAuth credentials updated in .env file');
    console.log('- GitHub client ID and secret configured');
    console.log('- Google client ID and secret configured');
  } else {
    console.log('⚠️ Failed to update .env file');
  }
  
  console.log('\n✅ Next step: Configure these credentials in Supabase:');
  console.log('1. Go to https://supabase.com/dashboard/project/gkmgdkeigseysfizltlv/auth/providers');
  console.log('2. Enable GitHub and add your client ID and secret');
  console.log('3. Enable Google and add your client ID and secret');
  console.log('4. Restart the server to apply changes');
}

// Run the script
main(); 