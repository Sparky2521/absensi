# Install Node.js dan npm

## ⚠️ PENTING: Node.js Belum Terinstall!

Aplikasi ini memerlukan Node.js dan npm untuk berjalan. Saat ini Node.js belum terinstall di sistem Anda.

## 🚀 Cara Install Node.js

### Windows (Anda menggunakan ini)

#### Option 1: Installer Resmi (Recommended) ⭐

1. **Download Node.js**
   - Buka: https://nodejs.org/
   - Download versi **LTS** (Long Term Support) - recommended
   - Atau direct link: https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi

2. **Install**
   - Jalankan file .msi yang sudah didownload
   - Klik "Next" → "Next" → "Next"
   - Centang "Automatically install necessary tools"
   - Klik "Install"
   - Tunggu hingga selesai (~5 menit)

3. **Verify Installation**
   - Buka **Command Prompt** atau **PowerShell** BARU
   - Ketik: `node --version`
   - Ketik: `npm --version`
   - Jika muncul versi number, berarti sudah terinstall!

#### Option 2: Chocolatey (Advanced Users)

Jika sudah punya Chocolatey package manager:

```powershell
choco install nodejs-lts
```

#### Option 3: Winget (Windows 10/11)

```powershell
winget install OpenJS.NodeJS.LTS
```

### Setelah Install Node.js

1. **Close dan Reopen Terminal/VS Code**
   - PENTING: Node.js perlu terminal baru untuk dikenali

2. **Buka Terminal Baru di VS Code**
   - Tekan `Ctrl + Shift + ~` untuk terminal baru
   - Atau: Menu → Terminal → New Terminal

3. **Verify Node.js Terinstall**
   ```bash
   node --version
   npm --version
   ```
   
   Output seharusnya seperti:
   ```
   v20.12.2
   10.5.0
   ```

4. **Install Dependencies Project**
   ```bash
   npm install
   ```
   
   Tunggu ~2-3 menit hingga selesai

5. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```

## 🐛 Troubleshooting

### "npm is not recognized" setelah install

**Penyebab**: Terminal masih menggunakan session lama

**Solusi**:
1. Close SEMUA terminal dan VS Code
2. Buka VS Code lagi
3. Buka terminal baru
4. Test: `node --version`

### "node: command not found" di PowerShell

**Penyebab**: PATH environment variable belum diupdate

**Solusi**:
1. Buka Windows Settings
2. Search "Environment Variables"
3. Check apakah ada path ke Node.js:
   - `C:\Program Files\nodejs\`
4. Jika tidak ada, tambahkan manual
5. Restart computer

### Install stuck atau error

**Solusi**:
1. Uninstall Node.js jika sudah terinstall sebagian:
   - Control Panel → Programs → Uninstall
2. Download installer lagi
3. Run as Administrator
4. Install ulang

### npm install error: "EACCES" atau "Permission denied"

**Solusi**:
```bash
# Run PowerShell as Administrator
npm install --force
```

## 📚 Setelah Node.js Terinstall

Lanjut ke langkah berikutnya:

1. ✅ Node.js terinstall
2. ⏭️ Install dependencies: `npm install`
3. ⏭️ Setup Supabase (baca: QUICKSTART.md)
4. ⏭️ Run aplikasi: `npm run dev`

## 💡 Tips

- Gunakan Node.js versi **LTS** (bukan Current) untuk stability
- Install di default location (`C:\Program Files\nodejs\`)
- Centang option "Add to PATH" saat install
- Restart terminal setelah install

## ❓ Need More Help?

- Node.js Documentation: https://nodejs.org/docs/
- npm Documentation: https://docs.npmjs.com/
- Troubleshooting: https://nodejs.org/en/docs/guides/getting-started-guide

---

Setelah Node.js terinstall, lanjut ke **QUICKSTART.md** untuk setup aplikasi!
