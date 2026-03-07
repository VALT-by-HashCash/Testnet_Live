#!/bin/bash
set -e

# Config
S3_BUCKET="${S3_BUCKET:-breadcrumbs-vue-frontend}"
CLOUDFRONT_ID="${CLOUDFRONT_ID:-}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://breadcrumbsdata.com}"

echo "🚀 Deploying to S3..."
echo "🔗 API: $VITE_API_BASE_URL"

# Build
VITE_API_BASE_URL=$VITE_API_BASE_URL npm run build:production

# Upload to S3
aws s3 sync dist/ s3://$S3_BUCKET/ --delete

# Invalidate CloudFront (if set)
[ -n "$CLOUDFRONT_ID" ] && aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"

echo "✅ Deployed to http://$S3_BUCKET.s3-website-us-east-1.amazonaws.com"
