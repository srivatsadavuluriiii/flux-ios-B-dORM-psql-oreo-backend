#!/bin/bash

# Generate a test token
echo "Generating test token..."
TEST_TOKEN=$(bun run scripts/generate-test-token.js)
echo "Token: $TEST_TOKEN"

# Test the health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:3001/api/health | jq .

# Test the groups endpoint
echo "Testing groups endpoint..."
curl -s -H "Authorization: Bearer $TEST_TOKEN" http://localhost:3001/api/v1/groups | jq .

# Test the expenses endpoint
echo "Testing expenses endpoint..."
curl -s -H "Authorization: Bearer $TEST_TOKEN" http://localhost:3001/api/v1/expenses | jq .

# Test the expenses categories endpoint
echo "Testing expense categories endpoint..."
curl -s -H "Authorization: Bearer $TEST_TOKEN" http://localhost:3001/api/v1/expenses/categories | jq . 