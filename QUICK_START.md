# 🚀 Quick Start Guide

## Install & Run in 5 Minutes

### Step 1: Backend Setup
```bash
cd backend
npm install
npm run dev
```
✅ Backend runs on http://localhost:5000

### Step 2: Frontend Setup (Terminal baru)
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend runs on http://localhost:3000

### Step 3: Configure
1. Open http://localhost:3000
2. Go to Settings
3. Fill in:
   - Gemini API Key (from https://aistudio.google.com/)
   - WordPress URL
   - WordPress Username
   - WordPress App Password
   - Interval Time
4. Click Save

### Step 4: Test
1. Go to Home
2. Click "Create & Publish Now"
3. Check Logs page

### Step 5: Enable Automation
1. Click toggle "Start AutoPost"
2. Done! System will auto-post on schedule

## 📌 Important Notes

- Get Gemini API Key: https://aistudio.google.com/app/apikey
- Create WordPress App Password: WordPress Admin → Settings → Application Passwords
- All data stored in `backend/data/db.json`
- Logs auto-refresh every 5 seconds

## ⚡ Commands

**Backend:**
```bash
npm run dev   # Development with nodemon
npm start     # Production
```

**Frontend:**
```bash
npm run dev   # Development with Vite
npm run build # Build for production
```

## 📦 File Locations

- Backend code: `backend/src/`
- Frontend code: `frontend/src/`
- Data: `backend/data/db.json`
- Logs: In database (not separate file)

## 🆘 Troubleshooting

**Port already in use?**
```bash
# Change port in frontend/vite.config.js
# or backend .env
```

**API not working?**
- Check backend is running on :5000
- Check frontend proxy in vite.config.js

**Cron not running?**
- Save settings first
- Restart backend
- Check browser console

---
Happy automating! 🎉
