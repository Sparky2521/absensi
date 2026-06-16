# Requirements Document

## Introduction

Sistem Absensi Karyawan adalah aplikasi web berbasis Next.js yang memungkinkan karyawan melakukan clock in/out menggunakan verifikasi wajah (face recognition) berbasis browser dan validasi lokasi GPS (geofencing). Sistem ini dikelola melalui Supabase sebagai backend (PostgreSQL + Auth + Storage) dan mendukung dua peran pengguna: Admin/HRD dan Karyawan Biasa.

## Glossary

- **System**: Sistem Absensi Karyawan secara keseluruhan
- **Employee**: Karyawan biasa yang memiliki akses untuk melakukan absensi dan melihat riwayat absensi milik sendiri
- **Admin**: Pengguna dengan peran Admin atau HRD yang memiliki akses penuh ke seluruh fitur manajemen
- **Face Recognizer**: Modul client-side berbasis face-api.js atau TensorFlow.js yang berjalan di browser untuk memverifikasi identitas karyawan
- **Geofence Validator**: Modul client-side yang menggunakan GPS browser untuk memvalidasi apakah pengguna berada dalam radius kerja yang dikonfigurasi
- **Clock In**: Tindakan karyawan menandai kehadiran masuk kerja
- **Clock Out**: Tindakan karyawan menandai kehadiran keluar kerja
- **Attendance Record**: Catatan absensi satu hari kerja seorang karyawan yang mencakup waktu clock in, waktu clock out, dan status kehadiran
- **Global Geofence Config**: Konfigurasi radius dan koordinat pusat lokasi kerja yang berlaku secara global untuk semua karyawan, dikelola oleh Admin
- **Supabase**: Platform backend yang menyediakan layanan PostgreSQL, autentikasi, dan penyimpanan file
- **Face Descriptor**: Representasi numerik wajah karyawan yang disimpan di Supabase Storage dan digunakan untuk pencocokan identitas

---

## Requirements

### Requirement 1: Autentikasi Pengguna

**User Story:** As a pengguna (Admin atau Employee), I want to login dan logout dari sistem, so that akses ke fitur sistem terlindungi dan hanya dapat digunakan oleh pengguna yang berwenang.

#### Acceptance Criteria

1. THE System SHALL menggunakan Supabase Auth sebagai satu-satunya mekanisme autentikasi untuk seluruh pengguna.
2. WHEN pengguna memasukkan email dan password yang valid, THE System SHALL mengautentikasi pengguna dan mengarahkan pengguna ke halaman dashboard sesuai perannya.
3. IF pengguna memasukkan email atau password yang tidak valid, THEN THE System SHALL menampilkan pesan kesalahan autentikasi tanpa mengungkap detail keamanan internal.
4. WHEN pengguna menekan tombol logout, THE System SHALL mengakhiri sesi pengguna dan mengarahkan pengguna ke halaman login.
5. WHILE sesi pengguna tidak aktif, THE System SHALL menolak akses ke seluruh halaman yang memerlukan autentikasi dan mengarahkan pengguna ke halaman login.
6. THE System SHALL menetapkan peran pengguna (Admin atau Employee) berdasarkan metadata pengguna yang tersimpan di Supabase Auth saat proses autentikasi berhasil.

---

### Requirement 2: Manajemen Karyawan oleh Admin

**User Story:** As an Admin, I want to menambah, mengubah, menonaktifkan, dan mendaftarkan wajah karyawan, so that data karyawan selalu akurat dan setiap karyawan dapat dikenali oleh sistem face recognition.

#### Acceptance Criteria

1. THE Admin SHALL dapat menambah data karyawan baru dengan mengisi nama lengkap, email, jabatan, dan departemen.
2. WHEN Admin menambah karyawan baru, THE System SHALL membuat akun Supabase Auth untuk karyawan tersebut dan menyimpan data profil ke tabel karyawan di PostgreSQL.
3. THE Admin SHALL dapat mengubah data profil karyawan yang sudah ada, meliputi nama lengkap, jabatan, dan departemen.
4. WHEN Admin menonaktifkan akun karyawan, THE System SHALL mencabut akses login karyawan tersebut tanpa menghapus Attendance Record historis karyawan.
5. WHEN Admin mendaftarkan wajah karyawan, THE Face Recognizer SHALL mengambil gambar wajah melalui kamera browser dan menghasilkan Face Descriptor dari gambar tersebut.
6. WHEN Face Descriptor berhasil dihasilkan, THE System SHALL menyimpan Face Descriptor karyawan ke Supabase Storage dan mencatat referensi penyimpanan di tabel karyawan di PostgreSQL.
7. IF kamera browser tidak dapat diakses saat proses pendaftaran wajah, THEN THE System SHALL menampilkan pesan kesalahan yang menjelaskan bahwa izin kamera diperlukan.
8. THE Admin SHALL dapat melihat daftar seluruh karyawan beserta status aktif/nonaktif dan status pendaftaran wajah.

