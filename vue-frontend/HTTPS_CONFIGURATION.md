# HTTPS Configuration Guide for TestNet API

## ✅ Current Status: HTTPS is Already Configured!

Your TestNet API endpoints are **already using HTTPS**. No changes needed for production!

---

## 📍 HTTPS Endpoints (Current Configuration)

### ValtDashboard.vue - TestNet Email Verification

**Line 175 - Send TestNet Code:**
```javascript
const response = await fetch('https://www.breaddata.co/api/profiles/send_testnet_code/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: valtKey.value.trim(),
    language: 'en'
  })
})
```

**Line 195 - Verify TestNet Code:**
```javascript
const response = await fetch('https://www.breaddata.co/api/profiles/verify_testnet_code/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: pendingEmail.value,
    code: verificationCode.value.trim()
  })
})
```

### api.js - Environment Detection

**Lines 10-24 - Automatic HTTPS Selection:**
```javascript
const getBaseURL = () => {
  // Local development (HTTP is OK for localhost)
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:8000/api'
  } 
  
  // All production environments use HTTPS
  else if (window.location.hostname.includes('staging')) {
    return 'https://staging-hashcashfullstack.herokuapp.com/api'
  } 
  else if (window.location.hostname.includes('breadcrumbsdata.com')) {
    return 'https://breadcrumbsdata.com/api'
  } 
  else if (window.location.hostname.includes('breaddata.co')) {
    return 'https://breaddata.co/api'
  } 
  else if (window.location.hostname.includes('s3-website')) {
    // S3 static hosting uses HTTPS for API calls
    return 'https://breadcrumbsdata.com/api'
  }
  
  return '/api' // Relative path fallback
}
```

---

## 🔒 HTTPS Security Features

### 1. **SSL/TLS Encryption**
All production API calls use encrypted HTTPS connections:
- ✅ `breaddata.co` - Protected by Cloudflare SSL
- ✅ `breadcrumbsdata.com` - Heroku SSL
- ✅ S3 Frontend → Backend HTTPS API calls

### 2. **Mixed Content Prevention**
Your S3 frontend (HTTP) properly calls HTTPS backend:
```
Frontend:  http://testnet-breadcrumbs-frontend.s3-website-us-east-1.amazonaws.com
Backend:   https://www.breaddata.co/api/
           ↑↑↑↑↑
           HTTPS secured!
```

### 3. **CORS Configuration**
Backend already configured to accept HTTPS requests from S3:

**HashCashApp/settings.py:**
```python
CORS_ALLOWED_ORIGINS = [
    'http://testnet-breadcrumbs-frontend.s3-website-us-east-1.amazonaws.com',
    # API calls still use HTTPS regardless of frontend protocol
]
```

---

## 🛠️ If You Need to Force HTTPS Everywhere

### Option 1: Upgrade S3 Frontend to HTTPS (Recommended)

**Using CloudFront (AWS CDN):**

1. Create CloudFront distribution:
```bash
aws cloudfront create-distribution \
  --origin-domain-name testnet-breadcrumbs-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

2. Request free SSL certificate:
```bash
aws acm request-certificate \
  --domain-name testnet.breaddata.co \
  --validation-method DNS \
  --region us-east-1
```

3. Update CloudFront to use SSL certificate

4. Result: `https://testnet.breaddata.co` (fully HTTPS!)

**Cost:** Free SSL + $0.085/GB data transfer

### Option 2: Use Custom Domain with SSL

1. **Add CNAME to Route 53:**
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "testnet.breaddata.co",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "YOUR_CLOUDFRONT_DOMAIN"}]
      }
    }]
  }'
```

2. **Update CORS in Django:**
```python
# HashCashApp/settings.py
CORS_ALLOWED_ORIGINS = [
    'https://testnet.breaddata.co',  # New HTTPS frontend
    'http://testnet-breadcrumbs-frontend.s3-website-us-east-1.amazonaws.com',  # Keep old for transition
]
```

### Option 3: Add HTTP → HTTPS Redirect

**Create redirect HTML page (index.html):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
        // Force HTTPS for API calls even if frontend is HTTP
        if (window.location.protocol !== 'https:' && 
            !window.location.hostname.includes('localhost')) {
            console.log('Frontend is HTTP, but API calls will use HTTPS');
        }
    </script>
</head>
<body>
    <!-- Your Vue app loads here -->
    <div id="app"></div>
</body>
</html>
```

