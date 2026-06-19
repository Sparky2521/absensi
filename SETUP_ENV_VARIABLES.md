# 🔧 Setup Environment Variables

## ⚠️ ERROR YANG ANDA LIHAT

Aplikasi showing "Failed to fetch" karena environment variables belum dikonfigurasi.

Error di console:
```
ConstructionClientImpl: Multiple GoTrueClient instances detected
```

**Penyebab**: File `.env.local` masih menggunakan placeholder values.

---

## ✅ CARA MEMPERBAIKI (5 MENIT)

### Step 1: Dapatkan Supabase Credentials

1. **Buka Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Login ke project Anda

2. **Klik Settings (ikon gear) di sidebar kiri**

3. **Klik "API" di menu Settings**

4. **Copy 2 nilai ini**:
   
   a. **Project URL**
      - Di bagian "Project URL"
      - Contoh: `https://abcdefghijklmnop.supabase.co`
      - Copy SELURUH URL
   
   b. **anon public key**
      - Di bagian "Project API keys"
      - Cari yang label: `anon` `public`
      - Key yang panjang, dimulai dengan `eyJ...`
      - Copy SELURUH key (sangat panjang, scroll ke kanan)

---

### Step 2: Update File .env.local

1. **Buka file**: `.env.local` (di root project)

2. **Ganti baris ini**:

   **SEBELUM** (placeholder):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   **SESUDAH** (ganti dengan credentials Anda):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxOTQ5NzQ5MCwiZXhwIjoxOTM1MDczNDkwfQ.abcdefghijklmnopqrstuvwxyz1234567890
   ```

3. **JANGAN ganti** yang lain (service role key tidak wajib untuk sekarang)

4. **Save file**: Ctrl+S

---

### Step 3: Restart Development Server

**PENTING**: Environment variables hanya dibaca saat server start!

1. **Stop server** di terminal:
   - Tekan: `Ctrl+C`

2. **Start ulang**:
   ```bash
   npm run dev
   ```

3. **Tunggu** hingga muncul:
   ```
   ✓ Ready in Xs
   ```

4. **Refresh browser** atau buka baru: http://localhost:3000

---

## ✅ Verification

### Check 1: Environment Variables Loaded

Buka terminal, jalankan:
```bash
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

**Jika berhasil**: Akan muncul URL Supabase Anda (bukan "undefined")

### Check 2: Application Loads

1. Buka: http://localhost:3000
2. Seharusnya muncul halaman login
3. TIDAK ada error "Failed to fetch"

### Check 3: Can Connect to Supabase

Di browser console (F12), seharusnya TIDAK ada error:
- ❌ "ConstructionClientImpl error"
- ❌ "Failed to fetch"
- ❌ "Invalid Supabase URL"

---

## 🎯 Common Mistakes & Fixes

### ❌ Mistake 1: Tidak restart server
```
Issue: .env.local diupdate tapi masih error
Fix: WAJIB restart server (Ctrl+C, npm run dev)
```

### ❌ Mistake 2: Copy URL tidak lengkap
```
Issue: URL cuma copy sebagian
Fix: Pastikan copy FULL URL:
     https://abcdefghijklmnop.supabase.co (include https://)
```

### ❌ Mistake 3: Copy key tidak lengkap
```
Issue: anon key sangat panjang, copy tidak sampai akhir
Fix: Scroll ke kanan sampai akhir, lalu copy ALL
     Key dimulai dengan: eyJ... dan sangat panjang
```

### ❌ Mistake 4: Ada spasi atau enter di key
```
Issue: Ada spasi atau line break dalam key
Fix: Pastikan key dalam satu baris, tanpa spasi
```

### ❌ Mistake 5: Lupa save file
```
Issue: Edit .env.local tapi tidak save
Fix: Ctrl+S untuk save
```

---

## 📋 Complete .env.local Example

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxOTQ5NzQ5MCwiZXhwIjoxOTM1MDczNDkwfQ.abcdefghijklmnopqrstuvwxyz1234567890

# Service role key (optional for now)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Face Recognition Configuration
NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD=0.6

# Geofencing Configuration
NEXT_PUBLIC_GEOFENCE_RADIUS=100
```

**Replace**:
- `abcdefghijklmnop` dengan your project ID
- `eyJ...` dengan your actual anon key

---

## 🔍 Where to Find Credentials

```
Supabase Dashboard
    ↓
Settings (gear icon)
    ↓
API
    ↓
┌─────────────────────────────────────┐
│ Configuration                       │
├─────────────────────────────────────┤
│ Project URL                         │
│ https://xxx.supabase.co ← COPY THIS │
├─────────────────────────────────────┤
│ API Keys                            │
│ anon public                         │
│ eyJxxx...very.long.key ← COPY THIS  │
└─────────────────────────────────────┘
```

---

## 🚀 After Fix

Setelah environment variables benar:

1. ✅ Halaman login muncul dengan benar
2. ✅ Tidak ada error di console
3. ✅ Bisa connect ke Supabase
4. ✅ Siap untuk login dengan:
   - Email: admin@absensi.com
   - Password: Admin123!@#

---

## 💡 Pro Tips

1. **Never commit .env.local**
   - Already in .gitignore
   - Keep credentials secret

2. **Use .env.local.example as template**
   - For sharing with team
   - Without actual credentials

3. **Restart server after env changes**
   - Always required
   - Environment only loaded at startup

4. **Double-check for typos**
   - One wrong character = error
   - Copy-paste recommended

5. **Test immediately**
   - After saving .env.local
   - Restart server and test

---

## 📞 Still Having Issues?

### Issue: "Invalid Supabase URL"
→ Check URL format: must start with https://
→ Check no extra spaces

### Issue: "Invalid API key"
→ Check key is complete (very long)
→ Check no line breaks in key

### Issue: Still showing placeholder error
→ Restart VS Code entirely
→ Restart computer if needed

### Issue: Can't find API keys in Supabase
→ Make sure you're in the right project
→ Make sure you have owner/admin access

---

**Next After This**: 
1. Fix .env.local ← YOU ARE HERE
2. Restart server
3. Test login
4. Setup geofencing

🎉 Let's fix those credentials!
