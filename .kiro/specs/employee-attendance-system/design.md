# Design Document — Employee Attendance System

## Overview

Sistem Absensi Karyawan dibangun di atas Next.js 14 (App Router) dengan Supabase sebagai backend-as-a-service. Seluruh komputasi face recognition berjalan di sisi browser menggunakan face-api.js tanpa mengirim gambar wajah ke server. Validasi geofencing dilakukan client-side menggunakan browser Geolocation API. Supabase menyediakan PostgreSQL (data store), Auth (autentikasi + session management), Storage (penyimpanan Face Descriptor), dan Row Level Security (otorisasi).

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                      │
│                                                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │
│  │  Next.js App   │  │  face-api.js   │  │ Geolocation│ │
│  │  (App Router)  │  │  (Face Recog.) │  │    API     │ │
│  └───────┬────────┘  └───────┬────────┘  └─────┬──────┘ │
│          │                   │                  │         │
│          └───────────────────┴──────────────────┘         │
│                              │                            │
└──────────────────────────────┼────────────────────────────┘
                               │ HTTPS / Supabase Client SDK
┌──────────────────────────────┼────────────────────────────┐
│                    Supabase                                │
│                              │                            │
│  ┌────────────┐  ┌───────────┴──┐  ┌────────────────────┐│
│  │ Supabase   │  │  PostgreSQL  │  │  Supabase Storage  ││
│  │    Auth    │  │  + RLS       │  │  (Face Descriptors)││
│  └────────────┘  └──────────────┘  └────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### Request Flow — Clock In

```
Employee Browser
      │
      ├─1─► Request camera & GPS permissions
      │
      ├─2─► Geofence Validator: get GPS coords → calculate distance
      │      IF distance > radius → reject with error
      │
      ├─3─► Face Recognizer: activate camera, load Face Descriptor from Supabase Storage
      │      Real-time face detection via face-api.js
      │      IF match confidence ≥ threshold → proceed
      │      ELSE → reject with error
      │
      └─4─► Supabase: insert attendance_records row (clock_in_time, employee_id, gps_coords)
```

---

## Directory Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (employee)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── attendance/
│   │   │   └── page.tsx          ← Clock In / Clock Out page
│   │   └── history/
│   │       └── page.tsx
│   ├── (admin)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── attendance/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── geofence/
│   │           └── page.tsx
│   ├── middleware.ts              ← Route protection + role-based redirect
│   └── layout.tsx
├── components/
│   ├── attendance/
│   │   ├── FaceRecognizer.tsx    ← Webcam + face-api.js component
│   │   └── AttendanceButton.tsx
│   ├── admin/
│   │   ├── EmployeeTable.tsx
│   │   ├── AttendanceTable.tsx
│   │   └── GeofenceForm.tsx
│   └── ui/                       ← Shared UI primitives
├── lib/
│   ├── supabase/
│   │   ├── client.ts             ← Browser Supabase client
│   │   ├── server.ts             ← Server Supabase client (Server Components/Actions)
│   │   └── admin.ts              ← Supabase Admin client (service role)
│   ├── face/
│   │   ├── faceRecognition.ts    ← face-api.js wrapper
│   │   └── descriptorStorage.ts ← Load/save descriptor to/from Storage
│   ├── geo/
│   │   └── geofence.ts           ← GPS & distance calculation utilities
│   └── utils/
│       ├── csv.ts                ← CSV generation
│       └── dateTime.ts          ← Duration calculation helpers
├── hooks/
│   ├── useGeolocation.ts
│   ├── useFaceRecognizer.ts
│   └── useAttendanceStatus.ts
├── types/
│   └── index.ts                  ← Shared TypeScript types
└── actions/
    ├── attendance.ts             ← Server Actions: clockIn, clockOut
    ├── employees.ts              ← Server Actions: CRUD karyawan
    └── geofence.ts               ← Server Actions: CRUD geofence config
```

---

## Data Models

### PostgreSQL Tables

#### `employees`

```sql
CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  position        TEXT NOT NULL,
  department      TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  face_descriptor_path TEXT,           -- path di Supabase Storage
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `attendance_records`

```sql
CREATE TABLE attendance_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id),
  date            DATE NOT NULL,
  clock_in_time   TIMESTAMPTZ NOT NULL,
  clock_out_time  TIMESTAMPTZ,                     -- NULL = belum clock out
  duration_minutes INTEGER,                        -- dihitung saat clock out
  clock_in_lat    DOUBLE PRECISION NOT NULL,
  clock_in_lng    DOUBLE PRECISION NOT NULL,
  clock_out_lat   DOUBLE PRECISION,
  clock_out_lng   DOUBLE PRECISION,
  correction_note TEXT,
  corrected_by    UUID REFERENCES auth.users(id),
  corrected_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, date)                       -- satu record per hari per karyawan
);
```

