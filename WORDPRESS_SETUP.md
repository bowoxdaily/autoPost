# 🔐 WordPress Configuration Guide

## ❌ Error 401: Invalid WordPress Credentials

Jika Anda mendapat error ini, ikuti panduan step-by-step di bawah.

---

## ✅ Step-by-Step Setup WordPress Credentials

### Step 1: Verify WordPress Installation

**Di WordPress Admin Dashboard:**
1. Login ke WordPress sebagai admin
2. Periksa URL bar → Catat URL (misal: `https://example.com` atau `http://localhost/wordpress`)
3. Pastikan WordPress version 5.0+ (untuk REST API support)

**Check REST API:**
- Buka di browser: `https://example.com/wp-json/`
- Atau: `https://example.com/wp-json/wp/v2/users`
- Jika muncul JSON response → REST API aktif ✅
- Jika error 404 atau "not found" → REST API tidak aktif ❌

### Step 2: Create Application Password

**PENTING: Gunakan Application Password, bukan Main Password!**

**Di WordPress Admin Panel:**

1. Login sebagai **Administrator**
2. Pergi ke: **Settings → Security & Privacy**
   - Atau direct: `/wp-admin/admin.php?page=security`

3. Scroll ke **Application Passwords** section
   - Jika tidak ada → Cek WordPress version (harus 5.3+)

4. Di field **Application Name**, masukkan: `AutoPost`

5. Klik **Create Application Password**

6. **COPY seluruh password** (16 karakter dengan spasi)
   ```
   Contoh: abcd efgh ijkl mnop
   ```

7. **Simpan di tempat aman** - Password hanya ditampilkan sekali!

---

## 🔧 Konfigurasi di AutoPost Dashboard

### Buka Settings Page

**Di AutoPost Dashboard:**

1. Buka http://localhost:3000
2. Klik menu **Settings**
3. Isi form sebagai berikut:

---

### Form Fields Penjelasan

#### 1. **WordPress URL**
```
Format BENAR:
✅ https://example.com
✅ https://blog.example.com
✅ http://localhost/wordpress
✅ http://192.168.1.100:8080

Format SALAH:
❌ example.com (harus ada https:// atau http://)
❌ https://example.com/ (jangan ada trailing slash)
❌ https://example.com/wp-admin (jangan /wp-admin)
❌ https://example.com/index.php (jangan /index.php)
```

**Testing URL:**
- Buka di browser: `[YOUR_URL]/wp-json/`
- Jika muncul JSON → URL benar ✅

---

#### 2. **WordPress Username**
```
Format BENAR:
✅ admin
✅ john_doe
✅ your-username

CATATAN:
• Harus user dengan role Administrator/Editor
• Gunakan username, bukan email
• Case-sensitive
```

**Cara cek username:**
- Dashboard WordPress → Users → Click user profile
- Lihat field "Username" (bukan "Display Name")

---

#### 3. **WordPress App Password**
```
Format BENAR:
✅ abcd efgh ijkl mnop (dengan spasi)
✅ abcdefghijklmnop (tanpa spasi)

Format SALAH:
❌ password Akun WordPress utama (TIDAK boleh!)
❌ Hanya sebagian dari app password
❌ Password dengan typo/salah copy
```

**PENTING:**
- Jangan gunakan password akun utama WordPress
- Selalu gunakan Application Password
- Jika lupa → Buat yang baru di Settings → Security

---

#### 4. **Interval Time (Hours)**
```
Pilihan:
• 1 hour
• 2 hours
• 4 hours
• 6 hours
• 12 hours
• 24 hours
```

---

## 🧪 Testing Koneksi

### Manual Test (di Backend Terminal)

```bash
# Test dengan curl
curl -u "username:app-password" \
  https://example.com/wp-json/wp/v2/users/me

# Contoh response jika berhasil:
{
  "id": 1,
  "username": "admin",
  "name": "Administrator",
  ...
}

# Jika error 401:
{
  "code": "rest_forbidden",
  "message": "Sorry, you are not allowed to do that."
}
```

### Test di Dashboard

1. Isi semua Settings fields
2. Klik **Save Settings**
3. Perhatikan response:
   - **Success** → Settings saved successfully! ✅
   - **Error** → Lihat error message untuk hint

---

## 🔴 Common Issues & Solutions

### Issue 1: "HTTP 401 - Unauthorized"

**Penyebab:**
- Username salah
- App Password salah
- User tidak punya permission
- App Password sudah dihapus

**Solusi:**
1. Double-check username (case-sensitive)
2. Verify app password di Settings → Security & Privacy
3. Pastikan user adalah Administrator
4. Buat app password baru jika lupa

---

### Issue 2: "HTTP 404 - Not Found"

**Penyebab:**
- WordPress URL salah
- REST API tidak aktif
- WordPress tidak installed

