# Supabase Storage Logo Upload Implementation

## ✅ Changes Made

### Backend Changes

#### 1. **Installed Multer** (`npm install multer`)
   - For handling file uploads

#### 2. **Created Upload Middleware** (`src/middleware/upload.js`)
   - Memory storage configuration
   - File type validation (PNG, JPG, GIF, WebP, SVG)
   - File size limit: 2MB

#### 3. **Added Upload Handler** (`src/controllers/brandingController.js`)
   - New function: `uploadLogo()`
   - Validates file type and size
   - Uploads to Supabase Storage bucket: `logos`
   - Generates public URL automatically
   - Updates branding record with logo URL

#### 4. **Updated Branding Routes** (`src/routes/brandingRoute.js`)
   - New route: `POST /api/branding/upload-logo`
   - Protected with `requireSuperuser` middleware
   - Uses `uploadMiddleware.single('logo')`

### Frontend Changes

#### 1. **Updated Branding Settings** (`src/pages/BrandingSettings.jsx`)
   - Replaced URL input with file upload
   - Added `handleLogoUpload()` function
   - File validation on client-side
   - Shows upload progress state
   - Displays success confirmation with preview

#### 2. **Updated Styles** (`src/styles/BrandingSettings.css`)
   - New file upload UI styles
   - Gradient button with dashed border
   - Hover effects and animations
   - Responsive file upload indicator

## 🎯 How It Works

### For Superusers:

1. **Login** as superuser
2. Go to **Admin Panel → Branding → 🏢 General**
3. Click **"📁 Click to upload logo"** button
4. Select image file (max 2MB, PNG/JPG/GIF/WebP/SVG)
5. **Auto uploads** to Supabase Storage bucket `logos`
6. Logo preview appears instantly
7. **Auto-saved** to database

### File Upload Flow:

```
User selects file
    ↓
Client validates (type, size)
    ↓
POST /api/branding/upload-logo (multipart/form-data)
    ↓
Server validates again
    ↓
Upload to Supabase Storage (logos bucket)
    ↓
Generate public URL
    ↓
Update branding in database
    ↓
Return URL to frontend
    ↓
Display logo preview + confirm message
```

## 📦 Supabase Storage Setup

**Bucket Name:** `logos`
**Path Structure:** `logos/{userId}-{timestamp}.{extension}`

The bucket needs to be created in Supabase with:
- Public access for read operations
- RLS Policy allowing authenticated users to upload

### SQL RLS Policy (if needed):
```sql
CREATE POLICY "Allow users to upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND auth.uid()::text = (regexp_split_to_array(name, '-'))[1]
);
```

## 🔧 Testing

1. **Start servers:**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. **Test upload:**
   - Navigate to http://localhost:3000/admin (as superuser)
   - Click logo upload button
   - Select an image file
   - Check if logo appears in sidebar

3. **Verify storage:**
   - Go to Supabase Dashboard
   - Check Storage → logos bucket
   - Confirm file was uploaded with correct permissions

## 🐛 Troubleshooting

### "Bucket does not exist" Error
- Create the `logos` bucket in Supabase Dashboard
- Set it to public for read access

### "File validation failed" Error
- Ensure file is a supported image type
- Check file size is under 2MB
- Verify MIME type is correct

### Logo not appearing in sidebar after upload
- Clear browser cache (Ctrl+Shift+Delete)
- Refresh page
- Check browser console for errors

## 📝 API Endpoints

- **GET** `/api/branding/public` - Get active branding (public)
- **GET** `/api/branding` - Get superuser branding (authenticated)
- **PUT** `/api/branding` - Update branding details
- **POST** `/api/branding/upload-logo` - Upload logo file ✨ NEW

## 🎨 Features

✅ File upload to Supabase Storage
✅ Auto-update branding in database
✅ Public URL generation
✅ Client-side file validation
✅ Server-side security checks
✅ Superuser-only access
✅ Instant preview
✅ Error handling

---

**Status:** Ready for testing! Deploy when Supabase Storage bucket `logos` is configured.