---

### Requirement 3: Konfigurasi Geofencing Global oleh Admin

**User Story:** As an Admin, I want to mengatur koordinat pusat dan radius lokasi kerja secara global, so that semua karyawan hanya dapat melakukan absensi ketika berada di area yang ditentukan.

#### Acceptance Criteria

1. THE Admin SHALL dapat mengatur Global Geofence Config yang terdiri dari satu titik koordinat pusat (latitude dan longitude) dan satu nilai radius dalam satuan meter.
2. WHEN Admin menyimpan Global Geofence Config, THE System SHALL menyimpan konfigurasi tersebut ke tabel konfigurasi di PostgreSQL dan menerapkan konfigurasi tersebut untuk seluruh validasi geofencing berikutnya.
3. THE System SHALL hanya mengizinkan satu Global Geofence Config yang aktif pada satu waktu.
4. IF Admin belum pernah menyimpan Global Geofence Config, THEN THE System SHALL mencegah karyawan melakukan Clock In atau Clock Out dan menampilkan pesan bahwa konfigurasi lokasi belum tersedia.

---

### Requirement 4: Proses Clock In

**User Story:** As an Employee, I want to melakukan clock in dengan verifikasi wajah dan validasi lokasi, so that kehadiran saya tercatat secara akurat dan aman.

#### Acceptance Criteria

1. WHEN Employee membuka halaman absensi, THE System SHALL meminta izin akses kamera dan GPS kepada browser.
2. IF browser Employee tidak memberikan izin akses GPS, THEN THE System SHALL menampilkan pesan kesalahan dan mencegah proses Clock In berlanjut.
3. IF browser Employee tidak memberikan izin akses kamera, THEN THE System SHALL menampilkan pesan kesalahan dan mencegah proses Clock In berlanjut.
4. WHEN Employee memulai proses Clock In, THE Geofence Validator SHALL mengambil koordinat GPS Employee saat itu dan menghitung jarak terhadap titik pusat Global Geofence Config.
5. IF jarak Employee ke titik pusat melebihi radius yang dikonfigurasi dalam Global Geofence Config, THEN THE System SHALL menolak proses Clock In dan menampilkan pesan bahwa Employee berada di luar area kerja.
6. WHEN validasi lokasi berhasil, THE Face Recognizer SHALL mengaktifkan kamera browser dan memproses gambar wajah Employee secara real-time.
7. WHEN Face Recognizer berhasil mencocokkan wajah Employee dengan Face Descriptor yang tersimpan dengan tingkat kepercayaan yang memenuhi ambang batas yang dikonfigurasi, THE System SHALL mencatat Attendance Record Clock In dengan timestamp saat itu dan menyimpan Attendance Record ke Supabase.
8. IF Face Recognizer tidak dapat mencocokkan wajah Employee dengan Face Descriptor yang tersimpan, THEN THE System SHALL menolak Clock In dan menampilkan pesan bahwa verifikasi wajah gagal.
9. IF Employee belum memiliki Face Descriptor yang terdaftar, THEN THE System SHALL menolak Clock In dan menampilkan pesan bahwa wajah Employee belum didaftarkan.
10. IF Employee sudah melakukan Clock In pada hari yang sama dan belum melakukan Clock Out, THEN THE System SHALL menolak Clock In duplikat dan menampilkan pesan bahwa Employee sudah tercatat hadir.

---

### Requirement 5: Proses Clock Out

**User Story:** As an Employee, I want to melakukan clock out dengan verifikasi wajah dan validasi lokasi, so that waktu keluar kerja saya tercatat secara akurat.

#### Acceptance Criteria

1. IF Employee belum melakukan Clock In pada hari yang sama, THEN THE System SHALL menolak proses Clock Out dan menampilkan pesan bahwa Employee belum melakukan Clock In.
2. WHEN Employee memulai proses Clock Out, THE Geofence Validator SHALL mengambil koordinat GPS Employee saat itu dan menghitung jarak terhadap titik pusat Global Geofence Config.
3. IF jarak Employee ke titik pusat melebihi radius yang dikonfigurasi dalam Global Geofence Config, THEN THE System SHALL menolak proses Clock Out dan menampilkan pesan bahwa Employee berada di luar area kerja.
4. WHEN validasi lokasi Clock Out berhasil, THE Face Recognizer SHALL memproses gambar wajah Employee secara real-time melalui kamera browser.
5. WHEN Face Recognizer berhasil mencocokkan wajah Employee, THE System SHALL memperbarui Attendance Record hari tersebut dengan timestamp Clock Out dan menghitung durasi kehadiran dalam satuan jam dan menit.
6. IF Face Recognizer tidak dapat mencocokkan wajah Employee saat Clock Out, THEN THE System SHALL menolak Clock Out dan menampilkan pesan bahwa verifikasi wajah gagal.

