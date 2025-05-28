#!/bin/bash

# Flux Expense API Testing Script Runner
# This script sets up the environment and runs the expense endpoint tests

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "=========================================="
echo "   FLUX EXPENSE API TEST SUITE RUNNER    "
echo "=========================================="
echo -e "${NC}"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${RED}Error: bun is not installed. Please install bun first.${NC}"
    exit 1
fi

# Set environment variables for testing
export TEST_USER_ID="55ac3c0f-147e-4888-8888-618acc0d3333"
export TEST_USERNAME="test.user@flux.app"
export API_URL="http://localhost:3002"
export USE_MOCKS="true"

# Check if the server is running
echo -e "${YELLOW}Checking if API server is running...${NC}"
curl -s "http://localhost:3002/api/health" > /dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: API server is not running at ${API_URL}${NC}"
    echo -e "${YELLOW}Would you like to start the server? (y/n)${NC}"
    read -r start_server
    if [[ "$start_server" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Starting API server...${NC}"
        bun run dev --port 3002 &
        SERVER_PID=$!
        echo -e "${YELLOW}Waiting for server to start...${NC}"
        sleep 5
        
        # Check again if server is running
        curl -s "http://localhost:3002/api/health" > /dev/null
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error: Failed to start API server.${NC}"
            kill $SERVER_PID 2>/dev/null
            exit 1
        fi
        echo -e "${GREEN}Server started successfully!${NC}"
    else
        echo -e "${YELLOW}Please start the server manually and try again.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}API server is running!${NC}"
fi

# Generate a test JWT token if needed
echo -e "${YELLOW}Generating test JWT token...${NC}"
node scripts/utils/test-auth.js

# Run the expense endpoint tests
echo -e "${YELLOW}Running expense endpoint tests...${NC}"
node scripts/test-expense-endpoints.js

TEST_RESULT=$?

# Show result
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "\n${GREEN}All expense API tests passed!${NC}"
else
    echo -e "\n${RED}Some expense API tests failed.${NC}"
fi

# If we started the server, ask if we should stop it
if [ -n "$SERVER_PID" ]; then
    echo -e "${YELLOW}Would you like to stop the API server? (y/n)${NC}"
    read -r stop_server
    if [[ "$stop_server" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Stopping API server...${NC}"
        kill $SERVER_PID
        echo -e "${GREEN}Server stopped.${NC}"
    else
        echo -e "${YELLOW}Server is still running with PID ${SERVER_PID}.${NC}"
        echo -e "${YELLOW}Stop it manually with: kill ${SERVER_PID}${NC}"
    fi
fi

exit $TEST_RESULT 