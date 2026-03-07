#!/bin/bash
set -e

echo "🔐 Setting up IAM permissions for vue-deployer user"
echo "=================================================="

IAM_USER="vue-deployer"
POLICY_NAME="S3BucketManagementPolicy"
NEW_BUCKET="testnet.valtdata.com"

# Create IAM policy for bucket creation and management
echo ""
echo "📝 Step 1: Creating IAM policy for S3 bucket management"

cat > /tmp/s3-bucket-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowBucketCreation",
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:DeleteBucket",
                "s3:ListBucket",
                "s3:PutBucketPolicy",
                "s3:GetBucketPolicy",
                "s3:DeleteBucketPolicy",
                "s3:PutBucketWebsite",
                "s3:GetBucketWebsite",
                "s3:DeleteBucketWebsite",
                "s3:PutBucketPublicAccessBlock",
                "s3:GetBucketPublicAccessBlock",
                "s3:PutBucketAcl",
                "s3:GetBucketAcl"
            ],
            "Resource": [
                "arn:aws:s3:::testnet.valtdata.com",
                "arn:aws:s3:::testnet-breadcrumbs-frontend"
            ]
        },
        {
            "Sid": "AllowObjectOperations",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl",
                "s3:GetObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::testnet.valtdata.com/*",
                "arn:aws:s3:::testnet-breadcrumbs-frontend/*"
            ]
        },
        {
            "Sid": "AllowListAllBuckets",
            "Effect": "Allow",
            "Action": [
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation"
            ],
            "Resource": "*"
        }
    ]
}
EOF

echo "✅ Policy document created"

# Attach policy to user
echo ""
echo "🔗 Step 2: Attaching policy to user: $IAM_USER"

# First, try to create the policy
aws iam create-policy \
  --policy-name $POLICY_NAME \
  --policy-document file:///tmp/s3-bucket-policy.json \
  --description "Allows S3 bucket creation and management for TestNet deployment" 2>/dev/null || {
    echo "⚠️  Policy already exists, continuing..."
  }

# Get the policy ARN
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

# Attach the policy to the user
aws iam attach-user-policy \
  --user-name $IAM_USER \
  --policy-arn $POLICY_ARN 2>/dev/null || {
    echo "⚠️  Policy may already be attached"
  }

echo "✅ Policy attached successfully"

# Verify permissions
echo ""
echo "🔍 Step 3: Verifying current user permissions"
aws iam list-attached-user-policies --user-name $IAM_USER

echo ""
echo "=================================================="
echo "✅ IAM Setup Complete!"
echo "=================================================="
echo ""
echo "📝 Policy Details:"
echo "  • Policy Name: $POLICY_NAME"
echo "  • Policy ARN: $POLICY_ARN"
echo "  • User: $IAM_USER"
echo ""
echo "🎯 Next Steps:"
echo "  1. Wait 5-10 seconds for IAM changes to propagate"
echo "  2. Run the migration script: ./migrate-to-new-bucket.sh"
echo ""

# Cleanup temp file
rm /tmp/s3-bucket-policy.json
