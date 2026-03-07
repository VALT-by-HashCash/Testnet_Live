#!/bin/bash
set -e

echo "🔐 Applying bucket policy to testnet.valtdata.com"
echo "================================================"

BUCKET="testnet.valtdata.com"
POLICY_FILE="/Users/jeffreykartchner/Breadcrumbs/vue-frontend/bucket-policy.json"

# Check if bucket exists
echo ""
echo "🔍 Checking if bucket exists..."
if ! aws s3 ls s3://$BUCKET 2>/dev/null; then
    echo "❌ Error: Bucket '$BUCKET' does not exist"
    echo "Please create the bucket first in AWS Console"
    exit 1
fi

echo "✅ Bucket exists"

# Apply bucket policy
echo ""
echo "📝 Applying bucket policy..."
aws s3api put-bucket-policy \
  --bucket $BUCKET \
  --policy file://$POLICY_FILE

echo "✅ Bucket policy applied successfully!"

# Verify the policy
echo ""
echo "🔍 Verifying bucket policy..."
aws s3api get-bucket-policy --bucket $BUCKET --query Policy --output text | python3 -m json.tool

echo ""
echo "================================================"
echo "✅ Policy Applied Successfully!"
echo "================================================"
echo ""
echo "🎯 Your bucket is now publicly readable!"
echo "🔗 Test it: http://$BUCKET.s3-website-us-east-1.amazonaws.com"
echo ""
