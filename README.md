# AutoPost Admin Dashboard

Sistem Dashboard Admin yang lengkap dan modern untuk mengotomatisasi pembuatan dan publikasi artikel WordPress menggunakan Google Generative AI (Gemini).

## 📋 Fitur Utama

### Backend
- ✅ Penyimpanan konfigurasi lokal dengan `lowdb`
- ✅ Endpoint CRUD untuk settings (`/api/settings`)
- ✅ Scheduling otomatis dengan `node-cron`
- ✅ Start/Stop Cron Job (`/api/cron/start`, `/api/cron/stop`)
- ✅ Sistem logging riwayat postingan (`/api/logs`)
- ✅ Integrasi Google Gemini AI untuk generate konten

### Frontend
- ✅ Dashboard modern dengan Tailwind CSS
- ✅ Sidebar navigasi responsive dengan 3 menu utama
- ✅ Halaman Home: statistik, manual run, toggle autopost
- ✅ Halaman Settings: form konfigurasi lengkap
- ✅ Halaman Logs: tabel riwayat postingan
- ✅ Real-time status polling
- ✅ React Router untuk navigasi multi-page

## 🗂️ Struktur Folder

```
autopostwp/
├── backend/
│   ├── src/
│   │   ├── server.js              # Entry point
│   │   ├── controllers/           # Business logic
│   │   │   ├── settingsController.js
│   │   │   ├── cronController.js
│   │   │   └── logsController.js
│   │   ├── routes/                # API routes
│   │   │   ├── settingsRoute.js
│   │   │   ├── cronRoute.js
│   │   │   ├── logsRoute.js
│   │   │   └── postRoute.js
│   │   ├── services/              # External services
│   │   │   ├── geminiService.js   # Google AI
│   │   │   ├── wordpressService.js
│   │   │   └── cronService.js
│   │   └── utils/
│   │       └── database.js        # lowdb setup
│   ├── data/
│   │   └── db.json                # Data storage (auto-generated)
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main app
│   │   ├── main.jsx               # Entry point
│   │   ├── index.css              # Tailwind styles
│   │   ├── pages/                 # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Logs.jsx
│   │   ├── layouts/               # Layout components
│   │   │   └── DashboardLayout.jsx
│   │   ├── components/            # Reusable components
│   │   └── utils/
│   │       └── api.js             # API calls
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .gitignore
│
├── package.json                   # Root workspace
└── .gitignore

```

## 🚀 Instalasi & Setup

### Prerequisites
- Node.js 16+ 
- npm atau yarn
- Windows/Mac/Linux

### Backend Setup

```bash
cd backend
npm install

# Buat file .env
cp .env.example .env
# Edit .env sesuai kebutuhan (opsional, default PORT=5000)

# Development mode (dengan auto-reload)
npm run dev

# Production mode
npm start
```

Backend akan berjalan di `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install

# Development mode
npm run dev

# Build untuk production
npm run build
```

Frontend akan berjalan di `http://localhost:3000` dan proxy API ke backend

### Menjalankan Keduanya (Optional)

Jika ingin menjalankan dari root folder:

```bash
# Install dependencies untuk semua workspace
npm install

# Jalankan backend dan frontend bersamaan
npm run dev
```

## 🔑 Konfigurasi Awal

### 1. Dapatkan Google Gemini API Key
- Kunjungi https://aistudio.google.com/app/apikey
- Klik "Create API Key" atau "Get API Key"
- Copy API Key (format: `AIza...`)
- **[Detailed Setup Guide →](./GEMINI_SETUP.md)**

### 2. Setup WordPress
- Buat "Application Password" di WordPress Dashboard
  - Settings → Security & Privacy → Application Passwords
  - Generate password dan copy
- Siapkan URL WordPress Anda
- **[Detailed Setup Guide →](./WORDPRESS_SETUP.md)**

