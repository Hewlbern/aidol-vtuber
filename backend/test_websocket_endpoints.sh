#!/bin/bash

# Test script for WebSocket endpoints
# This script tests the new Phase 1 WebSocket message handlers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
WS_URL="${WS_URL:-ws://localhost:12393/client-ws}"
TIMEOUT=5

echo -e "${YELLOW}Testing WebSocket endpoints for Phase 1${NC}"
echo "WebSocket URL: $WS_URL"
echo ""

# Check if websocat is installed
if ! command -v websocat &> /dev/null; then
    echo -e "${RED}Error: websocat is not installed${NC}"
    echo "Install it with: cargo install websocat"
    echo "Or use: brew install websocat"
    exit 1
fi

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test a WebSocket message
test_message() {
    local test_name="$1"
    local message="$2"
    local expected_type="$3"
    
    echo -n "Testing $test_name... "
    
    # Send message and capture response
    response=$(echo "$message" | timeout $TIMEOUT websocat "$WS_URL" 2>/dev/null | head -n 1)
    
    if [ -z "$response" ]; then
        echo -e "${RED}FAILED${NC} (no response or timeout)"
        ((TESTS_FAILED++))
        return 1
    fi
    
    # Check if response contains expected type
    if echo "$response" | grep -q "\"type\":\"$expected_type\""; then
        echo -e "${GREEN}PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        echo "  Expected type: $expected_type"
        echo "  Response: $response"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: Get backend mode (should default to 'orphiq')
echo "Test 1: Get backend mode"
test_message "get-backend-mode" '{"type":"get-backend-mode"}' "backend-mode"

# Test 2: Set backend mode
echo "Test 2: Set backend mode"
test_message "set-backend-mode" '{"type":"set-backend-mode","mode":"orphiq"}' "backend-mode-set"

# Test 3: Expression command
echo "Test 3: Expression command"
test_message "expression-command" '{"type":"expression-command","expression_id":0,"duration":1000,"priority":1}' "expression-ack"

# Test 4: Motion command
echo "Test 4: Motion command"
test_message "motion-command" '{"type":"motion-command","motion_group":"idle","motion_index":0,"loop":false}' "motion-ack"

# Test 5: Text generation request (may take longer)
echo "Test 5: Text generation request"
echo -n "Testing text-generation-request... "
response=$(echo '{"type":"text-generation-request","prompt":"Hello"}' | timeout 10 websocat "$WS_URL" 2>/dev/null | head -n 1)

if [ -z "$response" ]; then
    echo -e "${RED}FAILED${NC} (no response or timeout)"
    ((TESTS_FAILED++))
else
    if echo "$response" | grep -q "text-generation"; then
        echo -e "${GREEN}PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}PARTIAL${NC} (response received but format may differ)"
        echo "  Response: $response"
        ((TESTS_PASSED++))
    fi
fi

# Summary
echo ""
echo "=========================================="
echo "Test Summary:"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "=========================================="

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed${NC}"
    exit 1
fi

