#!/bin/bash

# Deploy Supabase Edge Functions for Flux Auth Sync

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Please install it using: bun add -g supabase"
    exit 1
fi

# Check if logged in to Supabase
supabase projects list &> /dev/null
if [ $? -ne 0 ]; then
    echo "Please login to Supabase CLI first: supabase login"
    exit 1
fi

# Set colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Deploying Flux Auth Sync Edge Function ===${NC}"

# Get Supabase project reference
echo -e "\n${YELLOW}Checking Supabase project...${NC}"
SUPABASE_PROJECT_REF=$(supabase projects list --json | jq -r '.[0].ref')

if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo -e "${RED}Error: No Supabase project found.${NC}"
    echo "Please create a project or link to an existing one using: supabase link --project-ref <ref>"
    exit 1
fi

echo -e "${GREEN}Using Supabase project: ${SUPABASE_PROJECT_REF}${NC}"

# Deploy the auth-sync function
echo -e "\n${YELLOW}Deploying auth-sync function to Supabase...${NC}"
supabase functions deploy auth-sync --project-ref ${SUPABASE_PROJECT_REF}

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to deploy auth-sync function.${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully deployed auth-sync function!${NC}"

# Get the function URL
FUNCTION_URL=$(supabase functions list --json | jq -r '.[] | select(.name=="auth-sync") | .url')
echo -e "Function URL: ${FUNCTION_URL}"

# Get Railway app URL
echo -e "\n${YELLOW}Getting Railway app URL...${NC}"

if ! command -v railway &> /dev/null; then
    echo -e "${RED}Error: Railway CLI is not installed.${NC}"
    echo "Please install it using: bun add -g @railway/cli"
    echo "Or set environment variables manually in the Supabase dashboard."
    exit 1
fi

# Check if Railway CLI is logged in
RAILWAY_APP_URL=$(railway variables get RAILWAY_PUBLIC_URL 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Not logged in to Railway or variable not set.${NC}"
    echo "Please enter your Railway app URL (e.g., https://your-app.railway.app):"
    read RAILWAY_APP_URL
    
    if [ -z "$RAILWAY_APP_URL" ]; then
        echo -e "${RED}No Railway app URL provided.${NC}"
        echo "Please set the RAILWAY_API_URL environment variable manually in the Supabase dashboard."
    fi
fi

# Set up Edge Function secrets
echo -e "\n${YELLOW}Setting up Edge Function environment variables...${NC}"

if [ ! -z "$RAILWAY_APP_URL" ]; then
    echo -e "Setting RAILWAY_API_URL to: ${RAILWAY_APP_URL}"
    supabase secrets set RAILWAY_API_URL=${RAILWAY_APP_URL} --project-ref ${SUPABASE_PROJECT_REF}
fi

# Ask for webhook secret
echo -e "\n${YELLOW}Setting up webhook secret...${NC}"
echo "Enter a webhook secret (leave empty to generate a random one):"
read WEBHOOK_SECRET

if [ -z "$WEBHOOK_SECRET" ]; then
    # Generate a random webhook secret
    WEBHOOK_SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}Generated random webhook secret.${NC}"
fi

# Set webhook secret in both Supabase and Railway
echo "Setting webhook secret in Supabase Edge Function..."
supabase secrets set WEBHOOK_SECRET=${WEBHOOK_SECRET} --project-ref ${SUPABASE_PROJECT_REF}

if command -v railway &> /dev/null; then
    echo "Setting webhook secret in Railway..."
    railway variables set WEBHOOK_SECRET=${WEBHOOK_SECRET}
fi

echo -e "\n${GREEN}Environment variables set successfully!${NC}"

# Set up webhook in Supabase
echo -e "\n${YELLOW}Setting up Supabase webhook configuration...${NC}"
echo -e "Please go to your Supabase dashboard and set up a webhook with the following details:"
echo -e "URL: ${RAILWAY_APP_URL}/api/v1/auth/webhook"
echo -e "Secret: ${WEBHOOK_SECRET}"
echo -e "Events: Auth > All Events"

echo -e "\n${GREEN}Deployment completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Configure OAuth providers in Supabase dashboard (GitHub, Google)"
echo -e "2. Add callback URLs: ${RAILWAY_APP_URL}/api/v1/auth/oauth/github/callback and ${RAILWAY_APP_URL}/api/v1/auth/oauth/google/callback"
echo -e "3. Set OAuth environment variables in Railway:"
echo -e "   - GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET"
echo -e "   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
echo -e "4. Run database migrations to ensure user tables are created: bun run migrate"
echo -e "5. Test the authentication flow with GitHub and Google OAuth" 