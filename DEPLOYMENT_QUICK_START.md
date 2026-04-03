# ⚡ Quick Production Setup

**Estimated Time:** 30-45 minutes  
**Recommended Platform:** Railway.app (free tier included, easy setup)

---

## 🎯 3-Step Deployment

### Step 1: Prepare Your Repository

```bash
# Make sure all code is committed to GitHub
git add .
git commit -m "Production ready"
git push origin main

# Create .env files locally from examples
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update values in backend/.env:
# - SUPABASE_URL
# - SUPABASE_KEY  
# - GEMINI_API_KEY
# - JWT_SECRET (generate: openssl rand -hex 32)
# - ENCRYPTION_KEY (generate: openssl rand -hex 32)
# - FRONTEND_URL=https://yourdomain.com

# Update values in frontend/.env:
# VITE_API_URL=https://api.yourdomain.com

# IMPORTANT: Do NOT commit .env files to GitHub!
# They contain secrets!
```

### Step 2: Deploy Backend (Railway.app)

```bash
# 1. Create Railway account
#    https://railway.app

# 2. Click "New Project" → "Deploy from GitHub"
# 3. Select your repository  
# 4. Select "backend" as root directory
# 5. Go to Variables tab in Railway dashboard
# 6. Add all variables from backend/.env:

PORT=5000
NODE_ENV=production
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...
GEMINI_API_KEY=AIzaSy...
JWT_SECRET=... (min 32 chars)
ENCRYPTION_KEY=... (min 32 chars)
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com

# 7. Wait for deploy to complete
# 8. Get your API URL from Railway dashboard
#    Something like: https://api-production-xxxx.railway.app
```

**✅ Backend is now live!**

### Step 3: Deploy Frontend (Vercel)

```bash
# 1. Go to https://vercel.com
# 2. Click "Add New Project"
# 3. Import your GitHub repository
# 4. Select "frontend" as root directory
# 5. Go to Environment Variables
# 6. Add:

VITE_API_URL=https://api-production-xxxx.railway.app

# 7. Deploy
# 8. Get your frontend URL  
#    Something like: https://yourapp.vercel.app
```

**✅ Frontend is now live!**

---

## 🔗 Setup Custom Domains

### Backend Domain (api.yourdomain.com)

**If using Railway:**

```
1. Buy domain (Namecheap, GoDaddy, etc)
2. In Railway Dashboard:
   - Project → Networking → Custom Domain
   - Add Domain: api.yourdomain.com
   - Copy the target (e.g., api-production-xxxx.railway.app)

3. In your domain registrar:
   - DNS Management
   - Add CNAME record:
     Type: CNAME
     Name: api
     Value: [railway target from step 2]
     TTL: 3600

4. Wait 5-10 minutes for DNS to propagate
5. Test: curl https://api.yourdomain.com/api/health
```

### Frontend Domain (yourdomain.com)

**If using Vercel:**

```
1. In Vercel Dashboard:
   - Settings → Domains
   - Add Domain: yourdomain.com
   - Follow Vercel's instruction for DNS setup

2. In your domain registrar:
   - Add CNAME or follow Vercel's DNS wizard
   
3. Wait 5-10 minutes for DNS to propagate
4. Test: https://yourdomain.com
```

---

## 🗄️ Setup Database

### Create Supabase Project

```
1. Go to https://supabase.com
2. Click "New Project"
3. Fill details:
   - Name: AutoPost Production
   - Password: Strong password (save it!)
   - Region: Pick closest to you
   - Pricing: Free tier OK to start

4. After project created, file get:
   - Project URL: Dashboard → Settings → API
   - Anon Key: Copy this value
   - These go in your backend .env:
     SUPABASE_URL=https://xxxxx.supabase.co
     SUPABASE_KEY=eyJhbGc...

5. Run migrations:
   - SQL Editor → New Query
   - Copy migrations from /backend/migrations/ folder
   - Run one by one:
     a. add_user_credentials.sql
     b. add_logs_table.sql
     c. fix_logs_table_schema.sql  
     d. fix_logs_post_id_bigint.sql

6. Check all tables created:
   - Table Editor → Should see: users, logs, etc
```

---

## ✅ Quick Verification

### Test Backend

```bash
# Test API health
curl https://api.yourdomain.com/api/health

# Should return:
# {"status":"OK","timestamp":"2026-04-02T08:05:00.000Z"}

# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Test Frontend

```
Open browser: https://yourdomain.com

