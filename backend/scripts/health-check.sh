#!/bin/bash
# Health check script for Vasanthy Designers
# Usage: ./scripts/health-check.sh [url]

URL="${1:-http://localhost:3000/health}"

echo "Checking health at $URL..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$RESPONSE" = "200" ]; then
    echo "Health check passed (HTTP $RESPONSE)"
    exit 0
else
    echo "Health check failed (HTTP $RESPONSE)"
    exit 1
fi