---

### Requirement 6: Riwayat Absensi Karyawan

**User Story:** As an Employee, I want to melihat riwayat absensi saya sendiri, so that saya dapat memantau catatan kehadiran saya.

#### Acceptance Criteria

1. THE Employee SHALL dapat melihat daftar Attendance Record milik sendiri yang mencakup tanggal, waktu Clock In, waktu Clock Out, dan durasi kehadiran.
2. WHEN Employee memilih rentang tanggal tertentu, THE System SHALL menampilkan Attendance Record Employee yang berada dalam rentang tanggal tersebut.
3. THE System SHALL hanya menampilkan Attendance Record milik Employee yang sedang login dan mencegah Employee mengakses Attendance Record karyawan lain.
4. WHILE Attendance Record untuk suatu hari belum memiliki data Clock Out, THE System SHALL menampilkan status "Belum Clock Out" pada Attendance Record hari tersebut.

---

### Requirement 7: Manajemen dan Laporan Absensi oleh Admin

**User Story:** As an Admin, I want to melihat dan mengelola seluruh data absensi karyawan serta mengunduh laporan, so that HRD dapat memantau kehadiran dan menghasilkan laporan untuk keperluan penggajian.

#### Acceptance Criteria

1. THE Admin SHALL dapat melihat Attendance Record seluruh karyawan yang dapat difilter berdasarkan nama karyawan, departemen, dan rentang tanggal.
2. WHEN Admin memilih filter, THE System SHALL menampilkan Attendance Record yang sesuai dengan kriteria filter yang dipilih.
3. THE Admin SHALL dapat mengunduh laporan absensi dalam format CSV yang mencakup nama karyawan, departemen, tanggal, waktu Clock In, waktu Clock Out, dan durasi kehadiran.
4. WHEN Admin mengunduh laporan CSV, THE System SHALL menghasilkan file CSV berdasarkan filter yang sedang aktif pada saat pengunduhan.
5. THE Admin SHALL dapat menambahkan catatan koreksi manual pada Attendance Record tertentu, dengan menyimpan alasan koreksi dan identitas Admin yang melakukan koreksi.
6. IF Admin menghapus Attendance Record, THEN THE System SHALL menyimpan log penghapusan yang mencatat identitas Admin, waktu penghapusan, dan data Attendance Record yang dihapus.

---

### Requirement 8: Dashboard dan Statistik

**User Story:** As an Admin, I want to melihat ringkasan statistik kehadiran harian dan bulanan, so that Admin dapat memantau kondisi kehadiran karyawan secara cepat.

#### Acceptance Criteria

1. WHEN Admin mengakses halaman dashboard, THE System SHALL menampilkan jumlah karyawan yang sudah Clock In, jumlah karyawan yang belum hadir, dan jumlah karyawan aktif untuk hari kerja saat ini.
2. THE System SHALL memperbarui data statistik pada dashboard Admin setiap kali terdapat Attendance Record baru atau perubahan Attendance Record.
3. THE Admin SHALL dapat melihat ringkasan tingkat kehadiran bulanan per departemen dalam bentuk tabel.

---

### Requirement 9: Keamanan dan Otorisasi Akses

**User Story:** As a System owner, I want seluruh akses data dilindungi sesuai peran pengguna, so that data karyawan dan absensi tidak dapat diakses oleh pihak yang tidak berwenang.

#### Acceptance Criteria

1. THE System SHALL menerapkan Row Level Security (RLS) pada seluruh tabel di Supabase PostgreSQL untuk memastikan Employee hanya dapat membaca dan menulis data milik sendiri.
2. THE System SHALL membatasi akses endpoint manajemen karyawan, konfigurasi geofencing, dan laporan hanya kepada pengguna dengan peran Admin.
3. WHEN pengguna dengan peran Employee mengakses URL halaman Admin secara langsung, THE System SHALL mengarahkan pengguna ke halaman dashboard Employee.
4. THE System SHALL tidak menyimpan gambar wajah karyawan secara permanen; hanya Face Descriptor dalam bentuk data numerik yang disimpan di Supabase Storage.
5. THE Face Recognizer SHALL memproses seluruh komputasi pengenalan wajah di sisi browser (client-side) tanpa mengirimkan gambar wajah ke server.
