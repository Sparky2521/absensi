# Deployment Guide

Panduan deploy Sistem Absensi Karyawan ke production.

## Prerequisites

- [ ] Project sudah berjalan dengan baik di local
- [ ] Database Supabase sudah setup lengkap
- [ ] Face recognition models sudah ada di `public/models/`
- [ ] Environment variables sudah dikonfigurasi
- [ ] Admin user sudah dibuat
- [ ] Geofencing sudah dikonfigurasi

## Platform Deployment

### Option 1: Vercel (Recommended)

Vercel adalah platform yang dibuat oleh tim Next.js, memberikan pengalaman deployment terbaik untuk aplikasi Next.js.

#### Deploy via Vercel Dashboard

1. **Persiapan**
   - Push code ke GitHub/GitLab/Bitbucket
   - Buat akun di [vercel.com](https://vercel.com)

2. **Import Project**
   - Login ke Vercel Dashboard
   - Klik "Add New..." → "Project"
   - Import repository Anda
   - Vercel akan auto-detect Next.js configuration

3. **Configure Environment Variables**
   
   Tambahkan environment variables berikut:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
   NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD=0.6
   NEXT_PUBLIC_GEOFENCE_RADIUS=100
   ```

4. **Deploy**
   - Klik "Deploy"
   - Tunggu proses build selesai
   - Aplikasi Anda akan live di URL `https://your-project.vercel.app`

#### Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Untuk production
vercel --prod
```

### Option 2: Netlify

1. **Persiapan**
   - Push code ke Git repository
   - Buat akun di [netlify.com](https://netlify.com)

2. **Deploy**
   - Klik "Add new site" → "Import an existing project"
   - Connect repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Set environment variables
   - Klik "Deploy site"

### Option 3: Self-Hosted (VPS)

#### Requirements
- Ubuntu 20.04+ atau OS sejenis
- Node.js 18+
- Nginx
- SSL certificate (Let's Encrypt)

#### Setup Steps

1. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Clone dan Setup**
```bash
git clone <repository-url>
cd "Web Absensi Keren"
npm install
```

3. **Build Production**
```bash
npm run build
```

4. **Install PM2**
```bash
npm install -g pm2
```

5. **Create `.env.local`**
```bash
nano .env.local
# Paste environment variables
```

6. **Start with PM2**
```bash
pm2 start npm --name "absensi-app" -- start
pm2 save
pm2 startup
```

7. **Setup Nginx**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. **Setup SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Post-Deployment

### 1. Update Supabase Settings

Di Supabase Dashboard → Settings → API:

**Site URL:**
```
https://your-domain.com
```

**Redirect URLs:**
```
https://your-domain.com/**
```

### 2. Test Deployment

1. **Basic Tests**
   - [ ] Website bisa diakses
   - [ ] Login berfungsi
   - [ ] Dashboard loading dengan benar

2. **Camera & GPS Tests**
   - [ ] Kamera dapat diakses (harus HTTPS!)
   - [ ] GPS dapat diakses
   - [ ] Face recognition berfungsi
   - [ ] Geofencing validation bekerja

3. **CRUD Tests**
   - [ ] Admin dapat menambah karyawan
   - [ ] Admin dapat mendaftarkan wajah
   - [ ] Karyawan dapat clock in/out
   - [ ] Data tersimpan dengan benar

### 3. Monitor & Logs

**Vercel:**
- Dashboard → Project → Functions → Logs
- Dashboard → Project → Analytics

**Self-Hosted:**
```bash
# PM2 logs
pm2 logs absensi-app

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Performance Optimization

### 1. Enable Caching

Headers untuk static assets di Nginx:
```nginx
location /_next/static {
    proxy_pass http://localhost:3000;
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```

### 2. Enable Compression

Di Nginx:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 3. Optimize Images

Gunakan Next.js Image component:
```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
/>
```

## Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables secure (tidak di-commit ke Git)
- [ ] Supabase RLS policies aktif
- [ ] CORS configured correctly di Supabase
- [ ] Service role key tidak exposed di client
- [ ] Rate limiting configured (via Supabase atau CDN)
- [ ] Regular backup database
- [ ] Monitor audit logs

## Backup Strategy

### Database Backup

Supabase Dashboard → Database → Backups:
- Daily automatic backups
- Point-in-time recovery available
- Export database manually jika perlu

### Code Backup

- Gunakan Git version control
- Regular commits dan push
- Tag releases:
  ```bash
  git tag -a v1.0.0 -m "Release version 1.0.0"
  git push origin v1.0.0
  ```

## Rollback Strategy

### Vercel
1. Dashboard → Deployments
2. Pilih previous deployment
3. Klik "Promote to Production"

### Self-Hosted
```bash
# Rollback code
git checkout v1.0.0

# Rebuild
npm run build

# Restart
pm2 restart absensi-app
```

## Monitoring

### Metrics to Monitor

1. **Uptime**: Aplikasi selalu accessible
2. **Response Time**: Page load < 3 seconds
3. **Error Rate**: < 1% error rate
4. **Database**: Query performance
5. **Storage**: Face descriptors storage usage

### Tools

- **Vercel Analytics**: Built-in untuk Vercel deployments
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry
- **Performance**: Google PageSpeed Insights

## Scaling

### When to Scale

- User base > 1000 active users
- Response time > 3 seconds consistently
- Database queries slow (> 1s)

### Scaling Options

1. **Vercel**: Auto-scales, tidak perlu konfigurasi
2. **Database**: Upgrade Supabase plan
3. **Storage**: Optimize face descriptors atau upgrade storage
4. **CDN**: Use Vercel CDN atau Cloudflare

## Troubleshooting Production Issues

### Issue: Camera/GPS not working

**Cause**: Not using HTTPS or browser permissions not granted

**Fix:**
- Ensure HTTPS is enabled
- Check browser console for permission errors
- Test in different browsers

### Issue: Face recognition models not loading

**Cause**: Models not properly deployed or path incorrect

**Fix:**
- Verify `public/models/` folder exists in build
- Check network tab for 404 errors
- Ensure models are not in `.gitignore`

### Issue: Database connection errors

**Cause**: Environment variables incorrect or Supabase URL changed

**Fix:**
- Verify env variables in deployment platform
- Check Supabase Dashboard → Settings → API for correct values
- Redeploy with correct values

### Issue: High response time

**Cause**: Unoptimized queries or large payloads

**Fix:**
- Add database indexes
- Implement pagination
- Optimize image sizes
- Enable compression

## Support & Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Check error logs
- Monitor uptime
- Review audit logs

**Monthly:**
- Update dependencies: `npm update`
- Review and optimize database
- Check storage usage
- Review security settings

**Quarterly:**
- Full security audit
- Performance optimization review
- Update documentation
- User feedback review

## Cost Estimation

### Vercel (Hobby Plan - Free)
- Suitable for: < 100 users
- Bandwidth: 100GB/month
- Build time: 100 hours/month
- Free SSL

### Vercel (Pro Plan - $20/month)
- Suitable for: < 1000 users
- Bandwidth: 1TB/month
- Advanced analytics
- Team collaboration

### Supabase (Free Tier)
- Database: 500MB
- Storage: 1GB
- Bandwidth: 2GB
- 50,000 monthly active users

### Supabase (Pro Plan - $25/month)
- Database: 8GB
- Storage: 100GB
- Bandwidth: 50GB
- Daily backups

### Total Estimate
- Small company (< 100 employees): Free - $50/month
- Medium company (100-1000 employees): $50-$100/month
- Large company (> 1000 employees): $100-$500/month

## Next Steps After Deployment

1. [ ] Share URL dengan tim
2. [ ] Buat user guide untuk end users
3. [ ] Setup monitoring dan alerts
4. [ ] Schedule regular backups
5. [ ] Plan for future features
6. [ ] Collect user feedback
7. [ ] Monitor performance metrics

---

Selamat! Aplikasi Anda sudah live! 🚀
