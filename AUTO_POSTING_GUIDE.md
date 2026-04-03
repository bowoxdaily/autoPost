# ✅ Auto-Posting Guide

**Status: YES - Auto-posting sudah fully implemented!**

---

## 📋 Apa itu Auto-Posting?

Auto-posting adalah fitur yang **otomatis generate artikel dan posting ke WordPress pada interval yang ditentukan** (default: setiap 12 jam).

### Setiap posting akan:
✅ Generate konten baru dengan Gemini AI  
✅ Upload ke WordPress dengan REST API  
✅ Fetch featured image dari Loremflickr  
✅ Extract SEO keywords dari Yoast plugin  
✅ Simpan log lengkap di Supabase  

---

## 🎯 Cara Enable Auto-Posting

### Via Dashboard (Recommended)

**Step 1: Login ke Dashboard**
```
1. Buka http://localhost:3000
2. Login dengan email & password
```

**Step 2: Go to Home → Enable Auto-Post**
```
Dashboard → Home tab
Lihat toggle: "Auto-Post Status"
- ON (Biru) = Running
- OFF (Abu-abu) = Stopped

Click toggle untuk enable/disable
```

**Step 3: Check Interval (Optional)**
```
Dashboard → Settings
- "Interval (Waktu dalam jam)" = Set berapa jam sekali posting
  Default: 12 hours
  
Contoh:
- 1 = Post setiap jam
- 2 = Post setiap 2 jam
- 12 = Post setiap 12 jam
- 24 = Post setiap hari

Click "Simpan Pengaturan"
```

**Step 4: Monitor Posting**
```
Dashboard → Logs tab
Lihat daftar posts yang sudah auto-posting:
- Title: Artikel title
- Status: success/failed
- Link: Direct ke WordPress post
- Keywords: SEO keywords
- Image: Featured image URL
- Timestamp: Kapan posting dibuat
```

---

## 🔍 Check Auto-Posting Status

### Via Dashboard

```
1. Dashboard → Home
2. Lihat: "Auto-Post Status"
   - ✅ ON = Berjalan, tunggu sampai interval berikutnya
   - ❌ OFF = Tidak berjalan, click toggle untuk enable

3. Lihat: "Last Post" info
   - Menampilkan post terakhir yang sudah dibuat
   - Waktu posting
```

### Via API (Terminal)

```bash
# Check cron status
curl http://localhost:5000/api/cron/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response:
# {
#   "active": true,
#   "running": true,
#   "timestamp": "2026-04-02T08:30:00.000Z"
# }
```

### Via Backend Logs

```bash
# Lihat logs real-time
# Terminal dimana backend jalan:

✅ Auto-posting success:
[Gemini] Generating SEO-optimized content...
[Image] Fetching image for...
[WordPress] Uploading post...
[Yoast] Extracting keywords...
✅ Post published: "Article Title" (SEO Score: 85/100)

❌ Auto-posting failed:
❌ Auto post failed: Error message here
```

---

## 🧪 Test Auto-Posting

### Test 1: Manual Post (Immediate)

```
1. Dashboard → Home
2. Click "Post Now" button
3. Wait 30-60 seconds

Expected:
✅ Post berhasil dibuat
✅ Muncul di WordPress dashboard
✅ Appear in Logs with image
```

### Test 2: Start Auto-Posting

```
1. Dashboard → Settings
2. Set "Interval" ke 1 jam (untuk test cepat)
3. Click "Simpan Pengaturan"
4. Dashboard → Home
5. Toggle "Auto-Post Status" → ON
6. Wait 1 jam atau manual trigger dengan "Post Now"

Expected:
✅ Dashboard shows "Auto-Post Status: ON"
✅ Post created sesuai interval
✅ Logs accumulate dengan time
```

### Test 3: Check Logs

```
1. Dashboard → Logs
2. Lihat daftar posts

Untuk setiap post, check:
✅ Title: Ada title
✅ Status: "success" (bukan "failed")
✅ Link: Bisa click ke WordPress
✅ Image: Featured image terbuka
✅ Keywords: Ada SEO keywords
✅ Time: Timestamp akurat
```

---

## 📊 Auto-Posting Infrastructure

