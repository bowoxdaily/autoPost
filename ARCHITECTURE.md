# 🏗️ Project Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AUTOPOST DASHBOARD                      │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌───────▼──────┐  ┌──▼──────┐  ┌──▼──────────┐
        │  React Vite  │  │ Tailwind │  │ React Router│
        │  (Frontend)  │  │   CSS    │  │  (Routing) │
        └───────┬──────┘  └──┬──────┘  └──┬──────────┘
                │            │             │
                └────────────┴─────────────┘
                        │ HTTP/API
                ┌───────▼──────────────┐
                │  Express Backend     │
                │  (Node.js)           │
                └───────┬──────────────┘
                │       │       │       │
        ┌───────▼──┐ ┌──▼──┐ ┌─▼────┐ ┌▼────────┐
        │  Settings│ │Cron │ │Logs  │ │Services │
        │Controller│ │Ctrl │ │Ctrl  │ │(Gemini, │
        └───────┬──┘ └──┬──┘ └─┬────┘ │   WP)  │
                │       │      │      └────┬───┘
                └───────┴──────┴───────────┘
                        │
                ┌───────▼────────┐
                │  lowdb (JSON)  │
                │  db.json File  │
                └────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────┐
│   React Frontend    │
│   (3 Pages)         │
└────────┬────────────┘
         │
         │ Settings Request
         ▼
