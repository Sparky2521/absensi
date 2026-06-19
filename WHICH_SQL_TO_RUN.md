# 🤔 Which SQL File Should I Run?

## Quick Answer

**For FRESH setup (first time)**: Use `setup-database-complete.sql` ⭐

**For adding admin only (database already exists)**: Use `create-admin-user.sql`

---

## Detailed Guide

### Scenario 1: Fresh Setup (MOST COMMON) ⭐

**When**: 
- First time setup
- Empty/new Supabase project
- No tables exist yet

**File to use**: `setup-database-complete.sql`

**What it does**:
- ✅ Creates ALL tables (employees, attendance_records, etc)
- ✅ Creates indexes
- ✅ Sets up RLS policies
- ✅ Creates functions & triggers
- ✅ Creates admin user
- ✅ All-in-one solution!

**How to run**:
```
1. Open Supabase Dashboard → SQL Editor
2. Open file: setup-database-complete.sql
3. Copy ALL content (Ctrl+A, Ctrl+C)
4. Paste in SQL Editor (Ctrl+V)
5. Click "Run"
6. Wait ~10 seconds
7. Done!
```

---

### Scenario 2: Tables Exist, Need Admin User

**When**:
- Tables already created
- Just need to add/recreate admin user
- Error: "admin@absensi.com already exists" (need to recreate)

**File to use**: `create-admin-user.sql`

**What it does**:
- ✅ Creates admin user only
- ✅ Links to employees table
- ❌ Does NOT create tables (assumes they exist)

**How to run**:
```
1. Open Supabase Dashboard → SQL Editor
2. Open file: create-admin-user.sql
3. Copy ALL content
4. Paste in SQL Editor
5. Click "Run"
6. Done!
```

---

### Scenario 3: Step-by-Step Setup (MANUAL)

**When**:
- You want full control
- Understanding each step
- Troubleshooting specific issues

**Files to use** (in order):
1. `supabase-schema.sql` (tables, policies, indexes)
2. `create-admin-user.sql` (admin user)

**How to run**:
```
Step 1: Create tables
  → Run: supabase-schema.sql
  → Verify tables created

Step 2: Create admin
  → Run: create-admin-user.sql
  → Verify admin created
```

---

## Error Messages Guide

### Error: "Table employees does not exist"

**You ran**: `create-admin-user.sql` first ❌

**Solution**: Run `setup-database-complete.sql` instead ✅

**Why**: Tables need to be created before admin user

---

### Error: "duplicate key value violates unique constraint"

**Meaning**: Admin user already exists

**Solutions**:

**Option 1** - Skip (if admin already exists):
```
Just ignore this error. Admin user already created.
Verify with: SELECT * FROM auth.users WHERE email = 'admin@absensi.com';
```

**Option 2** - Delete and recreate:
```sql
-- Delete existing admin
DELETE FROM employees WHERE email = 'admin@absensi.com';
DELETE FROM auth.users WHERE email = 'admin@absensi.com';

-- Then run create-admin-user.sql again
```

---

### Error: "permission denied for schema public"

**Meaning**: Wrong user/insufficient permissions

**Solution**: Make sure you're using project owner account in Supabase Dashboard

---

## File Comparison

| File | Tables | Admin User | Use Case |
|------|--------|------------|----------|
| `setup-database-complete.sql` ⭐ | ✅ Yes | ✅ Yes | Fresh setup (RECOMMENDED) |
| `supabase-schema.sql` | ✅ Yes | ❌ No | Tables only |
| `create-admin-user.sql` | ❌ No | ✅ Yes | Admin only |

---

## Decision Flow

```
Start Here
    ↓
Is this fresh/new Supabase project?
    ↓
  YES → Use: setup-database-complete.sql ⭐
    ↓
   DONE!

    ↓
   NO → Do tables exist?
    ↓
  YES → Use: create-admin-user.sql
    ↓
   DONE!

    ↓
   NO → Use: setup-database-complete.sql ⭐
    ↓
   DONE!
```

---

## Verification Queries

After running ANY SQL file, verify with these:

### Check Tables:
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public';

-- Expected: employees, attendance_records, geofence_config, audit_logs
```

### Check Admin User:
```sql
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as role,
    e.full_name,
    e.position
FROM auth.users u
LEFT JOIN employees e ON e.user_id = u.id
WHERE u.email = 'admin@absensi.com';

-- Expected: admin@absensi.com with role='admin'
```

---

## Common Mistakes

### ❌ Mistake 1: Running wrong file
```
User runs: create-admin-user.sql (without tables)
Result: Error "employees does not exist"
Fix: Use setup-database-complete.sql instead
```

### ❌ Mistake 2: Running files in wrong order
```
User runs: 
  1. create-admin-user.sql first
  2. supabase-schema.sql second
Result: Error "admin user exists but no employee record"
Fix: Run in correct order or use setup-database-complete.sql
```

### ❌ Mistake 3: Partial copy-paste
```
User copies only part of SQL file
Result: Incomplete setup
Fix: Copy ALL content (Ctrl+A)
```

---

## Recommended Approach

### For 99% of Users:

```
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run: setup-database-complete.sql
4. Verify admin user created
5. Done!
```

**Time**: 2 minutes
**Complexity**: Easy
**Success rate**: 99%

---

## Files Summary

📄 **setup-database-complete.sql** ⭐
- All-in-one solution
- Fresh setup
- Most user-friendly
- **USE THIS!**

📄 **supabase-schema.sql**
- Tables only
- For manual/step-by-step
- Advanced users

📄 **create-admin-user.sql**
- Admin user only
- Requires existing tables
- For recreating admin

---

## Need Help?

**Still confused?**
→ Use: `setup-database-complete.sql`
→ Read: `FIX_DATABASE_ERROR.md`

**Error during setup?**
→ Read error message carefully
→ Check "Error Messages Guide" above
→ Verify tables exist first

**Want to start over?**
→ Delete project in Supabase
→ Create new project
→ Run: `setup-database-complete.sql`

---

**Bottom Line**: Use `setup-database-complete.sql` for fresh setup! ⭐

🎉 Happy Setup!