### 3. Konfigurasi di Dashboard
- Akses `http://localhost:3000`
- Pergi ke menu **Settings**
- Isi semua field:
  - Gemini API Key (paste dari step 1)
  - WordPress URL (misal: https://myblog.com)
  - WordPress Username
  - WordPress App Password (dari step 2)
  - Interval Time (jam)
- Klik **Save Settings**

**↓ Jika error saat save, lihat:**
- [WordPress Error 401 checklist](./ERROR_401_FIX.md)
- [Gemini API solutions](./GEMINI_SETUP.md)

### 4. Test Konfigurasi
1. Klik tombol **"Create & Publish Now"** di Home page
2. Tunggu sampai success (biasanya 5-30 detik)
3. Pergi ke **Logs** page dan lihat post yang baru dibuat
4. Buka link post di sana untuk verify di WordPress

**Proses Lengkap:**
- ✅ Settings disimpan → ✅ Test manual → ✅ Enable automation → ✅ Monitor logs

## 📡 API Endpoints

### Settings
```
GET  /api/settings          - Get current settings
POST /api/settings          - Update settings
```

### Cron
```
POST /api/cron/start        - Start automation
POST /api/cron/stop         - Stop automation
GET  /api/cron/status       - Get current status
POST /api/cron/run-now      - Create & publish post immediately
```

### Logs
```
GET  /api/logs?limit=100    - Get post history
DELETE /api/logs            - Clear all logs
```

### Health
```
GET  /api/health            - Server health check
```

## 📊 Data Storage

Semua data disimpan dalam `backend/data/db.json`:

```json
{
  "settings": {
    "geminiKey": "...",
    "wpUrl": "https://...",
    "wpUser": "...",
    "wpPass": "...",
    "intervalWaktu": 12
  },
  "cronActive": false,
  "logs": [
    {
      "id": 1234567890,
      "timestamp": "2024-03-31T10:30:00.000Z",
      "title": "Article Title",
      "status": "success",
      "postId": 123,
      "link": "https://..."
    }
  ]
}
```

## 🎯 Cara Penggunaan

### 1. Konfigurasi Awal
1. Buka Settings page
2. Isi semua required fields
3. Klik Save

### 2. Test Manual
1. Pergi ke Home page
2. Klik "Create & Publish Now"
3. Tunggu proses selesai
4. Cek Logs page untuk verifikasi

### 3. Aktifkan Automation
1. Klik togglenya "Start AutoPost"
2. Sistem akan otomatis membuat post sesuai interval yang diatur
3. Monitor di Logs page

## 🛠️ Troubleshooting

### Error: "Invalid WordPress credentials" (HTTP 401)

**Penyebab paling umum:**
- WordPress URL salah format
- WordPress username salah
- WordPress App Password salah atau tidak valid
- User tidak punya permission Administrator
- REST API tidak aktif

**Quick Fix (5 menit):** [ERROR_401_FIX.md](./ERROR_401_FIX.md)

**Panduan Lengkap:** [WORDPRESS_SETUP.md](./WORDPRESS_SETUP.md)

**Setup Cepat Benar:**
- WordPress URL: `https://example.com` (jangan ada trailing slash)
- Username: (catat dari WordPress Users page)
- App Password: (buat di Settings → Security & Privacy)
- Pastikan user adalah Administrator
- Test: Buka `https://yoursite.com/wp-json/` di browser

### Error: "Failed to generate content"
- Validasi Gemini API Key benar di https://aistudio.google.com/
- Pastikan API sudah diaktifkan
- Check rate limits Google API
- Verify internet connection

### Error: "models/gemini-pro is not found" atau Model Error dari Gemini API
**Penyebab:** Model Gemini tidak tersedia di region Anda atau API Key tidak valid

**Quick Fix:** [GEMINI_SETUP.md](./GEMINI_SETUP.md)
- Backend akan otomatis mencoba model alternatif (gemini-2.0-flash → gemini-1.5-flash → gemini-1.5-pro → gemini-pro)
- Lihat backend terminal untuk log model mana yang berhasil digunakan
- Test API Key: `https://aistudio.google.com/app/apikey`

### Cron job tidak jalan
- Pastikan settings sudah disimpan dengan benar (Save di Settings page)
- Restart backend server: `npm run dev` di folder backend
- Check browser console (F12) untuk error messages
- Lihat backend terminal logs untuk detail

### "Cannot connect to WordPress"
- Verify WordPress running dan accessible
- Test URL di browser: `https://yoursite.com`
- Check firewall/network settings
- Verify REST API aktif: `https://yoursite.com/wp-json/`

### Port Already in Use
- Backend port 5000: `lsof -ti:5000 | xargs kill -9`
- Frontend port 3000: `lsof -ti:3000 | xargs kill -9`

### Dependencies tidak terinstall
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 📦 Dependencies

### Backend
- `express` - Web framework
- `cors` - Cross-origin requests
- `lowdb` - JSON database
- `node-cron` - Job scheduling
- `axios` - HTTP client
- `google-generative-ai` - Gemini AI
- `dotenv` - Environment variables

### Frontend
- `react` - UI framework
- `react-dom` - DOM rendering
- `react-router-dom` - Routing
- `axios` - HTTP client
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `vite` - Build tool

## 🎨 Customization

### Ubah Interval Schedule
Edit `cronService.js` untuk mengubah jenis scheduling. Saat ini menggunakan cron expression untuk jam:

```javascript
// Current: every X hours
const hours = settings.intervalWaktu || 12;
cronJob = cron.schedule(`0 */${hours} * * *`, async () => {
  // Runs at top of every X hours
});
```

### Ubah Topics untuk Gemini
Edit `cronService.js` di fungsi `runAutoPost()`:

```javascript
const topic = `Latest ${new Date().toLocaleDateString()} Update`;
// Ganti dengan topic yang diinginkan
```

### Tambah Menu Baru
1. Edit `DashboardLayout.jsx` - tambah ke `menuItems`
2. Buat halaman baru di `frontend/src/pages/`
3. Import dan tambah Route di `App.jsx`

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
```

Tambahkan variable lain sesuai kebutuhan.

## 🔐 Security Notes

- Jangan commit `.env` file
- Gunakan Application Password di WordPress, bukan main password
- Protect API keys - jangan share di publik
- Untuk production, gunakan environment variables yang aman
- Enable CORS hanya untuk domain yang trusted

## 📄 License

MIT

## 👨‍💻 Development

Untuk development:

```bash
# Backend debugging
cd backend
npm run dev

# Frontend dengan hot-reload
cd frontend
npm run dev

# Buka browser
# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

Check console untuk error messages dan logs.

---

**Dibuat dengan ❤️ untuk AutoPost Admin Dashboard**