**Solusi:**
1. Verify URL di browser: `https://example.com/wp-json/`
2. Enable REST API jika disabled
3. Update WordPress ke version 5.0+

---

### Issue 3: "Connection Refused"

**Penyebab:**
- WordPress server down
- URL tidak reachable
- Firewall block

**Solusi:**
1. Verify WordPress running: Open URL di browser
2. Check firewall settings
3. Verify internet connection

---

### Issue 4: "Cannot Read Property 'rendered'"

**Penyebab:**
- Title field tidak ada di response
- WordPress REST API permissions

**Solusi:**
1. Pastikan user punya permission untuk read posts
2. Update WordPress ke latest version

---

## 📋 Checklist Sebelum Save

- [ ] WordPress URL benar (format: `https://example.com`)
- [ ] WordPress URL accessible di browser
- [ ] WordPress version 5.0 atau lebih
- [ ] REST API aktif (`/wp-json/` accessible)
- [ ] Username benar (catat dari WordPress Users page)
- [ ] Application Password dibuat (bukan main password)
- [ ] App Password di-copy dengan benar (termasuk spasi)
- [ ] User adalah Administrator

---

## 🎯 Workflow Lengkap

```
1. Setup WordPress
   ├── Install WordPress 5.0+
   ├── Create/verify admin user
   └── Confirm REST API aktif

2. Create Application Password
   ├── Go to Settings → Security
   ├── Create app password untuk "AutoPost"
   └── Copy password (16 chars)

3. Configure AutoPost
   ├── Open http://localhost:3000
   ├── Go to Settings page
   ├── Fill ALL fields:
   │   ├── WP URL: https://example.com
   │   ├── Username: admin
   │   ├── App Password: xxxx xxxx xxxx xxxx
   │   └── Interval: 12 hours
   └── Click Save

4. Test
   ├── Go to Home page
   ├── Click "Create & Publish Now"
   ├── Check Logs page
   └── Verify post di WordPress ✅
```

---

## 🔍 Advanced Debugging

### Check Backend Logs

Terminal menjalankan backend:
```
[WordPress] Testing connection to: https://example.com/wp-json/wp/v2/users/me
[WordPress] ✅ Connection successful for user: Admin
```

### Inspect Request (Browser DevTools)

1. Buka browser → F12 → Network tab
2. Klik Save Settings
3. Cari request ke `/api/settings`
4. Lihat Response tab untuk error details

### Manual Curl Test

```bash
# Replace dengan data Anda
USERNAME="admin"
APP_PASSWORD="xxxx xxxx xxxx xxxx"
WP_URL="https://example.com"

# Test
curl -u "$USERNAME:$APP_PASSWORD" \
  "$WP_URL/wp-json/wp/v2/users/me"
```

---

## 📞 Still Having Issues?

### 1. Verify WordPress Setup
```bash
# Check WordPress version
curl -s https://example.com/wp-json/ | grep "namespaces"
```

### 2. Check User Permissions
- WordPress Dashboard → Users → Click user
- Verify Role = "Administrator"

### 3. Regenerate App Password
- Settings → Security → Delete old app password
- Create new application password
- Copy and test again

### 4. Enable Debug Mode
- Edit `wp-config.php`
- Set `WP_DEBUG = true`
- Check `/wp-content/debug.log` for errors

---

## ✅ Success Indicators

Jika setup benar, Anda akan melihat:

1. **Settings Saved** ✓
   - Dashboard menampilkan: "Settings saved successfully!"

2. **Manual Post Works** ✓
   - Klik "Create & Publish Now"
   - Post muncul di WordPress
   - Log menunjukkan "Success"

3. **Automation Works** ✓
   - Toggle "Start AutoPost"
   - Post dibuat otomatis sesuai interval
   - Logs bertambah setiap interval

---

## 🎓 Understanding Application Passwords

**Mengapa Application Password?**

- ✅ Lebih aman (not main account password)
- ✅ Bisa di-revoke tanpa change main password
- ✅ Limited permissions (REST API only)
- ✅ Better for integrations & automation

**Berbeda dengan:**
- ❌ Main WordPress password (too risky)
- ❌ PHP-generated tokens (not standard)
- ❌ OAuth (too complex for this)

---

## 💡 Pro Tips

1. **Separate Admin User**
   - Buat user khusus "AutoPost" dengan Administrator role
   - Lebih aman daripada main admin

2. **Regular Password Rotation**
   - Delete old app password setiap bulan
   - Create new password
   - Update di AutoPost settings

3. **Monitor Logs**
   - Check AutoPost logs regularly
   - Verifikasi posts dibuat dengan benar
   - Watch untuk error patterns

4. **Test After WordPress Update**
   - Setelah update WordPress
   - Generate new app password
   - Test connection di Settings

---

**Sudah berhasil? Great! Now enjoy AutoPost automation! 🎉**
