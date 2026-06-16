# API Documentation

Dokumentasi struktur database dan API Supabase untuk Sistem Absensi Karyawan.

## Database Schema

### Table: `employees`

Menyimpan data karyawan.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMP | Waktu pembuatan record |
| updated_at | TIMESTAMP | Waktu update terakhir |
| user_id | UUID | Foreign key ke auth.users |
| full_name | TEXT | Nama lengkap karyawan |
| email | TEXT | Email (unique) |
| position | TEXT | Jabatan |
| department | TEXT | Departemen |
| is_active | BOOLEAN | Status aktif/nonaktif |
| face_descriptor_url | TEXT | Path ke file face descriptor di storage |

### Table: `attendance_records`

Menyimpan catatan absensi.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMP | Waktu pembuatan record |
| updated_at | TIMESTAMP | Waktu update terakhir |
| employee_id | UUID | Foreign key ke employees |
| date | DATE | Tanggal absensi |
| clock_in_time | TIMESTAMP | Waktu clock in |
| clock_out_time | TIMESTAMP | Waktu clock out |
| clock_in_lat | DECIMAL | Latitude saat clock in |
| clock_in_lng | DECIMAL | Longitude saat clock in |
| clock_out_lat | DECIMAL | Latitude saat clock out |
| clock_out_lng | DECIMAL | Longitude saat clock out |
| duration_minutes | INTEGER | Durasi kehadiran (menit) |
| status | TEXT | 'present', 'absent', atau 'incomplete' |
| notes | TEXT | Catatan tambahan |
| corrected_by | UUID | User ID yang melakukan koreksi |
| correction_reason | TEXT | Alasan koreksi |

Constraints:
- UNIQUE(employee_id, date) - Satu karyawan hanya bisa punya satu record per hari

### Table: `geofence_config`

Menyimpan konfigurasi geofencing.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMP | Waktu pembuatan record |
| updated_at | TIMESTAMP | Waktu update terakhir |
| center_lat | DECIMAL | Latitude pusat area |
| center_lng | DECIMAL | Longitude pusat area |
| radius_meters | INTEGER | Radius area dalam meter |
| is_active | BOOLEAN | Status aktif/nonaktif |

### Table: `audit_logs`

Menyimpan log aktivitas untuk audit trail.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMP | Waktu log dibuat |
| user_id | UUID | User yang melakukan aksi |
| action | TEXT | Jenis aksi (CREATE, UPDATE, DELETE) |
| table_name | TEXT | Nama table yang dimodifikasi |
| record_id | UUID | ID record yang dimodifikasi |
| old_data | JSONB | Data sebelum modifikasi |
| new_data | JSONB | Data setelah modifikasi |
| description | TEXT | Deskripsi aksi |

## Row Level Security (RLS) Policies

### Employees Table

**Admin Full Access**
```sql
Admin can do everything on employees table
```

**Employee Read Own**
```sql
Employee can only read their own employee record
WHERE user_id = auth.uid()
```

### Attendance Records Table

**Admin Full Access**
```sql
Admin can do everything on attendance_records table
```

**Employee Read Own**
```sql
Employee can only read their own attendance records
WHERE employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
```

**Employee Insert Own**
```sql
Employee can only insert their own attendance
WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid() AND is_active = true))
```

**Employee Update Own**
```sql
Employee can only update their own incomplete attendance
WHERE employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid() AND is_active = true)
```

### Geofence Config Table

**Read Active Config**
```sql
Anyone authenticated can read active geofence config
WHERE is_active = true
```

**Admin Modify**
```sql
Only admin can modify geofence config
```

### Audit Logs Table

**Admin Read**
```sql
Only admin can read audit logs
```

**Insert Logs**
```sql
Any authenticated user can insert audit logs (for system tracking)
```

## Storage Buckets

### face-descriptors

Private bucket untuk menyimpan face descriptor files.

**Policies:**
- Admin dapat upload files
- Authenticated users dapat read files
- Admin dapat delete files