```
┌─────────────────────────────────────┐
│   Auto-Posting Scheduler            │
│   (node-cron)                       │
└────────────┬────────────────────────┘
             │
      Every N hours
             │
             ▼
┌─────────────────────────────────────┐
│   Generate Content                  │
│   - Gemini AI generates article     │
│   - Extract keywords & meta         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Upload to WordPress               │
│   - POST /wp-json/wp/v2/posts       │
│   - Returns post ID                 │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Fetch & Set Featured Image        │
│   - GET image from Loremflickr      │
│   - Upload to WordPress media       │
│   - Set as featured image           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Extract Yoast SEO Data            │
│   - Query post meta for focus_kw    │
│   - Extract SEO score               │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Log to Database                   │
│   - Save post info to Supabase      │
│   - Record timestamp                │
│   - Store keywords & image URL      │
└─────────────────────────────────────┘
```

---

## 🔧 Configuration

### Default Settings (Backend)

```javascript
// cronService.js - Default values

// Default interval: 12 hours
const hours = settings.intervalWaktu || 12;

// Cron schedule: "0 */12 * * *" = every 12 hours at minute 0
cronJob = cron.schedule(`0 */${hours} * * *`, async () => {
  await runAutoPost();
});
```

### Database Settings (Supabase)

Settings disimpan di table `settings` atau local file:

```json
{
  "intervalWaktu": 12,          // Jam
  "cronActive": true            // On/off
}
```

### Environment Variables

```env
# Backend .env
NODE_ENV=production            # Harus "production" untuk cron aktif

# Database credentials
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGc...

# Credentials
GEMINI_API_KEY=AIzaSy...
ENCRYPTION_KEY=...
```

---

## 🚨 Common Issues

### Issue 1: Auto-posting tidak berjalan

**Symptoms:**
- Toggle shows ON tapi posts tidak auto-generate
- Logs kosong setelah lama

**Check:**
1. ✅ Is dashboard toggle actually ON?
   ```
   Dashboard → Home → lihat toggle status
   ```

2. ✅ Is interval set?
   ```
   Dashboard → Settings → check "Interval" value
   ```

3. ✅ Are credentials saved?
   ```
   Dashboard → Credentials
   - Gemini API Key ada?
   - WordPress credentials ada?
   ```

4. ✅ Check backend logs
   ```
   Terminal backend → lihat untuk errors
   ```

**Fix:**
```
1. Toggle OFF
2. Go to Settings, verify credentials
3. Set interval (contoh: 1 untuk test cepat)
4. Toggle ON
5. Wait atau click "Post Now"
6. Check Logs

Jika masih tidak jalan:
- Stop backend: Ctrl+C
- Restart: npm run dev
- Try again
```

### Issue 2: Post created tapi tanpa image

**Symptoms:**
- Post ada tapi tanpa featured image
- Logs show error tentang image

**Check:**
```
Backend logs:
❌ [Image] Loremflickr error: Request failed
```

**Fix:**
1. Loremflickr API timeout
2. Solution: Try "Post Now" lagi, biasanya berhasil
3. Jika persist: Check internet connection

### Issue 3: Post created tapi content kecil/incomplete

**Symptoms:**
- Post ada tapi text sangat pendek
- Says "Unable to parse content"

**Check:**
```
Backend logs:
⚠️  [Gemini] JSON parse error: ...
✅ [Gemini] Partially recovered content...
```

**Fix:**
- Ini normal untuk response parsing yang kompleks
- Content sudah di-recover dan dimuat ke WordPress
- Jika ada masalah: Check Gemini API quota

### Issue 4: Cron not starting

**Error:**
```
Error: User ID is required to start cron job
```

**Fix:**
```
1. Make sure logged in ke dashboard
2. JWT token valid (check browser storage)
3. Try logout → login lagi
4. Try "Post Now" dulu untuk verify auth
```

---

## 📈 Monitor Auto-Posting

### Real-Time Dashboard Monitoring

```
Dashboard → Home:
┌─────────────────────────────────┐
│ Auto-Post Status: ON ✅         │
│ Last Post: 2 hours ago          │
│ Total Posts: 42                 │
│ Average Score: 87/100           │
│ Next Post: In 10 hours          │
└─────────────────────────────────┘

Dashboard → Logs:
[Table showing:]
- Title | Status | Link | Keywords | Image | Time
- "Best SEO..." | success | https://... | seo,tips | ✓ | 2h ago
- "Marketing..." | success | https://... | marketing | ✓ | 14h ago
- "Content..." | success | https://... | content | ✓ | 1d ago
```

