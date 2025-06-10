#!/bin/bash

# OWASP ZAP Security Scanning Script
# This script runs automated security scans against the AuthCakes API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
REPORT_DIR="security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_PATH="${REPORT_DIR}/zap-report-${TIMESTAMP}"

# Create report directory
mkdir -p "${REPORT_DIR}"

echo -e "${GREEN}Starting OWASP ZAP Security Scan...${NC}"
echo "Target: ${API_URL}"
echo "Report: ${REPORT_PATH}"

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
}

# Function to run baseline scan
run_baseline_scan() {
    echo -e "${YELLOW}Running baseline scan...${NC}"
    
    docker run --rm \
        --network="host" \
        -v "$(pwd)/${REPORT_DIR}:/zap/reports:rw" \
        -t owasp/zap2docker-stable \
        zap-baseline.py \
        -t "${API_URL}" \
        -r "/zap/reports/zap-report-${TIMESTAMP}-baseline.html" \
        -w "/zap/reports/zap-report-${TIMESTAMP}-baseline.md" \
        -J "/zap/reports/zap-report-${TIMESTAMP}-baseline.json" \
        -x "/zap/reports/zap-report-${TIMESTAMP}-baseline.xml" \
        --hook=/zap/auth-hook.py \
        -z "auth.loginurl=${API_URL}/api/v1/auth/login \
            auth.username_field=email \
            auth.password_field=password \
            auth.username=test@example.com \
            auth.password=TestPassword123!"
}

# Function to run API scan with OpenAPI spec
run_api_scan() {
    echo -e "${YELLOW}Running API scan with OpenAPI specification...${NC}"
    
    # Check if OpenAPI spec exists
    if [ -f "openapi.json" ]; then
        docker run --rm \
            --network="host" \
            -v "$(pwd):/zap/wrk:rw" \
            -v "$(pwd)/${REPORT_DIR}:/zap/reports:rw" \
            -t owasp/zap2docker-stable \
            zap-api-scan.py \
            -t "/zap/wrk/openapi.json" \
            -f openapi \
            -r "/zap/reports/zap-report-${TIMESTAMP}-api.html" \
            -w "/zap/reports/zap-report-${TIMESTAMP}-api.md" \
            -J "/zap/reports/zap-report-${TIMESTAMP}-api.json" \
            -x "/zap/reports/zap-report-${TIMESTAMP}-api.xml" \
            -z "replacer.full_list(0).description=auth \
                replacer.full_list(0).enabled=true \
                replacer.full_list(0).matchtype=REQ_HEADER \
                replacer.full_list(0).matchstr=Authorization \
                replacer.full_list(0).regex=false \
                replacer.full_list(0).replacement=Bearer YOUR_TOKEN_HERE"
    else
        echo -e "${YELLOW}OpenAPI specification not found. Skipping API scan.${NC}"
    fi
}

# Function to run full scan (more intensive)
run_full_scan() {
    echo -e "${YELLOW}Running full scan (this may take a while)...${NC}"
    
    docker run --rm \
        --network="host" \
        -v "$(pwd)/${REPORT_DIR}:/zap/reports:rw" \
        -t owasp/zap2docker-stable \
        zap-full-scan.py \
        -t "${API_URL}" \
        -r "/zap/reports/zap-report-${TIMESTAMP}-full.html" \
        -w "/zap/reports/zap-report-${TIMESTAMP}-full.md" \
        -J "/zap/reports/zap-report-${TIMESTAMP}-full.json" \
        -x "/zap/reports/zap-report-${TIMESTAMP}-full.xml" \
        -n "/zap/wrk/contexts/authcakes.context" \
        -U "test@example.com" \
        -z "auth.loginurl=${API_URL}/api/v1/auth/login \
            auth.username_field=email \
            auth.password_field=password \
            auth.auto=1"
}

