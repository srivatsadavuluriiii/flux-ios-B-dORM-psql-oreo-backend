#!/bin/bash

# Test script for Phase 3 functionality
echo "=== Flux Phase 3 Functionality Test ==="
echo "Testing Core API Layer, Services, and Middleware"

# Generate a test token
echo "Generating test token..."
export TEST_TOKEN=$(bun run scripts/generate-test-token.js)

if [ -z "$TEST_TOKEN" ]; then
  echo "Failed to generate test token. Aborting tests."
  exit 1
fi

echo "Test token generated successfully."
echo "Token: $TEST_TOKEN"
echo ""

BASE_URL="http://localhost:3001"

# Helper function for API calls
call_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4

  echo "Testing $method $endpoint"
  
  if [ -z "$data" ]; then
    response=$(curl -s -X $method \
      -H "Authorization: Bearer $TEST_TOKEN" \
      -H "Content-Type: application/json" \
      -w "\n%{http_code}" \
      $BASE_URL$endpoint)
  else
    response=$(curl -s -X $method \
      -H "Authorization: Bearer $TEST_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      -w "\n%{http_code}" \
      $BASE_URL$endpoint)
  fi

  http_code=$(echo "$response" | tail -n1)
  response_body=$(echo "$response" | sed '$d')
  
  echo "Status: $http_code"
  
  if [ ! -z "$expected_status" ] && [ "$http_code" != "$expected_status" ]; then
    echo "❌ Test failed. Expected status $expected_status, got $http_code"
    echo "Response: $response_body"
    return 1
  else
    echo "✅ Test passed."
    echo "Response: $response_body"
    return 0
  fi
  
  echo ""
}

# Store created IDs
GROUP_ID=""
EXPENSE_ID=""
CATEGORY_ID=""

echo "=== Testing Health Endpoint ==="
call_api "GET" "/api/health" "" "200"
echo ""

echo "=== Testing Group Management APIs ==="
echo "1. Creating a new group..."
create_group_response=$(curl -s -X POST \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Group", "description":"A test group for Phase 3", "currency":"INR", "default_split_method":"equal"}' \
  $BASE_URL/api/v1/groups)

echo "$create_group_response" | jq .

# Extract group ID
GROUP_ID=$(echo "$create_group_response" | jq -r '.data.group.id')
echo "Created group with ID: $GROUP_ID"
echo ""

if [ -z "$GROUP_ID" ] || [ "$GROUP_ID" == "null" ]; then
  echo "❌ Failed to create group. Skipping group tests."
else
  echo "2. Getting group details..."
  call_api "GET" "/api/v1/groups/$GROUP_ID" "" "200"
  echo ""

  echo "3. Updating group..."
  call_api "PUT" "/api/v1/groups/$GROUP_ID" '{"name":"Updated Test Group", "description":"Updated description"}' "200"
  echo ""

  echo "4. Getting group members..."
  call_api "GET" "/api/v1/groups/$GROUP_ID/members" "" "200"
  echo ""

  echo "5. Getting group join code..."
  join_code_response=$(curl -s -X GET \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -H "Content-Type: application/json" \
    $BASE_URL/api/v1/groups/$GROUP_ID/join-code)
  
  echo "$join_code_response" | jq .
  JOIN_CODE=$(echo "$join_code_response" | jq -r '.data.join_code')
  echo "Group join code: $JOIN_CODE"
  echo ""

  echo "6. Regenerating join code..."
  call_api "POST" "/api/v1/groups/$GROUP_ID/join-code" "" "200"
  echo ""

  echo "7. Joining group with code..."
  call_api "POST" "/api/v1/groups/join" "{\"join_code\":\"$JOIN_CODE\"}" "200"
  echo ""
  
  echo "8. Testing validation middleware (invalid input)..."
  call_api "POST" "/api/v1/groups" '{"invalid_field":"test"}' "400"
  echo ""
fi

echo "=== Testing Expense Management APIs ==="
echo "1. Creating expense category..."
create_category_response=$(curl -s -X POST \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Category", "color_hex":"#FF5733", "icon_name":"food"}' \
  $BASE_URL/api/v1/expenses/categories)

echo "$create_category_response" | jq .

# Extract category ID
CATEGORY_ID=$(echo "$create_category_response" | jq -r '.data.category.id')
echo "Created category with ID: $CATEGORY_ID"
echo ""

if [ -z "$CATEGORY_ID" ] || [ "$CATEGORY_ID" == "null" ]; then
  echo "❌ Failed to create category. Skipping related tests."
else
  echo "2. Creating an expense..."
  create_expense_response=$(curl -s -X POST \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"amount\":1000, \"description\":\"Test expense\", \"category_id\":\"$CATEGORY_ID\", \"expense_date\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"currency\":\"INR\", \"group_id\":\"$GROUP_ID\"}" \
    $BASE_URL/api/v1/expenses)

  echo "$create_expense_response" | jq .

  # Extract expense ID
  EXPENSE_ID=$(echo "$create_expense_response" | jq -r '.data.expense.id')
  echo "Created expense with ID: $EXPENSE_ID"
  echo ""

  if [ -z "$EXPENSE_ID" ] || [ "$EXPENSE_ID" == "null" ]; then
    echo "❌ Failed to create expense. Skipping related tests."
  else
    echo "3. Getting expense details..."
    call_api "GET" "/api/v1/expenses/$EXPENSE_ID" "" "200"
    echo ""

    echo "4. Updating expense..."
    call_api "PUT" "/api/v1/expenses/$EXPENSE_ID" '{"description":"Updated test expense", "amount":1500}' "200"
    echo ""

    echo "5. Getting group expenses..."
    call_api "GET" "/api/v1/groups/$GROUP_ID/expenses" "" "200"
    echo ""
    
    echo "6. Getting expense splits..."
    call_api "GET" "/api/v1/expenses/$EXPENSE_ID/splits" "" "200"
    echo ""
  fi

  echo "7. Getting expense categories..."
  call_api "GET" "/api/v1/expenses/categories" "" "200"
  echo ""
fi

echo "=== Testing Rate Limiting ==="
echo "Making multiple rapid requests to test rate limiting..."
for i in {1..5}; do
  call_api "GET" "/api/v1/expenses" "" "200"
  echo "Request $i completed"
done
echo "Rate limiting headers should be visible in responses"
echo ""

echo "=== Testing Cache Middleware ==="
echo "Making repeated requests to test caching..."
echo "First request (should be cache MISS):"
call_api "GET" "/api/v1/expenses/categories" "" "200"
echo ""

echo "Second request (should be cache HIT):"
call_api "GET" "/api/v1/expenses/categories" "" "200"
echo ""

echo "=== Testing Validation Middleware ==="
echo "Testing with invalid data format..."
call_api "POST" "/api/v1/expenses" '{"amount":"not_a_number", "description":123}' "400"
echo ""

echo "=== Cleanup ==="
if [ ! -z "$EXPENSE_ID" ] && [ "$EXPENSE_ID" != "null" ]; then
  echo "Deleting test expense..."
  call_api "DELETE" "/api/v1/expenses/$EXPENSE_ID" "" "200"
fi

if [ ! -z "$GROUP_ID" ] && [ "$GROUP_ID" != "null" ]; then
  echo "Deleting test group..."
  call_api "DELETE" "/api/v1/groups/$GROUP_ID" "" "200"
fi

if [ ! -z "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "null" ]; then
  echo "Deleting test category..."
  call_api "DELETE" "/api/v1/expenses/categories/$CATEGORY_ID" "" "200"
fi

echo ""
echo "=== Phase 3 Testing Completed ===" 