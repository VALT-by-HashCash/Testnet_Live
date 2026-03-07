# Manual S3 Bucket Creation Guide for testnet.valtdata.com

## Issue
The `vue-deployer` IAM user doesn't have permission to create S3 buckets.

## Solution Options

### Option 1: Use AWS Console (Recommended - Easiest)

1. **Login to AWS Console** with an admin account
   - Go to: https://console.aws.amazon.com/s3/

2. **Create New Bucket**
   - Click "Create bucket"
   - **Bucket name:** `testnet.valtdata.com` (EXACT match)
   - **AWS Region:** `us-east-1`
   - **Object Ownership:** ACLs enabled
   - **Block Public Access:** UNCHECK "Block all public access" ✅
   - Click "Create bucket"

3. **Enable Static Website Hosting**
   - Go to bucket → Properties tab
   - Scroll to "Static website hosting"
   - Click "Edit"
   - Enable: "Static website hosting"
   - Index document: `index.html`
   - Error document: `index.html`
   - Click "Save changes"

4. **Add Bucket Policy**
   - Go to bucket → Permissions tab
   - Scroll to "Bucket policy"
   - Click "Edit"
   - Paste this policy:
   ```json
   {
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
   }
   ```
   - Click "Save changes"

5. **Grant vue-deployer Permissions**
   - Go to IAM Console: https://console.aws.amazon.com/iam/
   - Users → vue-deployer
   - Permissions → Add permissions → Attach policies
   - Search for and attach: `AmazonS3FullAccess` (or create custom policy)
   - Click "Add permissions"

6. **Copy Files from Old Bucket**
   - Run this command:
   ```bash
   aws s3 sync s3://testnet-breadcrumbs-frontend/ s3://testnet.valtdata.com/ \
     --acl public-read \
     --cache-control "max-age=3600"
   ```

---

### Option 2: Use Admin AWS CLI Profile

If you have an admin AWS CLI profile configured:

```bash
# Switch to admin profile
export AWS_PROFILE=admin  # or whatever your admin profile is named

# Create bucket
aws s3api create-bucket \
  --bucket testnet.valtdata.com \
  --region us-east-1

# Unblock public access
aws s3api put-public-access-block \
  --bucket testnet.valtdata.com \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Enable static website hosting
aws s3api put-bucket-website \
  --bucket testnet.valtdata.com \
  --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
  }'

# Add bucket policy
aws s3api put-bucket-policy \
  --bucket testnet.valtdata.com \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::testnet.valtdata.com/*"
    }]
  }'

# Copy files from old bucket
aws s3 sync s3://testnet-breadcrumbs-frontend/ s3://testnet.valtdata.com/ \
  --acl public-read \
  --cache-control "max-age=3600"

# Switch back to vue-deployer profile
export AWS_PROFILE=default  # or unset AWS_PROFILE
```

---

### Option 3: Grant Permissions First (Requires Admin)

**Create IAM Policy (as admin):**

```bash
# Create policy file
cat > s3-testnet-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:DeleteBucket",
                "s3:ListBucket",
                "s3:PutBucketPolicy",
                "s3:GetBucketPolicy",
                "s3:PutBucketWebsite",
                "s3:GetBucketWebsite",
                "s3:PutBucketPublicAccessBlock",
                "s3:GetBucketPublicAccessBlock",
                "s3:PutBucketAcl"
            ],
            "Resource": [
                "arn:aws:s3:::testnet.valtdata.com",
                "arn:aws:s3:::testnet-breadcrumbs-frontend"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::testnet.valtdata.com/*",
                "arn:aws:s3:::testnet-breadcrumbs-frontend/*"
            ]
        }
    ]
}
EOF

# Create and attach policy (as admin)
export AWS_PROFILE=admin
aws iam create-policy \
  --policy-name TestNetS3DeploymentPolicy \
  --policy-document file://s3-testnet-policy.json

# Get your account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Attach to vue-deployer user
aws iam attach-user-policy \
  --user-name vue-deployer \
  --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/TestNetS3DeploymentPolicy"

# Switch back and run migration
export AWS_PROFILE=default
./migrate-to-new-bucket.sh
```

---

## Verification Steps

After creating the bucket and copying files:

1. **Test S3 Website URL:**
   ```bash
   curl -I http://testnet.valtdata.com.s3-website-us-east-1.amazonaws.com
   ```
   Expected: `HTTP/1.1 200 OK`

2. **List Files:**
   ```bash
   aws s3 ls s3://testnet.valtdata.com/ --recursive
   ```

3. **Check in Browser:**
   - Open: http://testnet.valtdata.com.s3-website-us-east-1.amazonaws.com
   - Should see your Vue TestNet dashboard

---

## CloudFlare Configuration Info

Once the bucket is ready, provide these details for CloudFlare setup:

**CNAME Record:**
- Type: `CNAME`
- Name: `testnet` (or `@` for root domain)
- Target: `testnet.valtdata.com.s3-website-us-east-1.amazonaws.com`
- TTL: Auto
- Proxy: Enable (orange cloud) ✅

**Or A Record (if using CloudFlare as proxy):**
- CloudFlare will handle the SSL and proxy to S3

---

## Current Status

- ❌ IAM user `vue-deployer` lacks bucket creation permissions
- ✅ Old bucket exists: `testnet-breadcrumbs-frontend`
- ⏳ New bucket needed: `testnet.valtdata.com`
- ⏳ Files need to be copied after bucket creation

**Recommended Action:** Use AWS Console (Option 1) - it's the fastest and most straightforward method.
