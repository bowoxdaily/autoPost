# 🤖 Google Generative AI (Gemini) Setup Guide

## ❌ Error: "models/gemini-pro is not found"

Jika Anda mendapat error ini atau error lain dari Gemini API, ikuti panduan ini.

---

## ✅ Step-by-Step Gemini API Setup

### Step 1: Create Google Account

Jika belum punya:
- Buka https://accounts.google.com/
- Buat account baru atau login dengan Google account yang ada

---

### Step 2: Enable API & Create API Key

1. **Buka Google AI Studio:**
   - Link: https://aistudio.google.com/
   - Atau: https://aistudio.google.com/app/apikey

2. **Klik "Get API Key"**
   - Atau: "Create API Key" button

3. **Pilih Project:**
   - Jika pertama kali: Akan auto-create "default" project
   - Atau pilih existing project

4. **Copy API Key:**
   - API Key ditampilkan
   - Format: `AIza...` (panjang sekitar 39 karakter)
   - **JANGAN share atau commit ke GitHub!**

5. **Save API Key:**
   - Simpan di tempat aman (password manager, notepad, dll)
   - Hanya ditampilkan 1x saja

---

## 🔑 Verify API Key

### Test di Browser

1. Buka (replace `YOUR_API_KEY`):
```
https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash?key=YOUR_API_KEY
```

2. **Hasil yang diharapkan:**
   - Muncul JSON response dengan model details → API KEY BENAR ✅
   - Error 403/404 → API KEY SALAH/EXPIRED ❌

### Contoh Response (Success):
```json
{
  "name": "models/gemini-2.0-flash",
  "displayName": "Gemini 2.0 Flash",
  "description": "Fast and efficient model",
  "inputTokenLimit": 1000000,
  ...
}
```

### Contoh Response (Error):
```json
{
  "error": {
    "code": 403,
    "message": "User does not have permission"
  }
}
```

---

## 📝 Set API Key di AutoPost Dashboard

### Di AutoPost Settings Page

1. Buka http://localhost:3000
2. Klik menu **Settings**
3. Di field **Google Gemini API Key:**
   - Paste API Key yang sudah di-copy
   - Format: `AIza...`
4. Isi field lain (WordPress, Interval)
5. Klik **Save Settings**

---

## 🚨 Common API Errors & Solutions

### Error: "Invalid or missing Gemini API Key"

**Penyebab:**
- API Key kosong
- API Key salah copy (ada space atau typo)
- API Key expired atau di-revoke

**Solusi:**
1. Verify API Key di https://aistudio.google.com/app/apikey
2. Re-copy dan paste (careful dengan space/newline)
3. Test URL di browser: `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash?key=YOUR_KEY`

---

### Error: "No compatible Gemini model available"

**Penyebab:**
- API Key tidak punya akses ke Gemini models
- API belum di-enable di GCP project
- Model deprecated atau not available

**Solusi:**
1. Verify akses di Google AI Studio: https://aistudio.google.com/
2. Cek error di backend terminal (model name yang dicoba)
3. Create NEW API Key di https://aistudio.google.com/app/apikey

---

### Error: "User does not have permission" (403)

**Penyebab:**
- API Key dari project yang tidak enable Generative AI
- Quota habis
- Geographic restriction

**Solusi:**
1. Recreate API Key di: https://aistudio.google.com/app/apikey
2. Verify billing (jika over quota)
3. Check geographic restrictions

---

### Error: "Failed to fetch from generativelanguage.googleapis.com"

**Penyebab:**
- Network/internet issue
- GCP service down
- Firewall/proxy blocking

**Solusi:**
1. Test internet connection
2. Try manual test URL di browser
3. Check firewall settings
4. Wait jika GCP sedang maintenance

---

## 🔄 API Key Management

### Regenerate API Key

Jika suspect API Key compromised:

1. Buka https://aistudio.google.com/app/apikey
2. Click icon delete di API Key lama
3. Create new API Key
4. Update di AutoPost Settings

### API Quotas

