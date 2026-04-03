# 🚀 Production Deployment Guide

Panduan lengkap untuk deploy AutoPost ke production.

## 📋 Daftar Isi

1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Domain & SSL](#domain--ssl)
7. [Security Checklist](#security-checklist)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Yang Dibutuhkan:
- ✅ Node.js v16+ (untuk backend)
- ✅ Supabase account (database)
- ✅ Gemini API Key (content generation)
- ✅ WordPress site dengan REST API enabled
- ✅ Domain (opsional tapi recommended)
- ✅ Deployment platform (pilih salah satu):
  - **Railway.app** (recommended - simple & affordable)
  - **Render.com** (alternative bagus)
  - **Vercel** (frontend only)
  - **Self-hosted VPS** (requires technical knowledge)

---

## Backend Deployment

### Option 1: Railway.app (Recommended) ⭐

**Keuntungan:**
- ✅ Deployment super mudah (connect GitHub)
- ✅ Automatic builds & restarts  
- ✅ FREE tier includes 5GB storage
- ✅ $5/month for small production app
- ✅ PostgreSQL integration (Supabase-ready)

**Steps:**

1. **Create Railway Account**
   ```
   https://railway.app?referralCode=[referral]
   ```

2. **Connect GitHub Repository**
   - Login to Railway
   - Click "New Project" → "Deploy from GitHub"
   - Select your autopostwp repo
   - Choose backend folder

3. **Configure Environment Variables**
   - Go to Project Settings → Variables
   - Add all variables dari `.env.example` (lihat bawah)

4. **Set Startup Command**
   ```
   npm install && npm start
   ```

5. **Add Domain (Optional)**
   - Railway auto-generates domain (xyz.railway.app)
   - Atau beli domain & set custom:
     - Dashboard → Networking → Add Custom Domain
     - Update DNS records di domain registrar

6. **Deploy**
   - Railway auto-deploy setiap push ke `main` branch
   - Monitor logs di Railway dashboard

### Option 2: Render.com

1. Create account at https://render.com
2. New "Web Service" → Connect GitHub
3. Choose backend folder
4. Set environment variables
5. Deploy

### Option 3: Self-Hosted VPS

**Untuk DigitalOcean, Linode, AWS EC2, etc:**

```bash
# SSH ke server
ssh root@your.server.ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
cd /home/app
git clone https://github.com/yourusername/autopostwp.git
cd autopostwp/backend

# Install dependencies
npm install --production

# Create .env file
nano .env
# Paste all environment variables

# Install PM2 (process manager)
sudo npm install -g pm2

# Start app with PM2
pm2 start src/server.js --name autopost
pm2 startup
pm2 save

# Install & configure Nginx (reverse proxy)
sudo apt-get install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/default
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable SSL with Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com

# Restart Nginx
sudo systemctl restart nginx
```

---

## Frontend Deployment

### Option 1: Vercel (Easiest) ⭐

**Vercel is perfect for React apps**

1. **Push to GitHub**
   - Make sure frontend code di folder `/frontend`

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import your GitHub repo
   - Select "Frontend" as root directory

3. **Set Environment Variables**
   - Dashboard → Settings → Environment Variables
   - Add: `VITE_API_URL=https://api.yourdomain.com`

4. **Deploy**
   - Vercel auto-deploys setiap push ke main
   - Gets a free domain `yourapp.vercel.app`

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
cd frontend
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Option 3: Railway (Same as Backend)

```bash
# Same process as backend
# Just select /frontend folder instead
```

### Option 4: Self-Hosted (Nginx)

```bash
# Build frontend
cd frontend
npm run build

# Copy dist to server
scp -r dist/ root@your.server.ip:/var/www/html/

# Already have Nginx configured? Just make sure it serves the dist folder
```

---

## Environment Variables

### Backend `.env` Template

```env
# ========== SUPABASE DATABASE ==========
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...

# ========== GEMINI AI API ==========
GEMINI_API_KEY=AIzaSy...

# ========== APPLICATION ==========
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# ========== JWT SECURITY ==========
JWT_SECRET=your-super-secret-random-string-min-32-chars
ENCRYPTION_KEY=your-super-secret-encryption-key-min-32-chars

# ========== CORS ==========
# Frontend URL
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# ========== CRON DEBUG (optional) ==========
CRON_LOG_LEVEL=info
```

### Frontend `.env` Template

```env
VITE_API_URL=https://api.yourdomain.com
```

**Security Tips:**
- ✅ Buat JWT_SECRET dengan: `openssl rand -hex 32`
- ✅ Buat ENCRYPTION_KEY dengan: `openssl rand -hex 32`
- ✅ JANGAN commit `.env` ke GitHub
- ✅ Use deployment platform's built-in secret manager
- ✅ Rotate keys setiap 3-6 bulan

---

## Database Setup

### Supabase Production Setup

1. **Create New Project**
   - Go to https://supabase.com
   - Click "New Project"
   - Name: "AutoPost Production"
   - Password: Generate strong password
   - Region: Pilih yang paling dekat

2. **Run Migrations**
   ```bash
   # Get Supabase URL dan KEY dari dashboard
   
   # Option 1: Via Supabase Dashboard
   - SQL Editor → "New Query"
   - Copy-paste migration files dari /backend/migrations/
   - Run setiap migration satu-satu
   
   # Option 2: Via CLI
   npm install -g supabase
   supabase db push
   ```

3. **Enable RLS (Row-Level Security)**
   - All tables harus punya RLS enabled
   - User hanya bisa akses data mereka sendiri
   - Check: Authentication → Policies

4. **Backup Strategy**
   ```
   Supabase → Project Settings → Backups
   - Enable automatic daily backups
   - Restore point: 30 days
   ```

5. **Connection Pooling**
   - Supabase → Project Settings → Database
   - Enable Connection Pooling (recommended untuk production)
   - Mode: Transaction (safest for Node.js)

---

## Domain & SSL

### Setup Custom Domain

**Contoh: api.yourdomain.com**

1. **Buy Domain**
   - Namecheap, GoDaddy, or your preferred registrar

2. **Add to Railway/Render**
   - Dashboard → Networking → Custom Domain
   - Copy target = "xxxxx.railway.app"

3. **Update DNS**
   - DNS Provider (Namecheap, CloudFlare, etc)
   - Add CNAME record:
     ```
     Type: CNAME
     Name: api
     Value: xxxxx.railway.app
     TTL: 3600
     ```

4. **SSL Certificate**
   - Railway/Render auto-handle SSL (free Let's Encrypt)
   - Takes 5-10 minutes to propagate

### Setup Frontend Domain

**Contoh: yourdomain.com**

**Vercel:**
- Project Settings → Domains
- Add custom domain
- Update DNS CNAME to vercel

**Netlify:**
- Site Settings → Domain Management
- Add custom domain
- Follow instructions

---

## Security Checklist

### Application Security

- ✅ Change default ports (not 3000, 5000)
- ✅ Enable HTTPS/SSL everywhere
- ✅ Set strong JWT secret (min 32 chars)
- ✅ Enable CORS only untuk frontend domain
- ✅ Use environment variables, JANGAN hardcode secrets
- ✅ Enable database RLS policies
- ✅ Implement rate limiting:

```javascript
// Add ke backend untuk prevent brute force
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

- ✅ Sanitize input (prevent SQL injection)
- ✅ Hash passwords dengan bcrypt
- ✅ Never log sensitive data
- ✅ Update dependencies regularly: `npm audit fix`

### Infrastructure Security

- ✅ Use private database credentials
- ✅ Enable firewall (ufw, security groups)
- ✅ Keep OS & packages updated
- ✅ Monitor for suspicious activity
- ✅ Setup automated backups
- ✅ Use VPN untuk admin access (if self-hosted)

### API Security

```bash
# Test your API
curl -I https://api.yourdomain.com/api/health

# Check CORS
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://api.yourdomain.com/api/test
```

---

## Monitoring

### Logs & Errors

**Railway/Render Dashboard:**
- Logs tab shows real-time logs
- Alerts untuk errors

**Better: Use Log Aggregation Service**

```bash
# Option 1: Sentry (Error tracking)
npm install @sentry/node
```

```javascript
// In server.js
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.errorHandler());
```

**Option 2: LogRocket (User session replay)**
- Tracks user actions & errors

**Option 3: Datadog/New Relic**
- Enterprise monitoring

### Health Checks

Setup monitoring untuk ensure app is running:

```bash
# Uptime Robot (free)
https://uptimerobot.com/

Add monitor for:
- https://api.yourdomain.com/api/health
- https://yourdomain.com

Every 5 minutes, get email alert if down
```

### Performance Monitoring

**Railway/Render:**
- Memory & CPU usage
- Request count
- Error rates

**Target Goals:**
```
Response Time: < 200ms
Error Rate: < 0.1%
Uptime: > 99.9%
Memory: < 200MB
```

---

## Auto-Posting in Production

### Setup Cron Jobs

**Via Railway/Render:**
Database cron jobs trigger POST requests ke `/api/cron/run`:

```javascript
// Add to backend/src/server.js
import axios from 'axios';

// Trigger auto-post every N hours
setInterval(async () => {
  try {
    const response = await axios.post(
      `http://localhost:${PORT}/api/cron/run`,
      {},
      {
        headers: {
          'x-internal-token': process.env.INTERNAL_CRON_TOKEN
        }
      }
    );
    console.log('✅ Cron executed');
  } catch (error) {
    console.error('❌ Cron failed:', error.message);
  }
}, 12 * 60 * 60 * 1000); // Every 12 hours
```

**Better: External Cron Service**

```bash
# Use AWS Lambda, Cloudflare Workers, or external service
# Set webhook URL: https://api.yourdomain.com/api/cron/run

# Example: Every day at 8 AM
https://cron-job.org
```

---

## Troubleshooting

### Common Issues

**1. Port already in use**
```bash
# Kill process using port 5000
lsof -i :5000
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

**2. Database connection error**
```
Check:
- Supabase URL is correct
- Supabase KEY is correct
- Database not full (check quota)
- VPC/Firewall not blocking connection
```

**3. CORS error**
```javascript
// Make sure CORS is configured
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

**4. Build fails**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check for version conflicts
npm audit
npm audit fix
```

**5. Images not uploading to WordPress**
```
Check:
- WordPress REST API is enabled
- User has "edit_posts" capability  
- Media upload limit in WordPress settings
- File size limits correctly set
```

**6. Cron not running**
```
Check logs in Railway/Render dashboard
- Is the job actually triggering?
- Are credentials stored in Supabase?
- Any permission errors?

Monitor: /api/logs should show new posts being created
```

---

## Performance Optimization

### Backend

```javascript
// 1. Enable gzip compression
import compression from 'compression';
app.use(compression());

// 2. Set helmet for security headers
import helmet from 'helmet';
app.use(helmet());

// 3. Use connection pooling for database
// Already enabled with Supabase

// 4. Cache frequently accessed data
import redis from 'redis';
// Implementation...
```

### Frontend

```bash
# 1. Build optimization is automatic in Vite
npm run build

# 2. Serve with gzip
# Vercel/Netlify does this automatically

# 3. Monitor bundle size
# Vite shows bundle info after build

# 4. Use CDN for static assets
# Vercel/Netlify uses Cloudflare CDN by default
```

### Database

```sql
-- Add indexes untuk queries yang slow
CREATE INDEX idx_logs_user_created 
  ON logs(user_id, created_at DESC);

CREATE INDEX idx_users_email 
  ON users(email);

-- Monitor slow queries
EXPLAIN ANALYZE SELECT * FROM logs WHERE user_id = 'xxx';
```

---

## Deployment Checklist

- [ ] Set NODE_ENV=production
- [ ] Generate strong JWT secret & encryption key
- [ ] Configure CORS for frontend domain
- [ ] Setup Supabase project & run migrations
- [ ] Test database connection
- [ ] Add all environment variables ke deployment platform
- [ ] Build frontend: `npm run build`
- [ ] Test backend API locally with production env
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test all endpoints di production
- [ ] Setup SSL/HTTPS certificate
- [ ] Configure custom domains
- [ ] Setup monitoring & alerts
- [ ] Setup backup strategy
- [ ] Document deployment process
- [ ] Create admin account untuk production
- [ ] Test WordPress integration
- [ ] Test Gemini API quota
- [ ] Setup error tracking (Sentry)
- [ ] Document runbook untuk troubleshooting

---

## Post-Deployment

### First Week
- Monitor logs daily
- Test manual post creation
- Test auto-posting
- Check WordPress posts are generating correctly
- Verify images are uploading
- Monitor error rates & performance

### Weekly
- Check disk usage
- Update packages if security patches available
- Review logs untuk anomalies
- Check API response times
- Verify cron jobs running

### Monthly
- Backup database
- Review & optimize slow queries
- Update documentation
- Security audit
- Performance review

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Supabase Docs**: https://supabase.com/docs
- **Express.js Guide**: https://expressjs.com/
- **React Deployment**: https://react.dev/learn/deployment

---

## Next Steps

1. ✅ Choose deployment platform (Railway recommended)
2. ✅ Create accounts & setup infrastructure
3. ✅ Prepare environment variables
4. ✅ Run migrations on Supabase
5. ✅ Deploy backend
6. ✅ Deploy frontend  
7. ✅ Test & monitor
8. ✅ Setup custom domains
9. ✅ Enable SSL/HTTPS
10. ✅ Setup ongoing monitoring

**Estimated Time: 1-2 hours**

Need help? Check troubleshooting section atau refer ke specific platform docs.

Good luck! 🚀
