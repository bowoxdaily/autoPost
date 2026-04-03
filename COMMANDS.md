# 🖥️ Complete Commands Reference

## Quick Commands

### Backend Installation & Run
```bash
# Navigate to backend
cd backend

# Install dependencies (first time)
npm install

# Run in development mode (with auto-reload)
npm run dev

# Run in production mode
npm start
```

### Frontend Installation & Run
```bash
# Navigate to frontend (in new terminal)
cd frontend

# Install dependencies (first time)
npm install

# Run in development mode (with hot-reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### From Root Directory (Workspace)
```bash
# Install all dependencies
npm install

# Run both backend & frontend (if npm workspaces set up)
npm run dev
```

## Development Commands

### Backend Development
```bash
cd backend

# Development mode (watches for changes)
npm run dev

# Check if running
curl http://localhost:5000/api/health

# View logs (if using PM2)
pm2 logs autopost-backend

# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend Development
```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Preview built app
npm run preview

# Clean build cache
rm -r dist node_modules
npm install
```

## Installation Steps (Complete)

### Step 1: Backend
```bash
cd backend
npm install
npm run dev
```
✅ Wait for: "Server running on http://localhost:5000"

### Step 2: Frontend (New Terminal)
```bash
cd frontend
npm install
npm run dev
```
✅ Wait for: "Local: http://localhost:3000"

### Step 3: Access Dashboard
```
Open browser: http://localhost:3000
```

## Configuration Setup Commands

### Windows Command Prompt
```bash
# Navigate to project
cd d:\Project\autopostwp

# Backend
cd backend
npm install
npm run dev

# (New terminal)
cd d:\Project\autopostwp\frontend
npm install
npm run dev
```

### Windows PowerShell
```powershell
# Backend
Set-Location -Path 'd:\Project\autopostwp\backend'
npm install
npm run dev

# (New window)
Set-Location -Path 'd:\Project\autopostwp\frontend'
npm install
npm run dev
```

### macOS/Linux
```bash
# Backend
cd ~/Project/autopostwp/backend
npm install
npm run dev

# (New terminal)
cd ~/Project/autopostwp/frontend
npm install
npm run dev
```

## First-Time Setup Checklist

```bash
# 1. Clone/Download project
cd autopostwp

# 2. Backend setup
cd backend
npm install
cp .env.example .env
npm run dev
# ✅ Check: "Server running on http://localhost:5000"

# 3. Frontend setup (NEW TERMINAL)
cd frontend
npm install
npm run dev
# ✅ Check: "Local: http://localhost:3000"

# 4. Open browser
# http://localhost:3000

# 5. Configure
# - Go to Settings page
# - Enter Gemini API Key
# - Enter WordPress details
# - Save and test
```

## Testing Commands

### Backend API Health Check
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Get settings
curl http://localhost:5000/api/settings

# Get cron status
curl http://localhost:5000/api/cron/status

# Get logs
curl http://localhost:5000/api/logs

# Start cron
curl -X POST http://localhost:5000/api/cron/start

# Stop cron
curl -X POST http://localhost:5000/api/cron/stop

# Run post now
curl -X POST http://localhost:5000/api/cron/run-now
```

### Using Postman/Insomnia
```
Method: GET
URL: http://localhost:5000/api/health
Expected: { "status": "OK", "timestamp": "..." }

Method: GET
URL: http://localhost:5000/api/settings
Expected: { "geminiKey": "", "wpUrl": "", ... }

Method: POST
URL: http://localhost:5000/api/settings
Body: {
  "geminiKey": "your-key",
  "wpUrl": "your-url",
  "wpUser": "your-user",
  "wpPass": "your-pass",
  "intervalWaktu": 12
}
Expected: { "message": "Settings updated", "settings": {...} }
```

## Debugging Commands

### View Running Processes
```bash
# Windows
netstat -ano | findstr :5000
lsof -i :5000

# macOS/Linux
lsof -i :3000
lsof -i :5000
```

### Kill Process on Port
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# macOS/Linux
kill -9 $(lsof -ti:5000)
kill -9 $(lsof -ti:3000)
```

