# 🚀 Google OAuth Consent Screen - Quick Setup for Flux

## Step 1: Access Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project: `flux-expense-tracker`

## Step 2: OAuth Consent Screen
1. **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Click **Create**

## Step 3: App Information
```
App name: Flux Expense Tracker
User support email: [Select from dropdown]
Application home page: http://localhost:3000
Privacy policy: http://localhost:3000/privacy
Terms of service: http://localhost:3000/terms
Developer contact: your_email@domain.com
```

## Step 4: Scopes
Add these scopes:
- ✅ `email` - See primary Google Account email
- ✅ `profile` - See personal info  
- ✅ `openid` - Associate with personal info

## Step 5: Test Users
Add these test emails:
- Your personal email
- Any test user emails
- Development team emails

## Step 6: Authorized Domains
Add:
- `localhost` (for development)
- Your production domain

## ⚠️ Important Notes

1. **Testing Mode**: Your app starts in testing mode - only test users can authenticate
2. **Production**: To publish, you'll need app verification (later)
3. **Verification**: For production use with external users, Google verification required
4. **Scopes**: Only request minimum necessary scopes

## 🔄 Next: Create OAuth Credentials
After consent screen setup:
1. Go to **Credentials** 
2. **Create Credentials** → **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Add redirect URIs:
   - `https://gkmgdkeigseysfizltlv.supabase.co/auth/v1/callback`

## 📋 Checklist
- [ ] Project created: `flux-expense-tracker`
- [ ] OAuth consent screen configured
- [ ] External user type selected
- [ ] App information filled
- [ ] Basic scopes added (email, profile, openid)
- [ ] Test users added
- [ ] Ready for OAuth credential creation 