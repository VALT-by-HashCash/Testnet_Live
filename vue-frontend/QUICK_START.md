# 🚀 TestNet S3 Bucket Migration - Quick Start

## Current Situation
The `vue-deployer` IAM user doesn't have permissions to create S3 buckets. You need to create the bucket `testnet.valtdata.com` using AWS Console or admin credentials.

---

## ⚡ Quick Steps

### 1️⃣ Create Bucket (AWS Console - 2 minutes)

1. Login to AWS Console: https://console.aws.amazon.com/s3/
2. Click "Create bucket"
3. Settings:
   - **Name:** `testnet.valtdata.com` ← EXACT match!
   - **Region:** `us-east-1`
   - **Uncheck:** "Block all public access" ✅
4. Click "Create bucket"

### 2️⃣ Configure Bucket (2 minutes)

**Enable Static Hosting:**
- Properties tab → Static website hosting → Edit
- Enable it
- Index: `index.html`
- Error: `index.html`
- Save

**Add Public Policy:**
- Permissions tab → Bucket policy → Edit
- Paste this:
```json
{
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::testnet.valtdata.com/*"
    }]
}
```
- Save

### 3️⃣ Copy Files (Run this script)

```bash
cd /Users/jeffreykartchner/Breadcrumbs/vue-frontend
./copy-to-new-bucket.sh
```

This will automatically:
- ✅ Check if bucket exists
- ✅ Copy all files from `testnet-breadcrumbs-frontend`
- ✅ Set public-read permissions
- ✅ Verify file count

### 4️⃣ Test It

```bash
curl -I http://testnet.valtdata.com.s3-website-us-east-1.amazonaws.com
```

Expected: `HTTP/1.1 200 OK`

Or open in browser:
http://testnet.valtdata.com.s3-website-us-east-1.amazonaws.com

---

## 🎯 CloudFlare Setup Info

Once bucket is ready and tested, configure CloudFlare:

**CNAME Record:**
```
Type:   CNAME
Name:   testnet
Target: testnet.valtdata.com.s3-website-us-east-1.amazonaws.com
Proxy:  Enabled (orange cloud)
```

**Result:** `https://testnet.valtdata.com` will work with SSL! 🎉

---

## 📝 Files Created

1. **copy-to-new-bucket.sh** - Run this after bucket creation
2. **BUCKET_CREATION_GUIDE.md** - Detailed instructions
3. **migrate-to-new-bucket.sh** - Full automated script (needs admin)
4. **setup-iam-permissions.sh** - IAM policy setup (needs admin)

---

## ✅ Checklist

- [ ] Create bucket `testnet.valtdata.com` in AWS Console
- [ ] Enable static website hosting
- [ ] Add bucket policy for public read
- [ ] Run `./copy-to-new-bucket.sh`
- [ ] Test S3 URL in browser
- [ ] ✨ **Tell your team: "Good to go for CloudFlare!"**
- [ ] Configure CloudFlare CNAME
- [ ] Test final `https://testnet.valtdata.com`

---

## 🆘 Need Help?

**Issue:** Bucket creation fails
- **Solution:** Make sure you're logged in as admin or have S3 permissions

**Issue:** Files won't copy
- **Solution:** Check that `vue-deployer` has read access to old bucket

**Issue:** 403 Forbidden on website
- **Solution:** Double-check bucket policy is applied and public access is unblocked

**Issue:** CloudFlare shows error
- **Solution:** Make sure S3 website endpoint works first before adding CloudFlare

---

## 🎯 Current Status

- ❌ Bucket doesn't exist yet (needs admin to create)
- ✅ Old bucket has files ready to copy
- ✅ Scripts are ready to run
- ⏳ Waiting for bucket creation

**Next Action:** Create the bucket in AWS Console (2 minutes), then run `./copy-to-new-bucket.sh`