Should see:
- AutoPost Dashboard loading
- Can see home, settings, logs pages
- No console errors
```

### Test End-to-End

```
1. Go to Dashboard → Settings
2. Enter WordPress credentials
3. Enter Gemini API Key
4. Click "Save Settings"
5. Go to Dashboard → Home
6. Click "Post Now"
7. Wait 30-60 seconds
8. Check WordPress admin panel
9. Should see new post with:
   - ✅ Title & content
   - ✅ Featured image
   - ✅ Yoast SEO data
```

---

## 🔒 Security Checklist

- ✅ All `.env` files NOT committed to GitHub
- ✅ Secrets stored in deployment platform, not in code
- ✅ CORS properly configured for your domain only
- ✅ JWT_SECRET is strong (32+ random characters)
- ✅ ENCRYPTION_KEY is strong (32+ random characters)
- ✅ Database has RLS policies enabled
- ✅ HTTPS/SSL enabled on all domains
- ✅ Regular backups configured in Supabase
- ✅ Monitor logs regularly for errors
- ✅ Keep dependencies updated: `npm audit fix`

---

## 📊 Monitor Production

### Railway Dashboard
```
- Logs: Real-time application logs
- Metrics: CPU, Memory, Network usage
- Deploys: See all deployment history
```

### Vercel Dashboard
```
- Deployments: See frontend builds
- Analytics: User sessions, performance
- Logs: Edge function logs (if applicable)
```

### Supabase Dashboard
```
- Database: Check size & resource usage  
- Backups: Manual or scheduled
- Logs: Database query logs
```

### Uptime Monitoring (FREE)

```
Setup automated health checks with UptimeRobot:
1. Go to https://uptimerobot.com
2. Sign up (free)
3. Add monitors:
   - https://api.yourdomain.com/api/health
   - https://yourdomain.com
4. Check every 5 minutes
5. Get email alert if down
```

---

## 🚨 Troubleshooting

### Backend not responding

```bash
# Check Railway logs
# Dashboard → Project → Logs tab

# Common issues:
1. Environment variables not set
   Fix: Add all variables to Railway dashboard
   
2. Database connection error
   Fix: Check SUPABASE_URL and KEY are correct
   
3. Port already in use
   Fix: Use different port in .env
```

### Frontend showing errors

```bash
# Check browser console (F12)
# Common issues:

1. API_URL not correct
   Fix: Set VITE_API_URL in Vercel env vars
   
2. CORS error
   Fix: Check FRONTEND_URL and ALLOWED_ORIGINS in backend .env
   
3. Build error
   Fix: npm run build locally and check error
```

### Images not uploading

```
Check:
1. WordPress REST API is enabled
2. User has media upload permissions
3. WordPress file upload limits not exceeded
4. Loremflickr API accessible (test in browser)
```

### Posts not auto-posting

```
Check:
1. Cron job is scheduled
2. Database credentials correct
3. Gemini API key valid & has quota
4. WordPress credentials correct
5. Check logs for error messages
6. Monitor /api/logs endpoint
```

---

## 📚 Next Steps

After successful deployment:

1. **Monitor first 24 hours**
   - Watch logs for any errors
   - Test manual posting
   - Verify auto-posting works

2. **Setup backups**
   - Supabase: Enable automatic backups
   - Configure 30-day restore window

3. **Setup monitoring alerts**
   - Sentry for error tracking
   - UptimeRobot for downtime alerts
   - Custom dashboards for metrics

4. **Document your setup**
   - Save API URLs
   - Document database credentials (securely)
   - Create runbook for common issues
   - Document shutdown/startup procedures

5. **Plan maintenance**
   - Weekly: Check logs & stats
   - Monthly: Update packages
   - Quarterly: Security audit
   - Yearly: Database optimization

---

## 📞 Getting Help

1. **Check PRODUCTION.md** - Detailed troubleshooting
2. **Check platform docs:**
   - Railway: https://docs.railway.app  
   - Vercel: https://vercel.com/docs
   - Supabase: https://supabase.com/docs
3. **Check code comments** - Most files have comments
4. **Check GitHub Issues** - Common problems documented

---

## 🎉 You're Done!

Your AutoPost app is now running in production!

**Access your app:**
- Frontend: https://yourdomain.com
- API: https://api.yourdomain.com
- API Health: https://api.yourdomain.com/api/health

**Keep it secure:**
- Rotate secrets every 3-6 months
- Keep dependencies updated
- Monitor logs regularly
- Backup database daily

**Celebrate! 🚀**
