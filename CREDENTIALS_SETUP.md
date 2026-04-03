# User Credentials Setup Guide

## Overview

Fitur user credentials memungkinkan setiap pengguna untuk menyimpan:
- **Gemini API Key** - Untuk konten generation
- **WordPress Credentials** - Untuk auto-posting

Semua data disimpan dalam bentuk terenkripsi di database untuk keamanan.

## Setup Instructions

### 1. Backend Setup

#### Database Migration

Jalankan SQL migration berikut di Supabase:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_password TEXT;
```

**Langkah-langkah:**
1. Buka Supabase Dashboard
2. Pilih project Anda
3. Go to SQL Editor
4. Copy & paste query di atas
5. Run query

#### Environment Variables

Tambahkan ke `.env` file di backend:

```env
ENCRYPTION_KEY=your-random-32-character-secret-key-here
```

Untuk generate key yang random:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Jika tidak ada ENCRYPTION_KEY, sistem akan generate satu secara random (tidak disarankan untuk production).

### 2. Frontend Setup

Frontend sudah terintegrasi otomatis. Fitur tersedia di:
- Menu: `Credentials` (di sidebar)
- Route: `/credentials`

### 3. API Endpoints

#### Get User Credentials
```http
GET /api/user-settings
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "settings": {
    "gemini_api_key": "***",
    "wordpress_url": "https://example.com",
    "wordpress_username": "***",
    "wordpress_password": "***"
  }
}
```

#### Update User Credentials
```http
PUT /api/user-settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "gemini_api_key": "AIza...",
  "wordpress_url": "https://example.com",
  "wordpress_username": "admin",
  "wordpress_password": "xxxx xxxx xxxx xxxx xxxx xxxx xxxx xxxx"
}
```

Response:
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "settings": {
    "gemini_api_key": "***",
    "wordpress_url": "https://example.com",
    "wordpress_username": "***",
    "wordpress_password": "***"
  }
}
```

#### Verify Credentials
```http
POST /api/user-settings/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "credentialType": "gemini"  // atau "wordpress"
}
```

## Security Notes

### Encryption
- Semua credential disimpan dengan AES-256-CBC encryption
- Setiap nilai di-encrypt dengan IV (Initialization Vector) yang unique
- Master key diambil dari ENCRYPTION_KEY environment variable

### Best Practices
1. **Gunakan Application Password untuk WordPress**
   - Buka: Dashboard → Settings → Security → Application Passwords
   - Create new: "AutoPost" (nama aplikasi)
   - Copy 24-character password yang di-generate
   - Jangan gunakan main password WordPress

2. **Gemini API Key**
   - Generate dari [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Gunakan API key yang specific untuk aplikasi ini
   - Enable Gemini API di Google Cloud Console
   - Monitor usage untuk avoid overspending

3. **Never Share Credentials**
   - Jangan share credentials dengan orang lain
   - Jangan commit .env file ke git
   - Rotate passwords secara berkala

## Frontend Components

### UserCredentials Component
- Location: `frontend/src/components/UserCredentials.jsx`
- Styling: `frontend/src/styles/UserCredentials.css`
- Features:
  - Input form untuk 4 credentials
  - Password masking dengan toggle show/hide
  - Verification button untuk test credentials
  - Save & Load dari backend
  - Error handling & validation

### Pages
- Location: `frontend/src/pages/UserCredentials.jsx`
- Simple wrapper untuk component

## Backend Components

### Controller
- Location: `backend/src/controllers/userSettingsController.js`
- Functions:
  - `getUserSettings` - Fetch user credentials (decrypted)
  - `updateUserSettings` - Update credentials (encrypted before save)
  - `getUserGeminiKey` - Get API key untuk service use
  - `getUserWordPressCredentials` - Get WP creds untuk service use
  - `verifyUserCredentials` - Verify format validity

### Routes
- Location: `backend/src/routes/userSettingsRoute.js`
- Protected routes (require authentication)
- Methods:
  - `GET /` - Get credentials
  - `PUT /` - Update credentials
  - `POST /verify` - Verify credentials

### Encryption Utility
- Location: `backend/src/utils/encryption.js`
- Functions:
  - `encrypt(text)` - Encrypt string
  - `decrypt(text)` - Decrypt string
  - Uses AES-256-CBC with crypto.scryptSync

### Migrations
- Location: `backend/src/utils/migrations.js`
- Runs on server startup
- Checks if columns exist
- Alerts user if manual migration needed

## Testing

### Manual API Test (using curl)

1. Get credentials:
```bash
curl -X GET http://localhost:5000/api/user-settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

2. Update credentials:
```bash
curl -X PUT http://localhost:5000/api/user-settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gemini_api_key": "AIza...",
    "wordpress_url": "https://example.com",
    "wordpress_username": "admin",
    "wordpress_password": "xxxx xxxx xxxx xxxx"
  }'
```

3. Verify credentials:
```bash
curl -X POST http://localhost:5000/api/user-settings/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"credentialType": "gemini"}'
```

## Troubleshooting

### Issue: "No credentials found"
- Check if database migration has been run
- Verify columns exist in `users` table via Supabase UI

### Issue: "Failed to decrypt"
- Check if ENCRYPTION_KEY is correct
- Make sure encrypted data in database isn't corrupted
- Clear browser localStorage and try again

### Issue: "Credentials saved but not showing"
- Check browser console for errors
- Verify JWT token is still valid
- Try refresh page

### Issue: "Verify always fails"
- For Gemini: Check API key format (should start with "AIza")
- For WordPress: Test manually via `https://yoursite.com/wp-json/wp/v2/users/me`

## Future Enhancements

1. Add credential rotation scheduling
2. Add usage logs for each credential
3. Add webhook support for credential updates
4. Add IP whitelist for security
5. Add credential expiry alerts
6. Add two-factor verification before updating credentials
