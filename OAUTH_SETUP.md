# 🔐 OAuth Providers Setup for Flux Authentication

## Phase 2.2: OAuth Providers Configuration

This document guides you through setting up GitHub and Google OAuth providers for Flux authentication.

## Prerequisites

✅ **Completed:**
- Phase 1: Backend Foundation
- Phase 2.1: Supabase Auth Integration
- OAuth endpoints created and tested

## 🔑 Step 1: GitHub OAuth App Setup

### 1.1 Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:

```
Application name: Flux Expense Tracker
Homepage URL: http://localhost:3000
Application description: Next-generation expense tracking with AI, IoT, and blockchain features
Authorization callback URL: https://gkmgdkeigseysfizltlv.supabase.co/auth/v1/callback
```

For production, use your deployed URL instead of localhost.

### 1.2 Get GitHub Credentials

After creating the app:
1. Copy the **Client ID**
2. Generate and copy the **Client Secret**
3. Save these securely

### 1.3 Configure in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your **flux** project
3. Navigate to **Authentication > Providers**
4. Find **GitHub** and click **Configure**
5. Enable GitHub provider
6. Enter your GitHub credentials:
   - **Client ID**: `your_github_client_id`
   - **Client Secret**: `your_github_client_secret`
7. Click **Save**

## 🔍 Step 2: Google OAuth App Setup

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it: `flux-expense-tracker`

### 2.2 Enable Google+ API

1. Navigate to **APIs & Services > Library**
2. Search for **"Google+ API"** or **"People API"**
3. Click **Enable**

### 2.3 Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in the application details:

```
App name: Flux Expense Tracker
User support email: your_email@domain.com
App logo: (optional)
Application home page: http://localhost:3000
Application privacy policy: http://localhost:3000/privacy
Application terms of service: http://localhost:3000/terms
Developer contact information: your_email@domain.com
```

4. Add scopes:
   - `email`
   - `profile`
   - `openid`

### 2.4 Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure:

```
Name: Flux Web Client
Authorized JavaScript origins: 
  - http://localhost:3000
  - https://your-production-domain.com

Authorized redirect URIs:
  - https://gkmgdkeigseysfizltlv.supabase.co/auth/v1/callback
```

5. Save and copy the **Client ID** and **Client Secret**

### 2.5 Configure in Supabase

1. In Supabase Dashboard > **Authentication > Providers**
2. Find **Google** and click **Configure**
3. Enable Google provider
4. Enter your Google credentials:
   - **Client ID**: `your_google_client_id`
   - **Client Secret**: `your_google_client_secret`
5. Click **Save**

## 🛠️ Step 3: Update Environment Variables

Update your `.env` file with the OAuth credentials:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_actual_github_client_id
GITHUB_CLIENT_SECRET=your_actual_github_client_secret

# Google OAuth  
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
```

## 🔗 Step 4: Update Production URLs

For Railway deployment, set production OAuth callback URLs:

### GitHub OAuth App
- Update callback URL to: `https://gkmgdkeigseysfizltlv.supabase.co/auth/v1/callback`

### Google OAuth App
- Add authorized redirect URI: `https://gkmgdkeigseysfizltlv.supabase.co/auth/v1/callback`

## 🧪 Step 5: Test OAuth Flows

### Local Testing URLs

**GitHub OAuth:**
```bash
# Initiate GitHub OAuth
curl -L http://localhost:3000/api/v1/auth/oauth/github

# List providers
curl http://localhost:3000/api/v1/auth/oauth | jq
```

**Google OAuth:**
```bash
# Initiate Google OAuth
curl -L http://localhost:3000/api/v1/auth/oauth/google
```

### Browser Testing

1. Open browser to: `http://localhost:3000/api/v1/auth/oauth/github`
2. Should redirect to GitHub OAuth consent screen
3. After authorization, redirects to callback URL
4. Check for successful authentication

## 📋 Step 6: Verification Checklist

- [ ] GitHub OAuth app created and configured
- [ ] Google Cloud project created with OAuth consent screen
- [ ] Google OAuth credentials generated
- [ ] Supabase providers configured for both GitHub and Google
- [ ] Environment variables updated with real credentials
- [ ] Local testing shows OAuth initiation redirects work
- [ ] Callback URLs properly configured for both development and production

## 🚀 Step 7: Production Deployment

Update Railway environment variables:

```bash
railway variables --set "GITHUB_CLIENT_ID=your_github_client_id"
railway variables --set "GITHUB_CLIENT_SECRET=your_github_client_secret"
railway variables --set "GOOGLE_CLIENT_ID=your_google_client_id"
railway variables --set "GOOGLE_CLIENT_SECRET=your_google_client_secret"
```

## 🔧 Troubleshooting

### Common Issues

1. **"Invalid client" error**
   - Verify client ID and secret are correct
   - Check that provider is enabled in Supabase

2. **Redirect URI mismatch**
   - Ensure callback URLs match exactly in OAuth app settings
   - Check for trailing slashes or http vs https

3. **Scope issues**
   - Verify required scopes are configured in OAuth consent screen
   - Check that scopes match what's requested in the API call

### Debug OAuth Flow

Check Supabase logs:
1. Go to Supabase Dashboard > **Logs**
2. Filter for **Auth logs**
3. Look for OAuth-related errors

## 📁 Current Status

✅ **Completed in Phase 2.2:**
- OAuth provider endpoints created
- GitHub and Google OAuth routes implemented
- OAuth provider service layer
- Session refresh endpoint
- Provider listing endpoint

🔄 **Next Steps (Phase 2.3):**
- Configure actual OAuth applications
- Test complete OAuth flows
- Implement multi-provider account linking
- Add OAuth provider management endpoints

## 🎯 OAuth Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/auth/oauth` | GET | List available providers |
| `/api/v1/auth/oauth/github` | GET | Initiate GitHub OAuth |
| `/api/v1/auth/oauth/github/callback` | GET | Handle GitHub callback |
| `/api/v1/auth/oauth/google` | GET | Initiate Google OAuth |
| `/api/v1/auth/oauth/google/callback` | GET | Handle Google callback |
| `/api/v1/auth/refresh` | POST | Refresh JWT token |

All endpoints support both JSON API responses and web browser redirects for flexible integration. 