# Function to analyze results
analyze_results() {
    echo -e "${GREEN}Analyzing scan results...${NC}"
    
    if [ -f "${REPORT_DIR}/zap-report-${TIMESTAMP}-baseline.json" ]; then
        # Count alerts by risk level
        HIGH=$(jq '[.site[].alerts[] | select(.riskcode == "3")] | length' "${REPORT_DIR}/zap-report-${TIMESTAMP}-baseline.json" 2>/dev/null || echo 0)
        MEDIUM=$(jq '[.site[].alerts[] | select(.riskcode == "2")] | length' "${REPORT_DIR}/zap-report-${TIMESTAMP}-baseline.json" 2>/dev/null || echo 0)
        LOW=$(jq '[.site[].alerts[] | select(.riskcode == "1")] | length' "${REPORT_DIR}/zap-report-${TIMESTAMP}-baseline.json" 2>/dev/null || echo 0)
        INFO=$(jq '[.site[].alerts[] | select(.riskcode == "0")] | length' "${REPORT_DIR}/zap-report-${TIMESTAMP}-baseline.json" 2>/dev/null || echo 0)
        
        echo -e "\n${GREEN}Scan Summary:${NC}"
        echo -e "${RED}High Risk: ${HIGH}${NC}"
        echo -e "${YELLOW}Medium Risk: ${MEDIUM}${NC}"
        echo -e "${YELLOW}Low Risk: ${LOW}${NC}"
        echo -e "Informational: ${INFO}"
        
        # Fail if high-risk vulnerabilities found
        if [ "$HIGH" -gt 0 ]; then
            echo -e "\n${RED}⚠️  High-risk vulnerabilities detected! Please review the reports.${NC}"
            exit 1
        fi
    fi
}

# Function to generate consolidated report
generate_consolidated_report() {
    echo -e "${GREEN}Generating consolidated security report...${NC}"
    
    cat > "${REPORT_DIR}/security-scan-summary-${TIMESTAMP}.md" << EOF
# Security Scan Summary
Date: $(date)
Target: ${API_URL}

## Scan Types Performed
- Baseline Scan
- API Scan (if OpenAPI spec available)
- Full Scan (if requested)

## Results
See individual reports for detailed findings:
- Baseline: zap-report-${TIMESTAMP}-baseline.html
- API: zap-report-${TIMESTAMP}-api.html
- Full: zap-report-${TIMESTAMP}-full.html

## Common Security Headers Check
EOF

    # Check security headers
    curl -s -I "${API_URL}/api/v1/health" | grep -E "X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Content-Security-Policy|Strict-Transport-Security" >> "${REPORT_DIR}/security-scan-summary-${TIMESTAMP}.md" || echo "No security headers found" >> "${REPORT_DIR}/security-scan-summary-${TIMESTAMP}.md"
}

# Main execution
main() {
    check_docker
    
    # Parse command line arguments
    SCAN_TYPE="${1:-baseline}"
    
    case $SCAN_TYPE in
        baseline)
            run_baseline_scan
            ;;
        api)
            run_api_scan
            ;;
        full)
            run_full_scan
            ;;
        all)
            run_baseline_scan
            run_api_scan
            run_full_scan
            ;;
        *)
            echo "Usage: $0 [baseline|api|full|all]"
            exit 1
            ;;
    esac
    
    analyze_results
    generate_consolidated_report
    
    echo -e "\n${GREEN}✅ Security scan completed!${NC}"
    echo "Reports available in: ${REPORT_DIR}/"
}

# Create auth hook for ZAP
create_auth_hook() {
    cat > auth-hook.py << 'EOF'
def authenticate(helper, paramsValues, credentials):
    """Custom authentication script for AuthCakes API"""
    import json
    
    login_url = paramsValues.get("auth.loginurl")
    username = credentials.get("username")
    password = credentials.get("password")
    
    # Prepare login request
    login_data = json.dumps({
        "email": username,
        "password": password
    })
    
    # Send login request
    msg = helper.prepareMessage()
    msg.setRequestHeader("POST " + login_url + " HTTP/1.1")
    msg.setRequestHeader("Content-Type: application/json")
    msg.setRequestHeader("Content-Length: " + str(len(login_data)))
    msg.setRequestBody(login_data)
    
    helper.sendAndReceive(msg)
    
    # Extract token from response
    response_body = msg.getResponseBody().toString()
    response_json = json.loads(response_body)
    
    if response_json.get("success") and response_json.get("data"):
        token = response_json["data"].get("accessToken")
        if token:
            # Set authentication token
            helper.getHttpSender().setAuthenticationCredentials(
                "Bearer " + token
            )
            return True
    
    return False
EOF
}

# Run main function
main "$@"