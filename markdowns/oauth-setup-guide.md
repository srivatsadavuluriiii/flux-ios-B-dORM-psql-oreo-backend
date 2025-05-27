# Flux OAuth Provider Setup Guide

This document outlines the process to set up OAuth authentication providers (GitHub and Google) for Flux, enabling users to sign in using their existing accounts.

## Prerequisites

Before setting up OAuth providers, ensure you have:

1. A Supabase project set up with Auth enabled
2. A Railway project for the Flux backend
3. Developer accounts on GitHub and Google

## 1. Setting Up GitHub OAuth

### 1.1 Create a GitHub OAuth App

1. Go to your GitHub account settings
2. Navigate to "Developer settings" > "OAuth Apps" > "New OAuth App"
3. Fill in the application details:
   - **Application name**: Flux - Expense Tracking
   - **Homepage URL**: Your Railway app URL (e.g., https://flux.railway.app)
   - **Application description**: Next-generation expense tracking with AI, IoT, and blockchain integration
   - **Authorization callback URL**: `https://your-railway-app.railway.app/api/v1/auth/oauth/github/callback`
4. Click "Register application"
5. Generate a new client secret
6. Note down the Client ID and Client Secret

### 1.2 Configure GitHub OAuth in Supabase

1. In your Supabase dashboard, go to "Authentication" > "Providers"
2. Find "GitHub" in the list and click "Edit"
3. Enable the provider
4. Enter the Client ID and Client Secret from GitHub
5. Save changes

## 2. Setting Up Google OAuth

### 2.1 Create a Google OAuth Client

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Configure the consent screen if prompted
6. Select "Web application" as the application type
7. Add your application name: "Flux Expense Tracking"
8. Add authorized redirect URIs:
   - `https://your-railway-app.railway.app/api/v1/auth/oauth/google/callback`
9. Click "Create"
10. Note down the Client ID and Client Secret

### 2.2 Configure Google OAuth in Supabase

1. In your Supabase dashboard, go to "Authentication" > "Providers"
2. Find "Google" in the list and click "Edit"
3. Enable the provider
4. Enter the Client ID and Client Secret from Google
5. Save changes

## 3. Configure Environment Variables

### 3.1 Set Variables in Railway

Set the following environment variables in your Railway project:

```bash
railway variables set GITHUB_CLIENT_ID=your_github_client_id
railway variables set GITHUB_CLIENT_SECRET=your_github_client_secret
railway variables set GOOGLE_CLIENT_ID=your_google_client_id
railway variables set GOOGLE_CLIENT_SECRET=your_google_client_secret
railway variables set WEBHOOK_SECRET=your_webhook_secret
```

### 3.2 Set Variables in Supabase Edge Functions

Set the same webhook secret in your Supabase Edge Function:

```bash
supabase secrets set WEBHOOK_SECRET=your_webhook_secret
supabase secrets set RAILWAY_API_URL=https://your-railway-app.railway.app
```

## 4. Deploy Supabase Edge Function

Deploy the auth-sync Edge Function to handle auth events:

```bash
# Run our deployment script
./scripts/deploy-auth-sync.sh

# Or manually
supabase functions deploy auth-sync
```

## 5. Configure Supabase Webhook

1. In Supabase dashboard, go to "Database" > "Webhooks" > "Create new webhook"
2. Enter a name: "Auth Events"
3. Set the HTTP method to POST
4. Enter the webhook URL: `https://your-railway-app.railway.app/api/v1/auth/webhook`
5. Add the webhook secret
6. Select Auth events:
   - user.created
   - user.updated
   - user.deleted
   - user.signed_in
   - user.signed_out
7. Save the webhook

## 6. Test the OAuth Flow

Test the OAuth authentication flow:

1. **Sign-Up Flow**: `/api/v1/auth/oauth/github` or `/api/v1/auth/oauth/google`
2. **Account Linking**: Use the link-provider endpoint for existing users
3. **Account Unlinking**: Use the unlink-provider endpoint to disconnect providers

## 7. OAuth Endpoints

Flux provides the following OAuth-related endpoints:

- **Provider List**: `GET /api/v1/auth/oauth`
- **GitHub Auth**: `GET /api/v1/auth/oauth/github`
- **GitHub Callback**: `GET /api/v1/auth/oauth/github/callback`
- **Google Auth**: `GET /api/v1/auth/oauth/google`
- **Google Callback**: `GET /api/v1/auth/oauth/google/callback`
- **Link Provider**: `POST /api/v1/auth/oauth/link-provider`
- **Unlink Provider**: `POST /api/v1/auth/oauth/unlink-provider`

## 8. User Synchronization

When a user authenticates via OAuth, Flux automatically:

1. Creates or updates the user in Supabase Auth
2. Syncs the user data to the Railway PostgreSQL database via the webhook
3. Stores OAuth provider information for the user
4. Creates a default user profile if it's a new user

## Troubleshooting

### Common Issues

1. **OAuth Callback Errors**: Ensure your callback URLs are correctly configured in both Supabase and the provider's developer console.
2. **CORS Issues**: Check that your CORS configuration in Supabase and Railway allows requests from expected origins.
3. **Webhook Failures**: Verify the webhook secret is the same in both Supabase and Railway.
4. **Missing User Data**: Ensure the auth-sync Edge Function is properly deployed and configured with the correct RAILWAY_API_URL.

### Debugging

Enable debug logging by setting the DEBUG_AUTH environment variable:

```bash
railway variables set DEBUG_AUTH=true
```

This will output detailed logs for OAuth flows and user synchronization. 