**File Format:**
Files disimpan sebagai plain text berisi Base64 encoded Float32Array dari face descriptor.

## Common Queries

### Get Employee with User Info
```typescript
const { data, error } = await supabase
  .from('employees')
  .select('*, user:auth.users(*)')
  .eq('id', employeeId)
  .single();
```

### Get Today's Attendance for Employee
```typescript
const today = new Date().toISOString().split('T')[0];
const { data, error } = await supabase
  .from('attendance_records')
  .select('*')
  .eq('employee_id', employeeId)
  .eq('date', today)
  .single();
```

### Get Attendance with Employee Info
```typescript
const { data, error } = await supabase
  .from('attendance_records')
  .select('*, employee:employees(*)')
  .order('date', { ascending: false });
```

### Get Active Geofence Config
```typescript
const { data, error } = await supabase
  .from('geofence_config')
  .select('*')
  .eq('is_active', true)
  .single();
```

### Clock In
```typescript
const { error } = await supabase
  .from('attendance_records')
  .insert({
    employee_id: employeeId,
    date: today,
    clock_in_time: new Date().toISOString(),
    clock_in_lat: latitude,
    clock_in_lng: longitude,
    status: 'incomplete'
  });
```

### Clock Out
```typescript
const { error } = await supabase
  .from('attendance_records')
  .update({
    clock_out_time: new Date().toISOString(),
    clock_out_lat: latitude,
    clock_out_lng: longitude,
    duration_minutes: calculateDuration(clockInTime, clockOutTime),
    status: 'present'
  })
  .eq('id', recordId);
```

## Authentication

### User Metadata Structure

```typescript
{
  role: 'admin' | 'employee',
  full_name: string
}
```

### Check User Role
```typescript
const { data: { user } } = await supabase.auth.getUser();
const role = user?.user_metadata?.role || 'employee';
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

## Storage Operations

### Upload Face Descriptor
```typescript
const blob = new Blob([descriptorData], { type: 'text/plain' });
const fileName = `${employeeId}.txt`;

const { data, error } = await supabase.storage
  .from('face-descriptors')
  .upload(fileName, blob, {
    upsert: true
  });
```

### Download Face Descriptor
```typescript
const { data, error } = await supabase.storage
  .from('face-descriptors')
  .download(fileName);

const text = await data.text();
const descriptor = base64ToDescriptor(text);
```

### Delete Face Descriptor
```typescript
const { error } = await supabase.storage
  .from('face-descriptors')
  .remove([fileName]);
```

## Error Handling

Common Supabase error codes:

- `PGRST116`: No rows returned (for .single() queries)
- `23505`: Unique constraint violation
- `23503`: Foreign key violation
- `42501`: Insufficient privileges (RLS policy violation)

Example error handling:
```typescript
try {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No data found
    } else if (error.code === '23505') {
      // Duplicate entry
    } else {
      // Other error
    }
  }
} catch (err) {
  // Network or unexpected error
}
```

## Real-time Subscriptions

Listen to attendance changes:
```typescript
const channel = supabase
  .channel('attendance-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'attendance_records'
    },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();
```

## Performance Tips

1. **Use indexes**: Database schema sudah include indexes untuk query yang sering digunakan
2. **Select only needed columns**: Jangan `SELECT *` jika tidak perlu semua kolom
3. **Use pagination**: Untuk list yang panjang, gunakan `.range(start, end)`
4. **Cache geofence config**: Config jarang berubah, bisa di-cache di client
5. **Batch operations**: Gunakan `.insert([...])` untuk multiple inserts

## Security Best Practices

1. **Never expose service_role key** di client-side code
2. **Always use RLS**: Jangan disable RLS pada production
3. **Validate input**: Client-side dan server-side validation
4. **Use HTTPS**: Wajib untuk production
5. **Rotate keys**: Ganti API keys secara berkala
6. **Audit logs**: Monitor audit_logs untuk aktivitas mencurigakan
