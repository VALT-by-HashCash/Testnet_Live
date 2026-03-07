# AWS S3 Deployment

Quick guide to deploy Vue frontend to AWS S3.

## Prerequisites

- AWS CLI installed: `aws --version`
- AWS credentials configured: `aws configure`
- Node.js & npm installed

## Quick Start

### 1. Setup Infrastructure (One-time)

```bash
cd /Users/jeffreykartchner/Breadcrumbs
./scripts/setup-s3-frontend.sh
```

### 2. Deploy

```bash
cd vue-frontend
./deploy-s3.sh
```

## CloudFront Setup (Optional)

For custom domain (app.breadcrumbsdata.com) with HTTPS:

1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront)
2. Create distribution:
   - **Origin**: breadcrumbs-vue-frontend.s3-website-us-east-1.amazonaws.com
   - **Protocol**: HTTP Only
   - **CNAME**: app.breadcrumbsdata.com
   - **SSL**: Request ACM certificate for your domain
   - **Default Root**: index.html
   - **Error Pages**: 403 → /index.html (200)
3. Save Distribution ID
4. Set env var: `export CLOUDFRONT_ID=<your-id>`
5. Update Route 53 DNS A record → CloudFront alias

## Environment Variables

```bash
# Optional - for cache invalidation
export CLOUDFRONT_ID=E1234567890ABC
```

## URLs

- **S3 Website**: http://breadcrumbs-vue-frontend.s3-website-us-east-1.amazonaws.com
- **CloudFront**: https://app.breadcrumbsdata.com (after setup)

## Troubleshooting

- **403 errors**: Check S3 bucket policy allows public read
- **Build fails**: Run `npm install` first
- **Stale cache**: Invalidate CloudFront or wait 5-10 minutes