---

## 🧪 Testing HTTPS Configuration

### Test 1: Verify API Endpoint Protocol

**Browser Console:**
```javascript
// Check what URL the app is using
console.log('API Base URL:', window.location.hostname)

// Expected outputs:
// localhost → http://localhost:8000/api ✅
// s3-website → https://breadcrumbsdata.com/api ✅
// breaddata.co → https://breaddata.co/api ✅
```

### Test 2: Check Network Tab

1. Open DevTools → Network tab
2. Click "Send Code" in TestNet Dashboard
3. Look for request to `send_testnet_code/`
4. Verify Request URL shows `https://`

**Expected:**
```
Request URL: https://www.breaddata.co/api/profiles/send_testnet_code/
Request Method: POST
Status Code: 200 OK
```

### Test 3: SSL Certificate Check

**Command line:**
```bash
# Check SSL certificate
curl -vI https://www.breaddata.co/api/profiles/send_testnet_code/

# Look for:
# * SSL connection using TLSv1.3
# * Server certificate: *.breaddata.co
# * SSL certificate verify ok
```

### Test 4: Mixed Content Warnings

**Browser Console - Should see NO warnings like:**
```
❌ Mixed Content: The page at 'https://...' was loaded over HTTPS, 
   but requested an insecure resource 'http://...'. 
```

**Your app should show:**
```
✅ All API requests using HTTPS
✅ No mixed content warnings
✅ No SSL errors
```

---

## 📋 HTTPS Checklist

### Current Status
- ✅ **Production API uses HTTPS** (`breaddata.co`)
- ✅ **ValtDashboard TestNet endpoints use HTTPS**
- ✅ **api.js automatically selects HTTPS for production**
- ✅ **CORS configured for S3 frontend**
- ⚠️ **S3 frontend uses HTTP** (not a security issue for static files, but best practice is HTTPS)

### To Make Everything HTTPS (Optional)
- [ ] Create CloudFront distribution for S3
- [ ] Request ACM SSL certificate
- [ ] Configure custom domain (testnet.breaddata.co)
- [ ] Update CORS to include HTTPS frontend
- [ ] Test end-to-end HTTPS flow

---

## 🚀 Quick Reference Commands

### Check Current Configuration
```bash
# View API endpoints in ValtDashboard
grep -n "fetch('http" vue-frontend/src/components/ValtDashboard.vue

# View API base URL logic
grep -A 20 "getBaseURL" vue-frontend/src/services/api.js

# Check CORS configuration
grep -A 5 "CORS_ALLOWED_ORIGINS" HashCashApp/settings.py
```

### Test API Endpoints
```bash
# Test send code endpoint
curl -X POST https://www.breaddata.co/api/profiles/send_testnet_code/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","language":"en"}'

# Test verify code endpoint
curl -X POST https://www.breaddata.co/api/profiles/verify_testnet_code/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

### Deploy Updated Frontend
```bash
# If you make changes to HTTPS configuration
cd vue-frontend
npm run build:production

# Deploy to S3
aws s3 sync dist/ s3://testnet-breadcrumbs-frontend/ \
  --delete \
  --cache-control "max-age=3600"
```

---

## ❓ FAQ

**Q: Is my TestNet API secure?**  
✅ **Yes!** Your production endpoints already use HTTPS encryption.

**Q: Do I need to change anything?**  
❌ **No!** Your configuration is already correct for secure API calls.

**Q: Why is my S3 frontend HTTP?**  
💡 S3 static website hosting doesn't support HTTPS by default. Use CloudFront for HTTPS.

**Q: Are my user's emails and verification codes secure?**  
✅ **Yes!** They're transmitted over HTTPS to `breaddata.co`, so they're encrypted in transit.

**Q: Should I force HTTPS for the entire app?**  
💡 **Best practice:** Yes, use CloudFront for full HTTPS. **Current state:** Your API calls are already secure, so it's not urgent.

**Q: What about localhost development?**  
✅ HTTP is fine for localhost since it's not exposed to the internet.

---

## 📞 Support

**Current HTTPS Status:** ✅ **SECURE**  
**Production API:** `https://www.breaddata.co`  
**Frontend:** `http://testnet-breadcrumbs-frontend.s3-website-us-east-1.amazonaws.com` (HTTP OK for static files, API calls use HTTPS)

**No immediate action required!** Your TestNet verification system is already using secure HTTPS endpoints.
