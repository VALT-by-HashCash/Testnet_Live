#!/bin/bash
set -e

echo "📦 Copying files to testnet.valtdata.com bucket"
echo "=============================================="

OLD_BUCKET="testnet-breadcrumbs-frontend"
NEW_BUCKET="testnet.valtdata.com"

# Check if new bucket exists
echo ""
echo "🔍 Checking if new bucket exists..."
if aws s3 ls s3://$NEW_BUCKET 2>/dev/null; then
    echo "✅ Bucket exists!"
else
    echo "❌ Error: Bucket '$NEW_BUCKET' does not exist yet"
    echo ""
    echo "Please create the bucket first using AWS Console or admin credentials."
    echo "See BUCKET_CREATION_GUIDE.md for instructions."
    exit 1
fi

# Copy files
echo ""
echo "📋 Copying files from old bucket to new bucket..."
echo "Source: s3://$OLD_BUCKET/"
echo "Destination: s3://$NEW_BUCKET/"

aws s3 sync s3://$OLD_BUCKET/ s3://$NEW_BUCKET/ \
  --acl public-read \
  --cache-control "max-age=3600" \
  --delete

echo ""
echo "✅ Files copied successfully!"

# Verify
echo ""
echo "🔍 Verifying files in new bucket..."
FILE_COUNT=$(aws s3 ls s3://$NEW_BUCKET/ --recursive | wc -l | tr -d ' ')
echo "Total files in new bucket: $FILE_COUNT"

echo ""
echo "📊 File listing:"
aws s3 ls s3://$NEW_BUCKET/ --recursive --human-readable --summarize | tail -20

echo ""
echo "=============================================="
echo "✅ Copy Complete!"
echo "=============================================="
echo ""
echo "🔗 S3 Website URL:"
echo "  http://$NEW_BUCKET.s3-website-us-east-1.amazonaws.com"
echo ""
echo "🧪 Test it:"
echo "  curl -I http://$NEW_BUCKET.s3-website-us-east-1.amazonaws.com"
echo ""
echo "🎯 Ready for CloudFlare configuration!"
echo ""
