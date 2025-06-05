#!/bin/bash

# Test runner script for organized E2E tests
# Usage: ./run-tests-by-category.sh [category] [test-file]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AuthCakes E2E Test Runner${NC}"
echo "======================================"

# Function to display usage
show_usage() {
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./run-tests-by-category.sh [category] [optional: specific-test-file]"
    echo ""
    echo -e "${YELLOW}Categories:${NC}"
    echo "  api       - Frontend-focused API tests"
    echo "  core      - Backend core authentication tests"
    echo "  tenant    - Multi-tenant system tests"
    echo "  system    - System-level and infrastructure tests"
    echo "  all       - Run all organized tests"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./run-tests-by-category.sh api"
    echo "  ./run-tests-by-category.sh core auth-recovery.e2e-spec.ts"
    echo "  ./run-tests-by-category.sh all"
    echo ""
}

# Function to run tests in a category
run_category_tests() {
    local category=$1
    local test_file=$2
    local category_path=""
    local category_name=""
    
    case $category in
        "api")
            category_path="test/e2e/types/auth-api-tests"
            category_name="Auth API Tests (Frontend-focused)"
            ;;
        "core")
            category_path="test/e2e/types/auth-core-tests"
            category_name="Auth Core Tests (Backend-focused)"
            ;;
        "tenant")
            category_path="test/e2e/types/tenant-tests"
            category_name="Tenant System Tests"
            ;;
        "system")
            category_path="test/e2e/types/system-tests"
            category_name="System Infrastructure Tests"
            ;;
        *)
            echo -e "${RED}Error: Unknown category '$category'${NC}"
            show_usage
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}Running: $category_name${NC}"
    echo "Path: $category_path"
    
    if [ -n "$test_file" ]; then
        echo "Test: $test_file"
        echo "--------------------------------------"
        npm run test:e2e -- "$category_path/$test_file"
    else
        echo "--------------------------------------"
        npm run test:e2e -- "$category_path"
    fi
}

# Function to run all organized tests
run_all_tests() {
    echo -e "${GREEN}Running all organized E2E tests${NC}"
    echo "======================================"
    
    echo -e "\n${BLUE}1. API Tests (Frontend-focused)${NC}"
    npm run test:e2e -- test/e2e/types/auth-api-tests
    
    echo -e "\n${BLUE}2. Core Tests (Backend-focused)${NC}"
    npm run test:e2e -- test/e2e/types/auth-core-tests
    
    echo -e "\n${BLUE}3. Tenant Tests${NC}"
    npm run test:e2e -- test/e2e/types/tenant-tests
    
    echo -e "\n${BLUE}4. System Tests${NC}"
    npm run test:e2e -- test/e2e/types/system-tests
}

# Main execution
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

if [ "$1" == "all" ]; then
    run_all_tests
else
    run_category_tests "$1" "$2"
fi