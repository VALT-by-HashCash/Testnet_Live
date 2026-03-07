#!/bin/bash
set -e

echo "🚀 Migrating TestNet Frontend to new S3 bucket: testnet.valtdata.com"
echo "================================================================="

# Configuration
OLD_BUCKET="testnet-breadcrumbs-frontend"
NEW_BUCKET="testnet.valtdata.com"
REGION="us-east-1"

# Step 1: Create the new bucket
echo ""
echo "📦 Step 1: Creating new bucket: $NEW_BUCKET"
# For us-east-1, don't specify LocationConstraint
if [ "$REGION" = "us-east-1" ]; then
  aws s3api create-bucket \
    --bucket $NEW_BUCKET \
    --region $REGION
else
  aws s3api create-bucket \
    --bucket $NEW_BUCKET \
    --region $REGION \
    --create-bucket-configuration LocationConstraint=$REGION
fi

echo "✅ Bucket created successfully"

# Step 2: Unblock public access
echo ""
echo "🔓 Step 2: Unblocking public access on new bucket"
aws s3api put-public-access-block \
  --bucket $NEW_BUCKET \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo "✅ Public access unblocked"

# Step 3: Enable static website hosting
echo ""
echo "🌐 Step 3: Enabling static website hosting"
aws s3api put-bucket-website \
  --bucket $NEW_BUCKET \
  --website-configuration '{
    "IndexDocument": {
      "Suffix": "index.html"
    },
    "ErrorDocument": {
      "Key": "index.html"
    }
  }'

echo "✅ Static website hosting enabled"

# Step 4: Add bucket policy for public read
echo ""
echo "🔐 Step 4: Adding public read bucket policy"
aws s3api put-bucket-policy \
  --bucket $NEW_BUCKET \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::testnet.valtdata.com/*"
        }
    ]
}'

echo "✅ Bucket policy applied"

# Step 5: Copy files from old bucket to new bucket
echo ""
echo "📋 Step 5: Copying files from old bucket to new bucket"
echo "Source: s3://$OLD_BUCKET/"
echo "Destination: s3://$NEW_BUCKET/"

aws s3 sync s3://$OLD_BUCKET/ s3://$NEW_BUCKET/ \
  --acl public-read \
  --cache-control "max-age=3600"

echo "✅ Files copied successfully"

# Step 6: Verify the files
echo ""
echo "🔍 Step 6: Verifying files in new bucket"
FILE_COUNT=$(aws s3 ls s3://$NEW_BUCKET/ --recursive | wc -l)
echo "Total files in new bucket: $FILE_COUNT"

# Step 7: Get the website endpoint
echo ""
echo "🌐 Step 7: Getting website endpoint"
WEBSITE_ENDPOINT=$(aws s3api get-bucket-website --bucket $NEW_BUCKET --query 'WebsiteEndpoint' --output text 2>/dev/null || echo "http://$NEW_BUCKET.s3-website-$REGION.amazonaws.com")

echo ""
echo "================================================================="
echo "✅ Migration Complete!"
echo "================================================================="
echo ""
echo "📊 Summary:"
echo "  • Old Bucket: s3://$OLD_BUCKET"
echo "  • New Bucket: s3://$NEW_BUCKET"
echo "  • Region: $REGION"
echo "  • Files Migrated: $FILE_COUNT"
echo ""
echo "🔗 Access URLs:"
echo "  • S3 Website: http://$NEW_BUCKET.s3-website-$REGION.amazonaws.com"
echo "  • S3 Direct: https://$NEW_BUCKET.s3.amazonaws.com/index.html"
echo ""
echo "🎯 Next Steps:"
echo "  1. Test the new S3 URL: http://$NEW_BUCKET.s3-website-$REGION.amazonaws.com"
echo "  2. ✅ Let your team know this is ready for CloudFlare configuration"
echo "  3. After CloudFlare is configured, you can delete the old bucket"
echo ""
echo "📝 CloudFlare Configuration Info:"
echo "  • CNAME Name: testnet"
echo "  • CNAME Target: $NEW_BUCKET.s3-website-$REGION.amazonaws.com"
echo "  • Or use Custom Domain: testnet.valtdata.com"
echo ""
echo "🧪 Quick Test:"
echo "  curl -I http://$NEW_BUCKET.s3-website-$REGION.amazonaws.com"
echo ""