### Backend Console Monitoring

```bash
# Open terminal where backend running
# Should see logs like:

✅ [Gemini] Using model: gemini-2.5-flash
📝 [Gemini] Generating SEO-optimized content for: Digital Marketing
✅ [Gemini] SEO Content generated: "Best Digital..." (89/100)
🖼️  [Image] Fetching image for: "professional digital marketing"
✅ [Image] Image ready: https://loremflickr.com/...
📥 [Image] Downloading image
✅ [Image] Image downloaded (45230 bytes)
📤 [WordPress] Uploading image: image-xxx.jpg
✅ [WordPress] Image uploaded (Media ID: 123)
🖼️  [WordPress] Setting featured image
✅ [WordPress] Featured image set successfully
[Yoast] Fetching Yoast data for post 123...
[Yoast] ✅ Found keywords: [digital, marketing, strategy]
✅ Post published: Best Digital Marketing Strategy (87/100)
```

### WordPress Check

```
WordPress Admin → Posts:
- Should see new posts appearing
- Each post should have:
  ✅ Title (generated by Gemini)
  ✅ Content (1500+ words HTML)
  ✅ Featured Image (visible thumbnail)
  ✅ Excerpt (meta description)
```

---

## 🎯 Recommended Test Schedule

**Week 1: Development**
- Set interval: 1 hour (untuk test cepat)
- Run manual posts dengan "Post Now"
- Monitor logs, check WordPress
- Verify images, keywords, content

**Week 2: Production Prep**
- Set interval: 12 hours (normal posting)
- Let it run for 2-3 cycles
- Monitor for any errors
- Check WordPress posts quality
- Verify Yoast integration

**Production Deployment**
- Set interval: 24 hours atau sesuai kebutuhan
- Monitor first 24 hours closely
- Setup alerts/monitoring
- Document any issues
- Adjust interval if needed

---

## ✅ Checklist: Is Auto-Posting Ready?

- [ ] Dashboard toggle can turn ON/OFF
- [ ] "Post Now" button creates posts manually
- [ ] Manual posts appear in WordPress
- [ ] Manual posts have featured images
- [ ] Manual posts show Yoast keywords
- [ ] Logs page shows post history
- [ ] Interval can be changed in settings
- [ ] Auto-posting toggle can be set to ON
- [ ] Wait 1 hour (or interval set), check new post
- [ ] Auto-posted content quality is good
- [ ] Images are beautiful & relevant
- [ ] Yoast keywords extracted correctly
- [ ] Ready for production deployment

---

## 🚀 Next: Production Auto-Posting

Once tested locally and working:

### Deploy to Production

```bash
1. Push code to GitHub
2. Deploy backend (Railway)
3. Deploy frontend (Vercel)
4. Setup Supabase production database
5. Configure production credentials in dashboard
6. Start auto-posting on production
7. Monitor logs daily
8. Deploy complete! 🎉
```

### Monitor Production

```
Setup automated monitoring:
- Uptime checks (UptimeRobot)
- Error tracking (Sentry)
- Daily log reviews
- Weekly performance checks
```

---

## 📚 Related Documentation

- **PRODUCTION.md** - Full production deployment guide
-**DEPLOYMENT_QUICK_START.md** - 3-step quick deployment
- **IMAGE_INTEGRATION.md** - Image feature details
- **YOAST_INTEGRATION.md** - SEO keyword extraction
- **PER_USER_LOGS.md** - Log tracking system

---

## 🎓 Summary

✅ **Auto-posting is READY!**

**To Enable:**
1. Dashboard → Home
2. Toggle "Auto-Post Status" → ON
3. Set interval in Settings (default: 12 hours)
4. Wait for next posting time OR click "Post Now"
5. Monitor in Logs page

**That's it!** 🚀

Posts akan auto-generate dan auto-post setiap N jam dengan:
- AI-generated content (Gemini)
- Featured images (Loremflickr)
- SEO optimization (Yoast integration)
- Automatic logging (Supabase)

Ready untuk production? Lihat DEPLOYMENT_QUICK_START.md!
