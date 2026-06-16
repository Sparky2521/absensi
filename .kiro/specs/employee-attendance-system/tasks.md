# Implementation Plan: Employee Attendance System

## Overview

Implementasi sistem absensi karyawan berbasis Next.js 14 (App Router) dengan Supabase sebagai backend. Sistem mencakup autentikasi berbasis peran, manajemen karyawan, face recognition client-side menggunakan face-api.js, validasi geofencing via browser GPS, pencatatan absensi, laporan CSV, dan dashboard statistik realtime.

Urutan implementasi: fondasi proyek → database & auth → library utilitas → komponen UI → halaman fitur → integrasi akhir.

---

## Tasks

- [ ] 1. Setup Fondasi Proyek
  - Inisialisasi proyek Next.js 14 dengan App Router, TypeScript, dan Tailwind CSS
  - Install dependensi: `@supabase/supabase-js`, `@supabase/ssr`, `face-api.js`, `fast-check`, `jest`, `@testing-library/react`
  - Buat file `src/types/index.ts` berisi seluruh TypeScript types: `UserRole`, `UserMetadata`, `Employee`, `AttendanceRecord`, `GeofenceConfig`, `GpsCoords`, `AttendanceFilter`, `ActionResult`, dan `FaceRecognitionError`
  - Buat struktur direktori sesuai design: `src/app/(auth)`, `src/app/(employee)`, `src/app/(admin)`, `src/components/attendance`, `src/components/admin`, `src/components/ui`, `src/lib/supabase`, `src/lib/face`, `src/lib/geo`, `src/lib/utils`, `src/hooks`, `src/actions`
  - Simpan environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_FACE_MATCH_THRESHOLD`
  - Download model weights face-api.js (`ssd_mobilenetv1`, `face_landmark_68_model`, `face_recognition_model`) ke `public/models/`
  - _Requirements: 1.1, 9.4, 9.5_

- [ ] 2. Setup Database & Supabase Clients
  - [ ] 2.1 Buat SQL migration untuk tabel `employees`, `attendance_records`, `geofence_config`, dan `attendance_deletion_logs` sesuai schema di design
    - Pastikan semua constraint, index, dan UNIQUE constraint tersedia
    - _Requirements: 2.2, 4.7, 7.6_

  - [ ] 2.2 Buat SQL RLS policies untuk semua tabel: `employees_select_own`, `employees_admin_all`, `attendance_select_own`, `attendance_insert_own`, `attendance_admin_all`, `geofence_admin_all`, `geofence_employee_read`
    - _Requirements: 9.1, 9.2_

  - [ ] 2.3 Buat Supabase Storage bucket `face-descriptors` dengan access policy yang sesuai (admin write, authenticated read own)
    - _Requirements: 2.6, 9.4_

  - [ ] 2.4 Implementasi Supabase client files: `src/lib/supabase/client.ts` (browser client), `src/lib/supabase/server.ts` (server component client menggunakan `@supabase/ssr`), `src/lib/supabase/admin.ts` (service role client)
    - _Requirements: 1.1_

- [ ] 3. Implementasi Library Utilitas Core
  - [ ] 3.1 Implementasi `src/lib/geo/geofence.ts` dengan fungsi `calculateDistance(point, center): number` menggunakan formula Haversine dan `isWithinGeofence(point, config): boolean`
    - _Requirements: 4.4, 4.5, 5.2, 5.3_

  - [ ]* 3.2 Tulis property test untuk `calculateDistance` (Property 9)
    - **Property 9: Geofence Distance Calculation Correctness** — untuk sembarang koordinat, jarak harus simetris, titik identik menghasilkan jarak nol, dan konsisten dengan formula Haversine
    - **Validates: Requirements 4.4, 5.2**

  - [ ] 3.3 Implementasi `src/lib/utils/dateTime.ts` dengan fungsi kalkulasi `duration_minutes` antara dua timestamp ISO
    - _Requirements: 5.5_

  - [ ] 3.4 Implementasi `src/lib/utils/csv.ts` dengan fungsi `generateAttendanceCSV(records, employees): string` yang menghasilkan CSV dengan header: Nama Karyawan, Departemen, Tanggal, Jam Masuk, Jam Keluar, Durasi (Jam), Catatan Koreksi
    - _Requirements: 7.3, 7.4_

  - [ ]* 3.5 Tulis unit test untuk `csv.ts` dan `dateTime.ts`
    - Uji header CSV benar dan setiap baris mencerminkan data record secara akurat termasuk field kosong
    - Uji kalkulasi durasi dengan berbagai kombinasi waktu dan kasus edge (clock out NULL)
    - _Requirements: 7.3, 5.5_

- [ ] 4. Implementasi Face Recognition Library
  - [ ] 4.1 Implementasi `src/lib/face/faceRecognition.ts`: fungsi `loadModels()` untuk memuat model weights dari `/public/models/`, fungsi `detectAndDescribe(videoElement): Float32Array | null` untuk mendeteksi wajah dan menghasilkan descriptor, dan fungsi `matchDescriptor(detected, stored, threshold): boolean` menggunakan Euclidean distance
    - _Requirements: 4.6, 4.7, 4.8, 9.5_

  - [ ] 4.2 Implementasi `src/lib/face/descriptorStorage.ts`: fungsi `saveDescriptor(employeeId, descriptor)` untuk menyimpan Face Descriptor ke Supabase Storage path `face-descriptors/{employee_id}/descriptor.json`, dan fungsi `loadDescriptor(employeeId): Float32Array | null` untuk mengambilnya kembali
    - _Requirements: 2.5, 2.6_

  - [ ]* 4.3 Tulis unit test untuk `faceRecognition.ts` dan property test untuk `descriptorStorage.ts` (Property 7)
    - **Property 7: Face Descriptor Storage Round-Trip** — serialize Float32Array → simpan → load → deserialize harus menghasilkan nilai numerik identik
    - Mock face-api.js untuk uji logika threshold: distance < 0.6 → success, distance ≥ 0.6 → face_mismatch
    - Uji error paths: `camera_denied`, `no_descriptor_registered`, `face_not_detected`
    - **Validates: Requirements 2.6**

- [ ] 5. Implementasi Hooks Client-Side
  - [ ] 5.1 Implementasi `src/hooks/useGeolocation.ts` yang mengembalikan `{ coords, error, loading }`, mendukung timeout (`GPS_TIMEOUT_MS = 10000`) dan max age cached position (`GPS_MAX_AGE_MS = 5000`)
    - _Requirements: 4.1, 4.2, 5.2_

  - [ ] 5.2 Implementasi `src/hooks/useFaceRecognizer.ts` yang mengelola lifecycle kamera (`getUserMedia`), pemuatan model face-api.js, dan state recognition
    - _Requirements: 4.3, 4.6_

  - [ ] 5.3 Implementasi `src/hooks/useAttendanceStatus.ts` yang mengambil status Clock In/Clock Out karyawan hari ini dari Supabase
    - _Requirements: 4.10, 5.1, 6.4_

- [ ] 6. Checkpoint — Validasi Fondasi
  - Pastikan semua unit test dan property test untuk geofence, CSV, dateTime, dan face recognition lulus
  - Pastikan koneksi Supabase berfungsi dan migrasi database sudah diterapkan
  - Pastikan model face-api.js dapat di-load dari `/public/models/` tanpa error
  - Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan.

- [ ] 7. Implementasi Autentikasi & Middleware
  - [ ] 7.1 Buat halaman login `src/app/(auth)/login/page.tsx` dengan form email/password menggunakan Supabase Auth, menampilkan pesan error autentikasi tanpa detail internal saat login gagal
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 7.2 Implementasi `src/app/middleware.ts` untuk:
    - Validasi session Supabase pada setiap request; redirect ke `/login` jika tidak ada session
    - Baca `user.user_metadata.role`; redirect Employee yang mencoba akses `/admin/*` ke `/employee/dashboard`
    - Redirect Admin dari `/employee/*` ke `/admin/dashboard`
    - _Requirements: 1.5, 1.6, 9.2, 9.3_

  - [ ]* 7.3 Tulis unit test untuk middleware (Property 2 dan Property 3)
    - **Property 2: Protected Routes Require Active Session** — semua route yang memerlukan autentikasi harus redirect ke login tanpa session aktif
    - **Property 3: Role Assignment from Auth Metadata** — peran yang ditetapkan harus selalu sesuai dengan nilai `role` di metadata Supabase Auth
    - **Validates: Requirements 1.5, 1.6**

- [ ] 8. Implementasi Server Actions
  - [ ] 8.1 Implementasi `src/actions/attendance.ts`:
    - `clockIn(payload: ClockInPayload): Promise<ActionResult<AttendanceRecord>>` — insert ke `attendance_records`, validasi duplikat Clock In hari yang sama
    - `clockOut(payload: ClockOutPayload): Promise<ActionResult<AttendanceRecord>>` — update record dengan `clock_out_time` dan `duration_minutes`
    - _Requirements: 4.7, 4.10, 5.5_

  - [ ]* 8.2 Tulis property test untuk Server Actions `clockIn` dan `clockOut` (Property 11, 13, 14, 15)
    - **Property 11: Successful Face Match Creates Attendance Record** — Clock In berhasil harus selalu menghasilkan record baru dengan timestamp dan employee_id yang benar
    - **Property 13: No Duplicate Clock In** — Clock In kedua pada hari yang sama harus selalu ditolak
    - **Property 14: Clock Out Requires Prior Clock In** — Clock Out tanpa Clock In harus selalu ditolak
    - **Property 15: Clock Out Updates Record with Correct Duration** — `duration_minutes` harus akurat sebagai selisih menit antara clock_out_time dan clock_in_time
    - **Validates: Requirements 4.7, 4.10, 5.1, 5.5**

  - [ ] 8.3 Implementasi `src/actions/employees.ts`:
    - `createEmployee(data)` — buat user di Supabase Auth + insert ke tabel `employees`
    - `updateEmployee(id, data)` — update profil karyawan
    - `deactivateEmployee(id)` — set `is_active = false` dan cabut akses login (disable di Supabase Auth), Attendance Record historis tidak dihapus
    - `listEmployees()` — ambil semua karyawan dengan status dan face descriptor info
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.8_

  - [ ]* 8.4 Tulis property test untuk employee actions (Property 4, 5, 6)
    - **Property 4: Employee Creation Round-Trip** — data karyawan valid yang dibuat harus dapat diambil kembali dengan nilai identik
    - **Property 5: Profile Update Consistency** — setelah update, profil harus mencerminkan perubahan yang dilakukan
    - **Property 6: Deactivation Preserves Historical Records** — nonaktifkan karyawan tidak boleh mengubah atau menghapus Attendance Records historis
    - **Validates: Requirements 2.2, 2.3, 2.4**

  - [ ] 8.5 Implementasi `src/actions/geofence.ts`:
    - `saveGeofenceConfig(data)` — simpan config baru, set `is_active = false` pada config lama (hanya satu aktif)
    - `getActiveGeofenceConfig()` — ambil config dengan `is_active = true`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 8.6 Tulis property test untuk geofence actions (Property 8)
    - **Property 8: Single Active Geofence Config** — setelah berapapun operasi simpan, harus selalu ada tepat satu config dengan `is_active = TRUE`
    - **Validates: Requirements 3.3**

  - [ ] 8.7 Implementasi `src/actions/attendance.ts` (lanjutan — admin actions):
    - `getAttendanceRecords(filter: AttendanceFilter)` — ambil records dengan filter nama, departemen, rentang tanggal
    - `correctAttendanceRecord(id, note, adminId)` — update `correction_note`, `corrected_by`, `corrected_at`
    - `deleteAttendanceRecord(id, reason, adminId)` — hapus record dan insert ke `attendance_deletion_logs`
    - `exportAttendanceCSV(filter)` — generate CSV menggunakan `lib/utils/csv.ts` berdasarkan filter aktif
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 8.8 Tulis property test untuk admin attendance actions (Property 17, 19, 20, 21)
    - **Property 17: Date Range Filter Returns Only In-Range Records** — semua record yang dikembalikan harus memiliki `date` dalam rentang yang diberikan (inklusif)
    - **Property 19: CSV Export Matches Active Filters** — jumlah baris CSV harus sama dengan jumlah record yang ditampilkan di tabel
    - **Property 20: Correction Note Preserved with Admin Identity** — catatan koreksi, identitas admin, dan timestamp harus tersimpan tanpa perubahan
    - **Property 21: Deletion Always Creates Audit Log** — setiap penghapusan record harus menghasilkan entri di `attendance_deletion_logs` dengan data lengkap
    - **Validates: Requirements 7.1, 7.3, 7.5, 7.6**

- [ ] 9. Implementasi Komponen UI
  - [ ] 9.1 Buat komponen UI primitif di `src/components/ui/`: Button, Input, Badge, Modal/Dialog, Table, Card, Select, DateRangePicker
    - _Requirements: semua halaman_

  - [ ] 9.2 Implementasi `src/components/attendance/FaceRecognizer.tsx`:
    - Props: `{ employeeId, onSuccess, onError, mode: 'register' | 'verify' }`
    - Mode `verify`: load descriptor dari Storage, jalankan deteksi per frame, panggil `onSuccess(confidence)` jika match
    - Mode `register`: capture descriptor dari frame, simpan via `descriptorStorage.saveDescriptor`
    - Tampilkan pesan error untuk semua `FaceRecognitionError` types
    - _Requirements: 2.5, 2.7, 4.6, 4.8, 4.9_

  - [ ] 9.3 Implementasi `src/components/attendance/AttendanceButton.tsx`:
    - Render tombol Clock In atau Clock Out berdasarkan status hari ini
    - Orkestrasikan alur: validasi geofence → face recognition → panggil Server Action
    - Tampilkan loading state, success feedback, dan error messages
    - _Requirements: 4.1 hingga 4.10, 5.1 hingga 5.6_

  - [ ] 9.4 Implementasi komponen admin: `src/components/admin/EmployeeTable.tsx` (tabel karyawan dengan status dan aksi), `src/components/admin/AttendanceTable.tsx` (tabel attendance dengan filter dan aksi koreksi/hapus), `src/components/admin/GeofenceForm.tsx` (form koordinat + radius + preview peta jika tersedia)
    - _Requirements: 2.8, 3.1, 7.1, 7.2, 7.5_

- [ ] 10. Implementasi Halaman Employee
  - [ ] 10.1 Buat `src/app/(employee)/dashboard/page.tsx` menampilkan status absensi hari ini (sudah/belum clock in, sudah/belum clock out) dan ringkasan attendance bulan berjalan
    - _Requirements: 6.4_

  - [ ] 10.2 Buat `src/app/(employee)/attendance/page.tsx` sebagai halaman Clock In / Clock Out:
    - Cek geofence config tersedia (tampilkan pesan jika belum dikonfigurasi per Requirements 3.4)
    - Tampilkan `AttendanceButton` dengan geofence dan face recognition terintegrasi
    - _Requirements: 3.4, 4.1 hingga 4.10, 5.1 hingga 5.6_

  - [ ] 10.3 Buat `src/app/(employee)/history/page.tsx` menampilkan riwayat absensi karyawan yang login:
    - Filter berdasarkan rentang tanggal
    - Kolom: tanggal, jam masuk, jam keluar, durasi, status (Belum Clock Out jika null)
    - RLS memastikan hanya record sendiri yang terlihat
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 10.4 Tulis property test untuk attendance history isolation (Property 16)
    - **Property 16: Employee Attendance History Isolation** — query history hanya boleh mengembalikan record milik karyawan yang sedang login, tidak pernah record dari karyawan lain
    - **Validates: Requirements 6.1, 6.3**

- [ ] 11. Implementasi Halaman Admin
  - [ ] 11.1 Buat `src/app/(admin)/dashboard/page.tsx`:
    - Tampilkan statistik hari ini: jumlah sudah Clock In, belum hadir, total aktif
    - Tabel tingkat kehadiran bulanan per departemen
    - Supabase Realtime subscription pada `attendance_records` untuk update otomatis
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 11.2 Tulis property test untuk dashboard counts (Property 22)
    - **Property 22: Dashboard Counts Match Actual Data** — jumlah yang ditampilkan dashboard harus secara aritmetika konsisten dengan jumlah aktual record di database
    - **Validates: Requirements 8.1, 8.2**

  - [ ] 11.3 Buat `src/app/(admin)/employees/page.tsx` (daftar karyawan) dan `src/app/(admin)/employees/[id]/page.tsx` (detail + edit + pendaftaran wajah):
    - Gunakan `EmployeeTable` dan form edit
    - Integrasi `FaceRecognizer` mode `register` untuk pendaftaran wajah
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ] 11.4 Buat `src/app/(admin)/attendance/page.tsx`:
    - Gunakan `AttendanceTable` dengan filter aktif (nama, departemen, tanggal)
    - Tombol unduh CSV, tombol koreksi dan hapus record per baris
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 11.5 Buat `src/app/(admin)/settings/geofence/page.tsx`:
    - Tampilkan konfigurasi geofence aktif saat ini
    - Form untuk mengatur koordinat dan radius baru
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 12. Implementasi Security & RLS Tests
  - [ ] 12.1 Tulis integration test untuk RLS policies:
    - Verifikasi Employee tidak dapat membaca `attendance_records` karyawan lain via Supabase client
    - Verifikasi data yang tersimpan di `face-descriptors/` adalah JSON numerik, bukan file gambar
    - _Requirements: 9.1, 9.4_

  - [ ]* 12.2 Tulis property test untuk security enforcement (Property 1, 23, 24)
    - **Property 1: Invalid Credentials Always Rejected** — sembarang kombinasi email/password tidak valid harus selalu menghasilkan error tanpa detail internal
    - **Property 23: Admin-Only Endpoints Reject Employee Role** — semua endpoint Admin harus selalu ditolak atau di-redirect untuk user dengan role `employee`
    - **Property 24: Only Descriptors Stored — No Raw Images** — data di Supabase Storage harus berupa array float, tidak pernah berupa file gambar
    - **Validates: Requirements 1.3, 9.2, 9.3, 9.4**

- [ ] 13. Checkpoint Final — Integrasi & Verifikasi
  - Pastikan seluruh test suite (unit, integration, property-based) lulus
  - Verifikasi alur Clock In end-to-end: permissions → geofence → face recognition → record tersimpan
  - Verifikasi alur Clock Out end-to-end: state check → geofence → face recognition → durasi terhitung
  - Verifikasi middleware redirect berfungsi untuk kedua role
  - Verifikasi CSV export menghasilkan file yang sesuai dengan filter aktif
  - Tanyakan kepada user jika ada pertanyaan atau penyesuaian yang diperlukan.

---

## Notes

- Tasks yang diakhiri `*` bersifat opsional dan dapat dilewati untuk implementasi MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Face recognition berjalan sepenuhnya client-side — tidak ada gambar yang dikirim ke server (Requirements 9.5)
- Property tests menggunakan **fast-check** dengan minimum 100 iterasi per property
- Checkpoint di task 6 dan 13 memastikan validasi incremental
- Supabase RLS adalah lapisan keamanan utama; middleware adalah lapisan kedua untuk UX
- Format tag property test: `Feature: employee-attendance-system, Property {N}: {property_text}`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 1, "tasks": ["3.1", "3.3", "3.4", "4.1", "4.2"] },
    { "id": 2, "tasks": ["3.2", "3.5", "4.3", "5.1", "5.2", "5.3"] },
    { "id": 3, "tasks": ["7.1", "7.2", "8.1", "8.3", "8.5", "9.1"] },
    { "id": 4, "tasks": ["7.3", "8.2", "8.4", "8.6", "8.7", "9.2", "9.3", "9.4"] },
    { "id": 5, "tasks": ["8.8", "10.1", "10.2", "10.3", "11.1", "11.3", "11.4", "11.5"] },
    { "id": 6, "tasks": ["10.4", "11.2", "12.1"] },
    { "id": 7, "tasks": ["12.2"] }
  ]
}
```