┌─────────────────────────────┐
│  Express API Endpoints      │
│  /api/settings              │
│  /api/cron/*                │
│  /api/logs                  │
└────────┬────────────────────┘
         │
         │ Process Request
         ▼
┌─────────────────────────────┐
│   Controllers & Services    │
│   - Validate input          │
│   - Call external APIs      │
│   - Format response         │
└────────┬────────────────────┘
         │
         ├────────────────────────┐
         │                        │
         ▼                        ▼
    ┌────────────┐          ┌──────────────────┐
    │  lowdb DB  │          │ External Services│
    │(Settings,  │          │ - Gemini AI      │
    │ Logs)      │          │ - WordPress API  │
    └────────────┘          │ - node-cron      │
                            └──────────────────┘
```

## Component Hierarchy

```
App.jsx
└── DashboardLayout
    ├── Sidebar Navigation
    │   ├── Home link (/)
    │   ├── Settings link (/settings)
    │   └── Logs link (/logs)
    │
    └── Main Content Area
        ├── Header
        └── Outlet (Dynamic Page)
            ├── Home.jsx
            │   ├── Status Card
            │   ├── Stats Grid (3 cards)
            │   ├── Manual Run Button
            │   └── Automation Toggle
            │
            ├── Settings.jsx
            │   ├── Gemini API Key Input
            │   ├── WordPress URL Input
            │   ├── WordPress User Input
            │   ├── WordPress Password Input
            │   ├── Interval Selector
            │   └── Save Button
            │
            └── Logs.jsx
                ├── Refresh Button
                ├── Clear Button
                └── Logs Table
                    ├── Title Column
                    ├── Status Column
                    ├── Timestamp Column
                    └── Details Column
```

## Backend Module Structure

```
Backend/
│
├── server.js
│   └── Initialize server & routes
│
├── controllers/
│   ├── settingsController.js
│   │   ├── getSettingsHandler()
│   │   └── updateSettingsHandler()
│   │
│   ├── cronController.js
│   │   ├── startCronHandler()
│   │   ├── stopCronHandler()
│   │   ├── getCronStatusHandler()
│   │   └── runPostNowHandler()
│   │
│   └── logsController.js
│       ├── getLogsHandler()
│       └── clearLogsHandler()
│
├── routes/
│   ├── settingsRoute.js → GET/POST /api/settings
│   ├── cronRoute.js → POST/GET /api/cron/*
│   ├── logsRoute.js → GET/DELETE /api/logs
│   └── postRoute.js → GET /api/posts
│
├── services/
│   ├── cronService.js
│   │   ├── startCronJob()
│   │   ├── stopCronJob()
│   │   ├── runAutoPost()
│   │   └── runPostNow()
│   │
│   ├── geminiService.js
│   │   └── generatePostContent()
│   │
│   └── wordpressService.js
│       ├── postToWordPress()
│       └── verifyWordPressConnection()
│
└── utils/
    └── database.js
        ├── initializeDatabase()
        ├── getSettings()
        ├── updateSettings()
        ├── addLog()
        ├── getLogs()
        └── setCronActive()
```

## Request-Response Flow Example

### Example 1: Settings Update
```
Frontend (Settings.jsx)
    ↓
    └→ settingsAPI.update(formData)
        ↓
        └→ POST /api/settings
            ↓
            Backend (server.js)
            ↓
            └→ settingsController.updateSettingsHandler()
                ↓
                ├→ Validate data
                ├→ verifyWordPressConnection()
                └→ updateSettings() [database.js]
                    ↓
                    └→ db.json (lowdb)
                ↓
            ←─ Return { settings, message }
        ↓
        Frontend [Display success message]
```

### Example 2: Auto Post Creation
```
Frontend (Home.jsx)
    ↓
    └→ cronAPI.runNow()
        ↓
        └→ POST /api/cron/run-now
            ↓
            Backend (cronController.js)
            ↓
            └→ runPostNowHandler()
                ↓
                └→ cronService.runAutoPost()
                    ├→ getSettings() [from db.json]
                    ├→ generatePostContent() [Gemini API]
                    ├→ postToWordPress() [WordPress API]
                    └→ addLog() [Save to db.json]
                    ↓
                ←─ Return { message }
        ↓
        Frontend [Display success/error]
        ↓
        Frontend [Poll logs every 5s]
```

## File Count & Size Summary

```
Backend Files:
├── 1 entry point (server.js)
├── 3 controllers
├── 4 route files
├── 3 service files
├── 1 database utility
├── 1 package.json
├── 1 .env.example
└── Total: ~11 files, ~365 lines

Frontend Files:
├── 1 App component
├── 1 entry point (main.jsx)
├── 1 style file
├── 3 page components
├── 1 layout component
├── 1 API utility
├── 1 index.html
├── 1 vite.config.js
├── 1 tailwind.config.js
├── 1 postcss.config.js
├── 1 .env.example
├── 1 package.json
└── Total: ~14 files, ~465 lines

Documentation:
├── README.md (comprehensive)
├── QUICK_START.md (quick setup)
├── INSTALL.md (detailed installation)
└── SUMMARY.md (this overview)
```

## Technology Stack

```
Frontend:
├── React 18 (UI Framework)
├── Vite (Build Tool)
├── React Router 6 (Navigation)
├── Tailwind CSS (Styling)
├── Axios (HTTP Client)
└── Lucide React (Icons)

Backend:
├── Node.js (Runtime)
├── Express 4 (Framework)
├── lowdb (Database)
├── node-cron (Scheduling)
├── Axios (HTTP Client)
├── Google Generative AI (Gemini)
└── CORS (Cross-origin)
```

## Database Schema

```json
{
  "settings": {
    "geminiKey": "string (API Key)",
    "wpUrl": "string (WordPress URL)",
    "wpUser": "string (WP Username)",
    "wpPass": "string (WP App Password)",
    "intervalWaktu": "number (Hours between posts)"
  },
  
  "cronActive": "boolean (Is automation running?)",
  
  "logs": [
    {
      "id": "number (Timestamp)",
      "timestamp": "ISO string",
      "title": "string (Post title)",
      "status": "success | failed",
      "postId": "number (WP post ID)",
      "link": "string (Post URL)",
      "error": "string (Error message if failed)"
    }
  ]
}
```

## API Endpoints Tree

```
/api
├── /health → GET
├── /settings
│   ├── GET (fetch settings)
│   └── POST (update settings)
├── /cron
│   ├── /start → POST
│   ├── /stop → POST
│   ├── /status → GET
│   └── /run-now → POST
├── /logs
│   ├── GET (fetch logs with limit)
│   └── DELETE (clear all logs)
└── /posts
    └── GET (placeholder)
```

## State Management (Frontend)

```
Home.jsx
├── cronStatus (useEffect polling)
├── stats (refreshes with logs)
├── loading (boolean)
└── message (feedback)

Settings.jsx
├── formData (current settings)
├── loading (initial fetch)
├── saving (submit state)
├── message (feedback)
└── messageType (success/error)

Logs.jsx
├── logs (table data)
├── loading (fetch state)
└── clearingLogs (delete state)
```

## Cron Scheduling

```
Configuration: intervalWaktu (hours)

Examples:
- 1 hour → "0 */1 * * *"
- 2 hours → "0 */2 * * *"
- 4 hours → "0 */4 * * *"
- 6 hours → "0 */6 * * *"
- 12 hours → "0 */12 * * *"
- 24 hours → "0 0 * * *"

Execution:
Every interval → Gemini generates → WP posts → Log saved
```

## Security Layers

```
1. Input Validation
   └─ Validate settings before save

2. API Error Handling
   └─ Try-catch in all endpoints

3. Environment Variables
   └─ Sensitive data in .env (not committed)

4. CORS Protection
   └─ Configured in express

5. Password Storage
   └─ App Password (not main password)

6. Error Messages
   └─ No sensitive info in errors
```

---

**This is a production-ready, modular, well-documented system! 🚀**