#### `geofence_config`

```sql
CREATE TABLE geofence_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL CHECK (radius_meters > 0),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Hanya satu baris dengan is_active = TRUE yang diizinkan (enforced via trigger atau app logic)
```

#### `attendance_deletion_logs`

```sql
CREATE TABLE attendance_deletion_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_by      UUID NOT NULL REFERENCES auth.users(id),
  deleted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  employee_id     UUID NOT NULL,
  record_date     DATE NOT NULL,
  clock_in_time   TIMESTAMPTZ NOT NULL,
  clock_out_time  TIMESTAMPTZ,
  duration_minutes INTEGER,
  reason          TEXT
);
```

### TypeScript Types

```typescript
// types/index.ts

export type UserRole = 'admin' | 'employee';

export interface UserMetadata {
  role: UserRole;
  employee_id?: string;
}

export interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  position: string;
  department: string;
  is_active: boolean;
  face_descriptor_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;            // ISO date string "YYYY-MM-DD"
  clock_in_time: string;   // ISO datetime string
  clock_out_time: string | null;
  duration_minutes: number | null;
  clock_in_lat: number;
  clock_in_lng: number;
  clock_out_lat: number | null;
  clock_out_lng: number | null;
  correction_note: string | null;
  corrected_by: string | null;
  corrected_at: string | null;
}

export interface GeofenceConfig {
  id: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
}

export interface GpsCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface AttendanceFilter {
  employee_name?: string;
  department?: string;
  date_from?: string;
  date_to?: string;
}
```

### Face Descriptor Storage

Face Descriptor disimpan di Supabase Storage bucket `face-descriptors` dengan path:

```
face-descriptors/{employee_id}/descriptor.json
```

Format file:
```json
{
  "employee_id": "uuid",
  "descriptor": [0.123, -0.456, ...],   // Float32Array sebagai number[]
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Components and Interfaces

### `FaceRecognizer` Component

Komponen React yang mengelola seluruh lifecycle face recognition di sisi browser.

```typescript
interface FaceRecognizerProps {
  employeeId: string;
  onSuccess: (confidence: number) => void;
  onError: (error: FaceRecognitionError) => void;
  mode: 'register' | 'verify';
}

type FaceRecognitionError =
  | { type: 'camera_denied' }
  | { type: 'no_descriptor_registered' }
  | { type: 'face_not_detected' }
  | { type: 'face_mismatch'; confidence: number };
```

Alur internal:
1. Request camera permission via `getUserMedia`
2. Load Face Descriptor dari Supabase Storage (mode `verify`)
3. Jalankan `faceapi.detectSingleFace().withFaceLandmarks().withFaceDescriptor()` per frame
4. Bandingkan descriptor hasil deteksi dengan descriptor tersimpan menggunakan Euclidean distance
5. Jika distance < threshold (default: 0.6), panggil `onSuccess`

### `useGeolocation` Hook

```typescript
interface GeolocationState {
  coords: GpsCoords | null;
  error: GeolocationPositionError | null;
  loading: boolean;
}

function useGeolocation(): GeolocationState
```

### Geofence Utility

```typescript
// lib/geo/geofence.ts

/**
 * Menghitung jarak dalam meter antara dua titik koordinat
 * menggunakan formula Haversine.
 */
function calculateDistance(
  point: GpsCoords,
  center: Pick<GeofenceConfig, 'latitude' | 'longitude'>
): number;

/**
 * Mengembalikan true jika point berada dalam radius dari center.
 */
function isWithinGeofence(
  point: GpsCoords,
  config: GeofenceConfig
): boolean;
```

### Server Actions

```typescript
// actions/attendance.ts

interface ClockInPayload {
  employee_id: string;
  gps_coords: GpsCoords;
  // face validation sudah dilakukan client-side sebelum memanggil action ini
}

interface ClockOutPayload {
  attendance_record_id: string;
  employee_id: string;
  gps_coords: GpsCoords;
}

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