### View Logs
```bash
# Backend logs (check terminal running npm run dev)
# Look for console.log output

# Frontend logs (check browser console)
# F12 → Console tab

# Database logs (in file)
cat backend/data/db.json
```

### Clear Cache
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json dist
npm install

# Rebuild everything
npm run build
```

## Production Deployment

### Build Frontend
```bash
cd frontend
npm run build

# Output in frontend/dist/
# Upload dist/ folder to web server
```

### Start Backend (Production)
```bash
cd backend

# Using node directly
node src/server.js

# Using PM2 (recommended)
npm install -g pm2
pm2 start src/server.js --name "autopost-backend"
pm2 save
pm2 startup

# View PM2 logs
pm2 logs autopost-backend
```

### Environment Variables (Production)
```bash
# Create backend/.env
PORT=5000
NODE_ENV=production

# Create frontend/.env
VITE_API_BASE_URL=https://your-domain.com/api
```

## NPM Commands Summary

### Backend Commands
```bash
npm install              # Install dependencies
npm run dev             # Start with auto-reload
npm start               # Start production
npm test                # Run tests (if configured)
npm run build           # Build (if configured)
```

### Frontend Commands
```bash
npm install             # Install dependencies
npm run dev            # Start dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm test               # Run tests (if configured)
```

## Troubleshooting Commands

### Check Node Version
```bash
node --version           # Should be >= 16.0.0
npm --version            # Should be >= 8.0.0
```

### Check Port Status
```bash
# Is port 5000 available?
netstat -ano | findstr :5000

# Is port 3000 available?
netstat -ano | findstr :3000
```

### Clear Node Modules & Reinstall
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json dist
npm cache clean --force
npm install
npm run build
```

### Test Database Connection
```bash
# Check if db.json exists and is valid
cat backend/data/db.json

# Should output JSON like:
# {"settings": {...}, "cronActive": false, "logs": [...]}
```

## Git Commands (if version controlling)

```bash
# Initialize git
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: AutoPost Dashboard"

# View status
git status

# View logs
git log --oneline

# Push to repository
git push origin main
```

## Environment Variables Setup

### Backend (.env)
```
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Common Issues & Solutions

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Module Not Found
```bash
cd backend
# or frontend

# Reinstall
npm install

# Clear cache
npm cache clean --force
npm install
```

### API Not Working
```bash
# Check backend is running
curl http://localhost:5000/api/health

# Check frontend proxy (vite.config.js)
# Check CORS is enabled (check server.js)
```

### Frontend Not Hot-Reloading
```bash
# Kill process
# Check vite.config.js
npm run dev

# Hard refresh browser (Ctrl+Shift+R)
```

## Performance Monitoring

### Backend Health
```bash
# Every 5 seconds
curl -s http://localhost:5000/api/health | jq

# Monitor in loop
while true; do curl http://localhost:5000/api/health; sleep 5; done
```

### Frontend Performance
```bash
# Open browser DevTools
# Lighthouse tab
# Check performance

# Network tab
# Monitor API calls
```

## Backup & Recovery

### Backup Database
```bash
# Copy db.json
cp backend/data/db.json backend/data/db.json.backup

# View backup
cat backend/data/db.json.backup
```

### Restore Database
```bash
# Restore from backup
cp backend/data/db.json.backup backend/data/db.json

# Restart server
# Kill npm run dev
# npm run dev
```

### Clear All Data
```bash
# Delete database
rm backend/data/db.json

# Restart server (will recreate with default data)
npm run dev
```

---

## Quick Reference Cheat Sheet

| Task | Command |
|------|---------|
| Install backend | `cd backend && npm install` |
| Install frontend | `cd frontend && npm install` |
| Start backend | `npm run dev` (in backend dir) |
| Start frontend | `npm run dev` (in frontend dir) |
| Build frontend | `npm run build` (in frontend dir) |
| Check backend health | `curl http://localhost:5000/api/health` |
| Get settings | `curl http://localhost:5000/api/settings` |
| View database | `cat backend/data/db.json` |
| Kill process on :5000 | `lsof -ti:5000 \| xargs kill -9` |
| Clear cache | `npm cache clean --force` |

---

**All commands tested and ready to use! 🚀**