Default quota untuk Generative AI:
- **Free tier**: 60 queries per minute
- **Paid tier**: Higher limits based on billing

**Monitor quota:**
- Google Cloud Console: https://console.cloud.google.com/
- Atau tanya di https://issuetracker.google.com/

---

## 📊 Supported Models

Backend akan auto-detect tersedia:

| Model | Status | Speed | Quality |
|-------|--------|-------|---------|
| gemini-2.0-flash | ✅ Newest | Fast | Good |
| gemini-1.5-flash | ✅ Latest | Fast | Good |
| gemini-1.5-pro | ✅ Available | Medium | Excellent |
| gemini-pro | ❌ Deprecated | - | - |

Backend akan automatically try each model hingga find yang tersedia.

---

## 🧪 Test Content Generation

### Manual Test

1. Pastikan API Key sudah disave di Settings
2. Go to Home page
3. Click **"Create & Publish Now"** button
4. Wait beberapa detik
5. Check Logs page untuk result

### Backend Terminal Debug

Check terminal menjalankan backend (`npm run dev`):

```
✅ [Gemini] Using model: gemini-2.0-flash
📝 [Gemini] Generating content for: Latest News
✅ [Gemini] Content generated: "Latest News - Important Updates"
```

Atau error:
```
❌ [Gemini] Error: No compatible Gemini model available
⚠️  [Gemini] Model gemini-1.5-pro not available, trying next...
```

---

## 🔍 Detailed Troubleshooting

### Step 1: Verify Installation

```bash
# Check if @google/generative-ai installed
cd backend
npm list @google/generative-ai

# Expected: @google/generative-ai@0.3.0 (or newer)
```

### Step 2: Test API Key Locally

Create file `test-gemini.js`:
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('YOUR_API_KEY');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const result = await model.generateContent('Say hello');
console.log(result.response.text());
```

Run:
```bash
node test-gemini.js
```

### Step 3: Check Backend Logs

Terminal `npm run dev`:
- Look for `[Gemini]` logs
- Check untuk model yang berhasil atau error

### Step 4: Browser Developer Tools

F12 → Network tab:
- Cari request ke `/api/cron/run-now`
- Response tab → lihat error detail

---

## 🎯 Workflow Lengkap

```
1. Setup Gemini API
   ├── Go to https://aistudio.google.com/
   ├── Create API Key
   └── Copy API Key

2. Configure AutoPost
   ├── Go to http://localhost:3000
   ├── Settings page
   ├── Paste API Key
   └── Click Save

3. Test
   ├── Go to Home page
   ├── Click "Create & Publish Now"
   ├── Check backend terminal logs
   └── Verify post di WordPress

4. Monitor
   ├── Check Logs page
   ├── Watch backend terminal
   └── Verify content quality
```

---

## 💡 Pro Tips

1. **Keep API Key Secret**
   - Don't commit `.env` file
   - Don't share API Key
   - Regenerate if exposed

2. **Monitor Usage**
   - Check backend logs regularly
   - Watch untuk errors
   - Monitor API quota

3. **Content Quality**
   - First-run content mungkin generic
   - Feedback loop untuk improve
   - Dapat customize prompt di `geminiService.js`

4. **Fallback Models**
   - Backend try multiple models automatically
   - Selalu ada model yang work
   - Tidak perlu switch manual

---

## 📞 Support

- **Google AI Studio**: https://aistudio.google.com/
- **API Docs**: https://ai.google.dev/
- **Issue Tracker**: https://issuetracker.google.com/
- **Community**: https://stackoverflow.com/questions/tagged/google-generative-ai

---

## ✅ Success Checklist

- [ ] Created Google Account
- [ ] Generated Gemini API Key
- [ ] Copied API Key correctly
- [ ] Tested API Key di browser
- [ ] Pasted ke AutoPost Settings
- [ ] Saved Settings
- [ ] Tested "Create & Publish Now"
- [ ] Post generated successfully

---

**Sudah berhasil? Great! Content generation ready! 🎉**
