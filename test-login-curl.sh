#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the local server URL
SERVER_URL="http://localhost:5000"
echo -e "${BLUE}Testing login API on $SERVER_URL${NC}"

# Step 1: Test the login API with wakay credentials
echo -e "\n${BLUE}Step 1: Testing login with Wakay credentials...${NC}"
LOGIN_RESPONSE=$(curl -s -c cookies.txt -X POST "$SERVER_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"Wakay","password":"Wakay@123","userType":"player"}')

echo -e "${GREEN}Login Response:${NC}"
echo $LOGIN_RESPONSE | jq . || echo $LOGIN_RESPONSE

# Check if login was successful
if echo $LOGIN_RESPONSE | grep -q "\"success\":true"; then
  echo -e "\n${GREEN}Login successful! Saved cookies to cookies.txt${NC}"
  
  # Step 2: Test user info endpoint
  echo -e "\n${BLUE}Step 2: Testing user info API...${NC}"
  USER_INFO_RESPONSE=$(curl -s -b cookies.txt "$SERVER_URL/api/user/info")
  
  echo -e "${GREEN}User Info Response:${NC}"
  echo $USER_INFO_RESPONSE | jq . || echo $USER_INFO_RESPONSE
else
  echo -e "\n${RED}Login failed. Cannot proceed to test user info.${NC}"
fi

echo -e "\n${BLUE}Test complete.${NC}"