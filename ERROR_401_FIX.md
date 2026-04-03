# 🔴 Error 401: WordPress Credentials Invalid - Fix Checklist

## ❌ Anda mendapat error:
```
"Invalid WordPress credentials: Request failed with status code 401"
```

---

## ✅ Quick Fix (5 menit)

### 1. Verify WordPress URL ✓

Di browser, buka:
```
https://yoursite.com/wp-json/
```

**Hasil yang diharapkan:**
- Muncul JSON response dengan "namespaces" array → **URL BENAR** ✅
- Error 404 atau "not found" → **URL SALAH** ❌ (gunakan format: `https://example.com` tanpa trailing slash)

---

### 2. Check WordPress Version ✓

WordPress version harus **5.3 atau lebih** (untuk Application Password support).

**Cek di WordPress:**
- Dashboard → Updates
- Atau buka: `https://yoursite.com/wp-admin/` → lihat footer

---

### 3. Create Application Password ✓

**PENTING: Gunakan Application Password, BUKAN main account password!**

**Di WordPress Admin Panel:**

1. Login sebagai **Administrator**
2. Buka: **Settings → Security & Privacy**
   - Atau direct: `/wp-admin/admin.php?page=security`
3. Scroll ke section **Application Passwords**
4. Di field **Application Name**: ketik `AutoPost`
5. Klik **Create Application Password**
6. **COPY seluruh password** (16 karakter, ada spasi)
   ```
   Contoh: abcd efgh ijkl mnop
   ```
7. **Simpan copy ini untuk step 5**

---

### 4. Verify Username ✓

**Di WordPress Admin Panel:**

1. Go to: **Users → All Users**
2. Click pada user Anda
3. Catat field **Username** (bukan Display Name)
4. Verify role = **Administrator**

---

### 5. Isi di AutoPost Dashboard ✓

**Di http://localhost:3000 → Settings:**

| Field | Value | Contoh |
|-------|-------|--------|
| **WordPress URL** | Your site URL | `https://example.com` |
| **WordPress Username** | From step 4 | `admin` |
| **WordPress App Password** | From step 3 | `abcd efgh ijkl mnop` |
| **Interval Time** | Pilih | `12 hours` |

**PENTING:**
- URL: jangan ada trailing slash ❌
- Password: copy persis dengan spasi
- Username: case-sensitive

---

### 6. Click Save & Check Result ✓

Di Settings page klik **Save Settings**.

**Hasil yang diharapkan:**
- ✅ Green message: "Settings saved successfully!"
- ❌ Red message: lihat error message untuk hint

---

## 🔍 Jika Masih Error...

### Backend Terminal Debug

Lihat terminal yang menjalankan backend (`npm run dev`).

Jika terlihat:
```
[WordPress] Testing connection to: https://example.com/wp-json/wp/v2/users/me
[WordPress] ✅ Connection successful for user: Admin
```
→ **Berarti credentials BENAR** ✅ (error mungkin sebelumnya)

Jika terlihat:
```
[WordPress] Connection failed (401): Unauthorized
```
→ **Credentials SALAH** ❌ Re-check steps 1-5

---

## 🎯 Root Causes 401 Error

| Penyebab | Solusi |
|----------|--------|
| Username salah | Catat dari WordPress Users page |
| App Password salah/expired | Buat app password baru |
| User bukan Administrator | Change user role ke Administrator |
| REST API disabled | Verify `/wp-json/` accessible di browser |
| WordPress < 5.3 | Update WordPress |
| Auto-generated password | Copy password sebelum meninggalkan page |

---

## 📱 Test dengan Curl (Advanced)

```bash
# Replace values:
USERNAME="admin"
APP_PASSWORD="abcd efgh ijkl mnop"
WP_URL="https://example.com"

# Run:
curl -u "$USERNAME:$APP_PASSWORD" \
  "$WP_URL/wp-json/wp/v2/users/me"

# Result:
# Success (200):
# {
#   "id": 1,
#   "username": "admin",
#   "name": "Administrator",
#   ...
# }

# Failed (401):
# {
#   "code": "rest_forbidden",
#   "message": "Sorry, you are not allowed to do that."
# }
```

---

## ✨ Success Indicator

Jika berhasil, Anda bisa:

1. **Save Settings** tanpa error ✅
2. **Click "Create & Publish Now"** di Home page ✅
3. **Post muncul di WordPress** ✅
4. **Lihat di Logs page** dengan status "Success" ✅

---

## 📚 More Help

- **Detailed Guide**: [WORDPRESS_SETUP.md](./WORDPRESS_SETUP.md)
- **README Troubleshooting**: [README.md#-troubleshooting](./README.md#-troubleshooting)

---

**Sudah berhasil? Great! Enjoy AutoPost! 🎉**
