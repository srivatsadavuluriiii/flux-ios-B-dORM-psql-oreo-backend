#!/bin/bash

# Flux Production Deployment Test Script
# Tests all critical endpoints on Railway deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Production URL
PROD_URL="https://flux-ios-b-dorm-psql-oreo-backend-production.up.railway.app"

# Function to print colored output
print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ️${NC} $1"
}

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local headers="$5"
    local data="$6"
    
    print_test "Testing $name"
    
    local cmd="curl -s -w '%{http_code}' -X $method"
    
    if [ ! -z "$headers" ]; then
        cmd="$cmd $headers"
    fi
    
    if [ ! -z "$data" ]; then
        cmd="$cmd -d '$data'"
    fi
    
    cmd="$cmd $PROD_URL$endpoint"
    
    local response=$(eval $cmd)
    local status_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$name - Status: $status_code"
        if [ ! -z "$body" ] && [ "$body" != "null" ]; then
            echo "   Response: ${body:0:100}..."
        fi
    else
        print_error "$name - Expected: $expected_status, Got: $status_code"
        echo "   Response: $body"
        return 1
    fi
}

echo ""
echo "🚀 Testing Flux Production Deployment"
echo "======================================"
echo "Production URL: $PROD_URL"
echo ""

# Test 1: Health Check
test_endpoint "Health Check" "GET" "/api/health" "200"

# Test 2: Authentication Required
test_endpoint "Auth Required" "GET" "/api/v1/auth/profile" "401"

# Test 3: User Signup (Cloud Supabase)
test_endpoint "User Signup" "POST" "/api/v1/auth/signup" "200" \
    "-H 'Content-Type: application/json'" \
    '{"email":"prod-test-'$(date +%s)'@flux.dev","password":"testpass123"}'

# Test 4: Invalid Authentication
test_endpoint "Invalid Auth" "POST" "/api/v1/auth/sync-user" "401" \
    "-H 'Authorization: Bearer invalid-token' -H 'Content-Type: application/json'"

# Test 5: OAuth Endpoints (Not configured in production)
test_endpoint "GitHub OAuth" "GET" "/api/v1/auth/oauth/github" "501"
test_endpoint "Google OAuth" "GET" "/api/v1/auth/oauth/google" "501"

echo ""
print_success "All production tests completed!"
echo ""

# Environment Information
print_info "Environment Information:"
echo "  - Environment: Hybrid (Cloud Supabase + Railway PostgreSQL + Railway Redis)"
echo "  - Authentication: Cloud Supabase with OAuth support"
echo "  - Database: Railway PostgreSQL with user sync"
echo "  - Cache: Railway Redis for rate limiting and sessions"
echo "  - Configuration: Automatic environment selection"
echo ""

print_info "Available Endpoints:"
echo "  - Health: $PROD_URL/api/health"
echo "  - Auth: $PROD_URL/api/v1/auth/*"
echo "  - GitHub OAuth: $PROD_URL/api/v1/auth/oauth/github"
echo "  - Google OAuth: $PROD_URL/api/v1/auth/oauth/google"
echo ""

print_success "🎉 Flux backend successfully deployed to Railway!" 