# Contributing to Sistem Absensi Karyawan

Terima kasih atas minat Anda untuk berkontribusi! Dokumen ini berisi panduan untuk kontribusi ke project ini.

## Cara Berkontribusi

### Melaporkan Bug

Jika Anda menemukan bug, silakan buat issue dengan informasi berikut:

1. **Deskripsi Bug**: Jelaskan apa yang terjadi
2. **Langkah Reproduksi**: Cara untuk memunculkan bug
3. **Expected Behavior**: Apa yang seharusnya terjadi
4. **Screenshots**: Jika memungkinkan
5. **Environment**:
   - OS: (Windows/Mac/Linux)
   - Browser: (Chrome/Firefox/Safari/Edge)
   - Version: (versi aplikasi)

### Mengusulkan Fitur Baru

1. Buat issue dengan label "feature request"
2. Jelaskan fitur yang diusulkan
3. Jelaskan use case dan manfaatnya
4. Jika memungkinkan, sertakan mockup atau contoh

### Pull Request

1. Fork repository
2. Buat branch baru dari `main`:
   ```bash
   git checkout -b feature/nama-fitur
   ```
3. Commit changes Anda:
   ```bash
   git commit -m "feat: deskripsi singkat"
   ```
4. Push ke branch Anda:
   ```bash
   git push origin feature/nama-fitur
   ```
5. Buat Pull Request

#### Commit Message Convention

Gunakan conventional commits:

- `feat:` untuk fitur baru
- `fix:` untuk bug fix
- `docs:` untuk perubahan dokumentasi
- `style:` untuk formatting, semicolons, dll
- `refactor:` untuk refactoring code
- `test:` untuk menambah test
- `chore:` untuk maintenance tasks

Contoh:
```
feat: add CSV export for attendance reports
fix: resolve face recognition camera permission issue
docs: update setup instructions
```

## Development Setup

1. Fork dan clone repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables (lihat SETUP.md)
4. Jalankan development server:
   ```bash
   npm run dev
   ```

## Code Style

- Gunakan TypeScript untuk semua file baru
- Ikuti ESLint rules yang sudah dikonfigurasi
- Gunakan Prettier untuk formatting
- Tambahkan comments untuk code yang kompleks
- Gunakan meaningful variable dan function names

### Component Guidelines

- Gunakan functional components dengan hooks
- Props harus memiliki TypeScript interface
- Pisahkan logic dan presentation
- Buat reusable components di folder `components/`

### File Structure

```
app/              # Next.js pages (App Router)
components/       # React components
  ├── ui/        # Reusable UI components
  └── ...        # Feature-specific components
hooks/           # Custom React hooks
lib/             # Utility functions dan helpers
types/           # TypeScript type definitions
public/          # Static assets
```

## Testing

Sebelum submit PR:

1. Test manual semua perubahan
2. Pastikan tidak ada console errors
3. Test di multiple browsers jika memungkinkan
4. Test responsive design di berbagai ukuran layar

## Dokumentasi

Jika PR Anda mengubah atau menambah fitur:

1. Update README.md jika perlu
2. Update SETUP.md jika ada perubahan setup
3. Tambahkan comments di code
4. Update TypeScript types jika perlu

## Review Process

1. Maintainer akan review PR Anda
2. Mungkin ada request untuk perubahan
3. Setelah approved, PR akan di-merge
4. Changes Anda akan masuk di release berikutnya

## Questions?

Jika ada pertanyaan, silakan:

1. Baca dokumentasi terlebih dahulu (README.md, SETUP.md)
2. Search existing issues
3. Buat issue baru dengan label "question"

## Code of Conduct

- Bersikap profesional dan respectful
- Konstruktif dalam feedback
- Focus pada code, bukan person
- Terima perbedaan pendapat dengan terbuka

## License

Dengan berkontribusi ke project ini, Anda setuju bahwa kontribusi Anda akan dilicense di bawah MIT License yang sama dengan project ini.

---

Terima kasih atas kontribusi Anda! 🎉