async function clockIn(payload: ClockInPayload): Promise<ActionResult<AttendanceRecord>>;
async function clockOut(payload: ClockOutPayload): Promise<ActionResult<AttendanceRecord>>;
```

---

## Testing Strategy

### Pendekatan Pengujian

Sistem ini menggunakan **dual testing approach** — unit tests untuk verifikasi perilaku spesifik dan example-based tests untuk integrasi, ditambah property-based tests untuk memverifikasi invariant universal di seluruh input yang bervariasi.

### Unit Tests

Fokus pada fungsi murni dan logika bisnis yang dapat diuji secara terisolasi:

- **`calculateDistance` / `isWithinGeofence`** — uji formula Haversine dengan koordinat yang diketahui jaraknya; verifikasi batas radius (tepat di batas, di dalam, di luar); uji sifat simetris dan jarak nol untuk titik yang sama.
- **`duration_minutes` calculation** — uji perhitungan selisih menit antara `clock_in_time` dan `clock_out_time` dengan berbagai kombinasi waktu.
- **CSV generation (`lib/utils/csv.ts`)** — uji bahwa output CSV mengandung header yang benar dan setiap baris mencerminkan data record secara akurat, termasuk field kosong (belum clock out).
- **Face Descriptor serialization** — uji bahwa `Float32Array` di-serialize ke `number[]` dan dapat di-deserialize kembali dengan nilai identik (round-trip).
- **RLS policy logic** — uji unit query Supabase dengan mock client untuk memverifikasi bahwa filter `user_id = auth.uid()` diterapkan.

### Integration Tests

Uji end-to-end dengan Supabase instance test (atau mock):

- **Clock In flow** — verifikasi bahwa record dibuat dengan `employee_id`, `date`, `clock_in_time`, dan koordinat GPS yang benar.
- **Clock Out flow** — verifikasi bahwa record diperbarui dengan `clock_out_time` dan `duration_minutes` yang dihitung dengan benar.
- **Duplicate Clock In rejection** — pastikan percobaan Clock In kedua pada hari yang sama menghasilkan error, bukan record baru.
- **Geofence enforcement** — verifikasi bahwa koordinat di luar radius menghasilkan rejection sebelum record dibuat.
- **Admin CRUD karyawan** — uji create, update, dan deactivate karyawan; verifikasi historical records tidak terhapus saat deactivate.
- **CSV export dengan filter** — uji bahwa CSV yang diunduh hanya mengandung record yang sesuai filter aktif.
- **Deletion audit log** — verifikasi bahwa setiap penghapusan Attendance Record selalu menghasilkan entri di `attendance_deletion_logs`.

### Property-Based Tests

Uji property universal menggunakan library seperti **fast-check** (TypeScript) dengan minimum 100 iterasi per property:

- **Property 9 — Geofence distance correctness**: Untuk sembarang koordinat, `calculateDistance` harus konsisten dengan formula Haversine (simetris, jarak nol untuk titik sama, triangle inequality).
- **Property 7 — Face Descriptor round-trip**: Untuk sembarang `Float32Array` descriptor yang valid, serialize → deserialize harus menghasilkan array dengan nilai identik.
- **Property 16 — Attendance history isolation**: Untuk sembarang karyawan yang login, query history hanya boleh mengembalikan record milik karyawan tersebut.
- **Property 17 — Date range filter correctness**: Untuk sembarang rentang tanggal, seluruh record yang dikembalikan harus memiliki `date` dalam rentang tersebut (inklusif).
- **Property 19 — CSV matches active filters**: Untuk sembarang kombinasi filter, jumlah baris CSV harus sama dengan jumlah record yang ditampilkan di tabel.

### Face Recognition Testing

Face recognition berjalan sepenuhnya client-side, sehingga pengujian difokuskan pada:

- **Unit test `faceRecognition.ts`** — mock `face-api.js` untuk uji logika threshold; pastikan distance < 0.6 menghasilkan `onSuccess` dan distance ≥ 0.6 menghasilkan `onError({ type: 'face_mismatch' })`.
- **Unit test error paths** — uji `camera_denied`, `no_descriptor_registered`, dan `face_not_detected` secara terisolasi.
- **Model loading** — smoke test bahwa model weights tersedia di `/public/models/` dan dapat di-load tanpa error.

### RLS / Security Tests

- Verifikasi bahwa Employee tidak dapat membaca `attendance_records` karyawan lain via Supabase client (uji dengan dua user berbeda).
- Verifikasi bahwa endpoint dan Server Actions yang hanya untuk Admin mengembalikan error atau redirect jika dipanggil dengan session Employee.
- Verifikasi bahwa data yang tersimpan di Supabase Storage di bawah `face-descriptors/` adalah JSON numerik, bukan file gambar.

### Test Configuration

| Jenis Test | Tool/Library | Target Coverage |
|---|---|---|
| Unit tests | Jest + Testing Library | Fungsi pure, hooks |
| Integration tests | Jest + Supabase test instance | Server Actions, RLS |
| Property-based tests | fast-check | Invariant universal |
| E2E tests (opsional) | Playwright | Happy path Clock In/Out |

Tag format untuk property tests: `Feature: employee-attendance-system, Property {N}: {property_text}`

---

## Authentication & Authorization

### Middleware (Next.js)

`src/app/middleware.ts` berjalan pada setiap request. Logika:

1. Cek apakah ada session Supabase yang valid.
2. Jika tidak ada session → redirect ke `/login` (kecuali untuk route `/login` itu sendiri).
3. Jika ada session → baca `user.user_metadata.role`.
4. Jika role `employee` mencoba mengakses path `/admin/*` → redirect ke `/employee/dashboard`.
5. Jika role `admin` mencoba mengakses path `/employee/*` → izinkan atau redirect ke `/admin/dashboard`.

### Supabase RLS Policies

```sql
-- Employees: Employee hanya bisa baca data sendiri
CREATE POLICY "employees_select_own" ON employees
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "employees_admin_all" ON employees
  FOR ALL USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Attendance Records: Employee hanya bisa baca/tulis milik sendiri
CREATE POLICY "attendance_select_own" ON attendance_records
  FOR SELECT USING (
    employee_id = (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "attendance_insert_own" ON attendance_records
  FOR INSERT WITH CHECK (
    employee_id = (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "attendance_admin_all" ON attendance_records
  FOR ALL USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Geofence Config: Hanya Admin bisa baca dan tulis
CREATE POLICY "geofence_admin_all" ON geofence_config
  FOR ALL USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Employee bisa READ geofence config (untuk validasi client-side)
CREATE POLICY "geofence_employee_read" ON geofence_config
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );
```

---

## Face Recognition Pipeline

### Model Loading

face-api.js membutuhkan model weights yang di-load dari `/public/models/`:
- `ssd_mobilenetv1` — deteksi wajah
- `face_landmark_68_model` — deteksi landmark
- `face_recognition_model` — menghasilkan face descriptor (128-dim)

Model di-load sekali saat komponen `FaceRecognizer` mount.

### Threshold Konfigurasi

| Parameter | Default | Keterangan |
|---|---|---|
| `FACE_MATCH_THRESHOLD` | 0.6 | Euclidean distance; lebih rendah = lebih ketat |
| `GPS_TIMEOUT_MS` | 10000 | Timeout permintaan GPS |
| `GPS_MAX_AGE_MS` | 5000 | Maksimum usia cached GPS position |

Threshold dapat dikonfigurasi via environment variable `NEXT_PUBLIC_FACE_MATCH_THRESHOLD`.

### Security: No Image Persistence

Face Recognizer didesain untuk:
1. Hanya menerima stream video dari `getUserMedia`
2. Mengekstrak Face Descriptor (128 angka float) dari frame
3. Hanya descriptor (bukan gambar) yang dikirim/disimpan
4. Stream dihentikan segera setelah verification selesai

---

## CSV Export

Format CSV untuk laporan absensi:

```
Nama Karyawan,Departemen,Tanggal,Jam Masuk,Jam Keluar,Durasi (Jam),Catatan Koreksi
John Doe,Engineering,2024-01-15,08:00:00,17:00:00,9.0,
Jane Smith,HR,2024-01-15,08:15:00,17:30:00,9.25,Koreksi manual: jam masuk disesuaikan
```

CSV dibuat seluruhnya di server (Server Action) berdasarkan filter yang aktif saat pengunduhan.

---

## Dashboard Statistics

Statistik dashboard Admin dihitung via Supabase query:

```sql
-- Jumlah karyawan yang sudah Clock In hari ini
SELECT COUNT(*) FROM attendance_records
WHERE date = CURRENT_DATE AND clock_in_time IS NOT NULL;

-- Jumlah karyawan belum hadir (aktif - sudah clock in)
SELECT COUNT(*) FROM employees WHERE is_active = TRUE
MINUS
SELECT COUNT(DISTINCT employee_id) FROM attendance_records WHERE date = CURRENT_DATE;

-- Tingkat kehadiran bulanan per departemen
SELECT
  e.department,
  COUNT(DISTINCT ar.employee_id)::FLOAT / COUNT(DISTINCT e.id) * 100 AS attendance_rate
FROM employees e
LEFT JOIN attendance_records ar
  ON ar.employee_id = e.id
  AND ar.date BETWEEN date_trunc('month', CURRENT_DATE) AND CURRENT_DATE
WHERE e.is_active = TRUE
GROUP BY e.department;
```

Untuk realtime update, komponen dashboard menggunakan Supabase Realtime subscription pada tabel `attendance_records`.

---

## Error Handling

Setiap lapisan sistem menangani error secara eksplisit:

| Kondisi Error | Lokasi | Respons |
|---|---|---|
| GPS permission denied | `useGeolocation` hook | Error state → tampilkan pesan, blokir proses |
| GPS timeout | `useGeolocation` hook | Error state → tampilkan pesan, izinkan retry |
| Kamera permission denied | `FaceRecognizer` component | `onError({ type: 'camera_denied' })` |
| Di luar geofence | Client-side sebelum Server Action | Tampilkan pesan, tolak proses |
| Wajah tidak terdeteksi | `FaceRecognizer` component | `onError({ type: 'face_not_detected' })` |
| Wajah tidak cocok | `FaceRecognizer` component | `onError({ type: 'face_mismatch', confidence })` |
| Descriptor belum terdaftar | Server Action / Storage lookup | `ActionResult.error` → tampilkan pesan |
| Clock In duplikat | Server Action | `ActionResult.error` → tampilkan pesan |
| Geofence belum dikonfigurasi | Server Action / middleware check | Halaman attendance menampilkan pesan |
| Supabase error | Server Action | Log server-side, kembalikan generic error ke client |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Invalid Credentials Always Rejected

*For any* kombinasi email dan password yang tidak valid (tidak ada di sistem atau salah password), sistem harus selalu mengembalikan pesan error tanpa mengungkap detail keamanan internal.

**Validates: Requirements 1.3**

---

### Property 2: Protected Routes Require Active Session

*For any* route yang memerlukan autentikasi, mengakses route tersebut tanpa session aktif harus selalu menghasilkan redirect ke halaman login.

**Validates: Requirements 1.5**

---

### Property 3: Role Assignment from Auth Metadata

*For any* pengguna yang berhasil login, peran yang ditetapkan sistem harus selalu sesuai persis dengan nilai `role` di metadata Supabase Auth pengguna tersebut.

**Validates: Requirements 1.6**

---

### Property 4: Employee Creation Round-Trip

*For any* data karyawan yang valid (nama, email, jabatan, departemen), setelah Admin menambahkan karyawan, data tersebut harus dapat diambil kembali dari database dengan nilai yang identik, dan akun Auth yang sesuai harus ada.

**Validates: Requirements 2.2**

---

### Property 5: Profile Update Consistency

*For any* karyawan yang ada dan *any* set update data profil yang valid, setelah update dilakukan, mengambil profil karyawan tersebut harus mengembalikan nilai yang mencerminkan perubahan yang dilakukan.

**Validates: Requirements 2.3**

---

### Property 6: Deactivation Preserves Historical Records

*For any* karyawan aktif dengan riwayat attendance records, setelah dinonaktifkan, seluruh attendance records historis harus tetap ada di database dan tidak berubah, sementara hak akses login harus dicabut.

**Validates: Requirements 2.4**

---

### Property 7: Face Descriptor Storage Round-Trip

*For any* Face Descriptor yang valid milik seorang karyawan, setelah disimpan ke Supabase Storage, descriptor tersebut harus dapat diambil kembali dengan nilai numerik yang identik menggunakan employee ID.

**Validates: Requirements 2.6**

---

### Property 8: Single Active Geofence Config

*For any* urutan operasi penyimpanan geofence config (berapapun kali disimpan), harus selalu ada tepat satu config dengan status `is_active = TRUE` pada satu waktu.

**Validates: Requirements 3.3**

---

### Property 9: Geofence Distance Calculation Correctness

*For any* titik koordinat GPS dan *any* geofence config, jarak yang dihitung oleh `calculateDistance` harus secara matematika konsisten dengan formula Haversine; titik yang sama dengan pusat geofence harus menghasilkan jarak nol, dan jarak harus memenuhi sifat simetris.

**Validates: Requirements 4.4, 5.2**

---

### Property 10: Location Outside Geofence Rejects Clock In and Clock Out

*For any* koordinat yang jaraknya melebihi radius geofence yang dikonfigurasi, proses Clock In maupun Clock Out harus selalu ditolak dengan pesan error yang sesuai.

**Validates: Requirements 4.5, 5.3**

---

### Property 11: Successful Face Match Creates Attendance Record

*For any* karyawan dengan Face Descriptor terdaftar yang wajahnya berhasil dicocokkan dengan confidence melebihi threshold, proses Clock In harus selalu menghasilkan Attendance Record baru di database dengan timestamp yang akurat dan employee ID yang benar.

**Validates: Requirements 4.7**

---

### Property 12: Unregistered or Mismatched Face Rejects Clock In and Clock Out

*For any* wajah yang tidak cocok dengan descriptor tersimpan (atau karyawan yang belum mendaftarkan wajah), baik Clock In maupun Clock Out harus selalu ditolak.

**Validates: Requirements 4.8, 4.9, 5.6**

---

### Property 13: No Duplicate Clock In

*For any* karyawan yang sudah memiliki Attendance Record pada hari yang sama dengan `clock_out_time IS NULL`, percobaan Clock In kedua pada hari yang sama harus selalu ditolak.

**Validates: Requirements 4.10**

---

### Property 14: Clock Out Requires Prior Clock In

*For any* karyawan yang tidak memiliki Attendance Record Clock In pada hari yang sama, percobaan Clock Out harus selalu ditolak.

**Validates: Requirements 5.1**

---

### Property 15: Clock Out Updates Record with Correct Duration

*For any* karyawan dengan Clock In yang valid, setelah Clock Out berhasil, Attendance Record harus memiliki `clock_out_time` yang terisi dan `duration_minutes` yang dihitung dengan benar sebagai selisih antara `clock_out_time` dan `clock_in_time` dalam satuan menit.

**Validates: Requirements 5.5**

---

### Property 16: Employee Attendance History Isolation

*For any* karyawan yang sedang login, seluruh Attendance Record yang ditampilkan harus merupakan milik karyawan tersebut; tidak boleh ada satu pun record dari karyawan lain yang muncul.

**Validates: Requirements 6.1, 6.3**

---

### Property 17: Date Range Filter Returns Only In-Range Records

*For any* filter rentang tanggal yang diberikan, seluruh Attendance Record yang dikembalikan harus memiliki `date` yang berada dalam rentang tersebut (inklusif kedua batas).

**Validates: Requirements 6.2, 7.1, 7.2**

---

### Property 18: Missing Clock Out Displays Correct Status

*For any* Attendance Record dengan `clock_out_time IS NULL`, status yang ditampilkan harus selalu "Belum Clock Out".

**Validates: Requirements 6.4**

---

### Property 19: CSV Export Matches Active Filters

*For any* kombinasi filter aktif saat pengunduhan, file CSV yang dihasilkan harus mengandung tepat record yang sama dengan yang ditampilkan di tabel (tidak lebih, tidak kurang), lengkap dengan kolom: nama karyawan, departemen, tanggal, jam masuk, jam keluar, dan durasi.

**Validates: Requirements 7.3, 7.4**

---

### Property 20: Correction Note Preserved with Admin Identity

*For any* Attendance Record yang diberi catatan koreksi, setelah disimpan, record tersebut harus mengandung catatan koreksi yang tidak berubah beserta identitas Admin yang melakukan koreksi dan timestamp koreksi.

**Validates: Requirements 7.5**

---

### Property 21: Deletion Always Creates Audit Log

*For any* Attendance Record yang dihapus oleh Admin, sebuah entri log penghapusan harus selalu dibuat di `attendance_deletion_logs` yang mengandung: identitas Admin, waktu penghapusan, dan seluruh data record yang dihapus.

**Validates: Requirements 7.6**

---

### Property 22: Dashboard Counts Match Actual Data

*For any* state data attendance pada hari ini, jumlah yang ditampilkan di dashboard (sudah clock in, belum hadir, karyawan aktif) harus secara aritmetika konsisten dengan jumlah aktual record di database.

**Validates: Requirements 8.1, 8.2**

---

### Property 23: Admin-Only Endpoints Reject Employee Role

*For any* endpoint atau route yang didesain hanya untuk Admin, request dari pengguna dengan role `employee` harus selalu ditolak atau di-redirect, tidak pernah mengembalikan data Admin.

**Validates: Requirements 9.2, 9.3**

---

### Property 24: Only Descriptors Stored — No Raw Images

*For any* proses pendaftaran wajah, data yang tersimpan di Supabase Storage harus selalu berupa representasi numerik (array of float) dan tidak pernah berupa file gambar (JPEG, PNG, atau format gambar lainnya).

**Validates: Requirements 9.4**
