#!/bin/bash

# API E2E Test Runner
# This script allows running API tests against different environments

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-local}
API_BASE_URL=""
API_PREFIX="/api"

# Set configuration based on environment
case $ENVIRONMENT in
  local)
    API_BASE_URL="http://localhost:3030"
    echo -e "${GREEN}Running tests against LOCAL environment${NC}"
    ;;
  staging)
    API_BASE_URL=${STAGING_URL:-"https://api.staging.authcakes.com"}
    echo -e "${YELLOW}Running tests against STAGING environment${NC}"
    ;;
  production)
    echo -e "${RED}WARNING: Running tests against PRODUCTION environment${NC}"
    read -p "Are you sure you want to run tests against production? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      echo "Aborted."
      exit 1
    fi
    API_BASE_URL=${PRODUCTION_URL:-"https://api.authcakes.com"}
    ;;
  custom)
    if [ -z "$API_BASE_URL" ]; then
      echo -e "${RED}Error: API_BASE_URL must be set for custom environment${NC}"
      exit 1
    fi
    echo -e "${YELLOW}Running tests against CUSTOM environment: $API_BASE_URL${NC}"
    ;;
  *)
    echo -e "${RED}Unknown environment: $ENVIRONMENT${NC}"
    echo "Usage: $0 [local|staging|production|custom]"
    echo "For custom environment, set API_BASE_URL environment variable"
    exit 1
    ;;
esac

# Export environment variables
export API_BASE_URL
export API_PREFIX
export API_DEBUG=${API_DEBUG:-false}
export API_TIMEOUT=${API_TIMEOUT:-30000}

# Show configuration
echo "Configuration:"
echo "  API_BASE_URL: $API_BASE_URL"
echo "  API_PREFIX: $API_PREFIX"
echo "  API_DEBUG: $API_DEBUG"
echo "  API_TIMEOUT: $API_TIMEOUT"
echo ""

# Check if specific test file is provided
TEST_FILE=${2:-"test/e2e/auth-api-basic.e2e-spec.ts"}

# Run the tests
echo "Running API tests..."
NODE_ENV=test npm run test:e2e -- "$TEST_FILE"

# Capture exit code
EXIT_CODE=$?

# Show result
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ API tests passed!${NC}"
else
  echo -e "${RED}❌ API tests failed!${NC}"
fi

exit $EXIT_CODE