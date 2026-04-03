# Phase 2: Role + API Keys System ✅ COMPLETE

## Apa yang sudah di-implement?

### 1. **Role System**
```
Database: users table sekarang punya column "role"

Roles:
- superuser  → Kamu (Owner) - kontrol semua fitur, manage users
- user       → Buyers - bisa generate posts & post ke WordPress
```

### 2. **API Key Management**
Setiap user dapat:
- Generate unlimited API keys
- Revoke (disable) keys
- Track last_used_at

API Key format: `ap_` + random bytes

**Endpoints:**
- `GET /api/api-keys` - Get all keys
- `POST /api/api-keys` - Create new key
- `PUT /api/api-keys/:keyId` - Update name
- `DELETE /api/api-keys/:keyId` - Revoke key

### 3. **Flexible Authentication**
Backend sekarang support 2 cara auth:

**Option 1: JWT (saat ini)**
```
Authorization: Bearer <jwt_token>
```

**Option 2: API Key (untuk external apps)**
```
Authorization: ApiKey ap_xxxxxxxxxxxxx
```

### 4. **Auto API Key on Registration**
Ketika user register → auto dapat 1 API key (ditampilkan sekali saja!)

---

## Setup Superuser (KAMU)

Kamu harus set email kamu sebagai `superuser`. 

**Langkah:**
1. Register dengan email kamu di aplikasi
2. Di Supabase Dashboard → SQL Editor → jalankan:
```sql
UPDATE users SET role = 'superuser' WHERE email = 'your_email@example.com';
```

Sekarang kamu punya akses ke semua superuser endpoints!

---

## Frontend Components Needed

Aku perlu buat beberapa components:

1. **API Keys Dashboard**
   - List semua keys
   - Tombol create key
   - Copy key value
   - Revoke key

2. **Profile Update (Admin Panel)**
   - Show role (superuser/user)
   - Manage subscription

3. **Users Management (Superuser Only)**
   - List all users
   - Change user role
   - View usage

---

## Testing

### Test User Registration dengan API Key:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@example.com",
    "password": "password123",
    "name": "John Doe"
  }'

# Response:
{
  "success": true,
  "token": "...",
  "user": { "id": "...", "email": "buyer@example.com", "role": "user" },
  "api_key": "ap_xxxxxxxxxxxxx"  # SAVE THIS!
}
```

### Test API Key Auth:
```bash
# Using API key instead of JWT
curl -X GET http://localhost:5000/api/posts \
  -H "Authorization: ApiKey ap_xxxxxxxxxxxxx"
```

---

## Next: Phase 2.5 - Frontend Components

Aku akan buat:
1. **API Key Management Pages**
2. **Admin Panel untuk superuser**
3. **Update user profile form**

Siap?
