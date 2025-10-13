# Production Deployment Guide

## 🚀 Complete Guide to Deploy Classmates Social

This guide will help you deploy your social platform to production with proper security, performance, and reliability.

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Domain & SSL Setup](#domain--ssl-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All features tested locally
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] All API endpoints working
- [ ] File uploads working
- [ ] Database migrations completed

### ✅ Security
- [ ] Change JWT_SECRET to a strong random string
- [ ] Update database passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Sanitize user inputs
- [ ] Rate limiting enabled

### ✅ Performance
- [ ] Images optimized
- [ ] Database indexed
- [ ] Caching configured
- [ ] Gzip compression enabled

---

## Environment Setup

### 1. Choose Your Hosting Platform

**Recommended Options:**

#### **Backend (Node.js + MySQL)**
- **Railway** (easiest, free tier available)
- **Render** (free tier, auto-deploy from Git)
- **DigitalOcean** (VPS, more control)
- **AWS EC2** (scalable, more complex)
- **Heroku** (easy, paid)

#### **Frontend (React)**
- **Vercel** (recommended, free, auto-deploy)
- **Netlify** (free, easy setup)
- **GitHub Pages** (free, static hosting)
- **Cloudflare Pages** (free, fast CDN)

#### **Database (MySQL)**
- **PlanetScale** (free tier, serverless MySQL)
- **Railway** (includes database)
- **AWS RDS** (managed MySQL)
- **DigitalOcean Managed Database**

---

## Database Setup

### Option 1: PlanetScale (Recommended - Free Tier)

1. **Create Account**: https://planetscale.com
2. **Create Database**:
   ```bash
   # Name: classmates-social-db
   # Region: Choose closest to your users
   ```

3. **Get Connection String**:
   - Go to "Connect"
   - Select "Node.js"
   - Copy connection details

4. **Run Migrations**:
   ```bash
   # Connect to your database
   mysql -h <host> -u <user> -p<password> <database>
   
   # Run migration files
   source server/sql/schema.sql
   source server/sql/alter_add_likes_comments.sql
   source server/sql/alter_add_read_at.sql
   source server/sql/alter_add_video_url.sql
   source server/sql/alter_add_groups.sql
   ```

### Option 2: Railway

1. **Create Project**: https://railway.app
2. **Add MySQL Database**:
   - Click "New" → "Database" → "MySQL"
   - Railway provides connection details

3. **Run Migrations**: Same as above

---

## Backend Deployment

### Option 1: Railway (Easiest)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**:
   ```bash
   railway login
   ```

3. **Initialize Project**:
   ```bash
   cd server
   railway init
   ```

4. **Set Environment Variables**:
   ```bash
   railway variables set PORT=4000
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=your-super-secret-key-change-this
   railway variables set DB_HOST=your-db-host
   railway variables set DB_USER=your-db-user
   railway variables set DB_PASSWORD=your-db-password
   railway variables set DB_NAME=classmates_social
   railway variables set BASE_URL=https://your-backend-url.railway.app
   railway variables set CORS_ORIGIN=https://your-frontend-url.vercel.app
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

6. **Get URL**:
   - Railway will provide a URL like: `https://your-app.railway.app`

### Option 2: Render

1. **Create Account**: https://render.com
2. **New Web Service**:
   - Connect your GitHub repo
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Environment Variables**:
   - Add all variables from `.env.example`

4. **Deploy**: Render auto-deploys on git push

### Option 3: DigitalOcean (VPS)

1. **Create Droplet**:
   - Ubuntu 22.04
   - At least 1GB RAM

2. **SSH into Server**:
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install MySQL**:
   ```bash
   sudo apt install mysql-server
   sudo mysql_secure_installation
   ```

5. **Clone & Setup**:
   ```bash
   git clone your-repo-url
   cd class_social/server
   npm install
   cp .env.example .env
   nano .env  # Edit with your values
   ```

6. **Install PM2** (Process Manager):
   ```bash
   sudo npm install -g pm2
   pm2 start src/index.js --name classmates-api
   pm2 startup
   pm2 save
   ```

7. **Setup Nginx** (Reverse Proxy):
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/classmates
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable:
   ```bash
   sudo ln -s /etc/nginx/sites-available/classmates /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Update API URL**:
   ```bash
   cd client/src/lib
   ```

   Edit `api.js`:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.railway.app/api'
   ```

3. **Create `.env.production`**:
   ```bash
   cd client
   echo "VITE_API_URL=https://your-backend-url.railway.app/api" > .env.production
   ```

4. **Deploy**:
   ```bash
   cd client
   vercel
   ```

5. **Set Environment Variable in Vercel Dashboard**:
   - Go to project settings
   - Add `VITE_API_URL` = `https://your-backend-url.railway.app/api`

### Option 2: Netlify

1. **Create `netlify.toml`**:
   ```toml
   [build]
     base = "client"
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy**:
   ```bash
   cd client
   npm install -g netlify-cli
   netlify deploy --prod
   ```

### Option 3: Build & Upload to Any Host

```bash
cd client
npm run build

# Upload the 'dist' folder to your hosting provider
```

---

## Domain & SSL Setup

### 1. Get a Domain
- **Namecheap**: https://www.namecheap.com
- **GoDaddy**: https://www.godaddy.com
- **Google Domains**: https://domains.google

### 2. Point Domain to Your Hosting

**For Vercel/Netlify**:
- Add custom domain in dashboard
- Update DNS records as instructed

**For VPS (DigitalOcean)**:
- Add A record pointing to your server IP

### 3. Enable SSL (HTTPS)

**For Vercel/Netlify**: Automatic

**For VPS with Nginx**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Post-Deployment Configuration

### 1. Update Backend CORS

In `server/src/index.js`:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-frontend-domain.com',
  credentials: true
}));
```

### 2. Update Frontend API URL

In `client/src/lib/api.js`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://your-backend-domain.com/api'
```

### 3. Test Everything

- [ ] User registration works
- [ ] Login works
- [ ] Posts can be created
- [ ] Images upload successfully
- [ ] Videos upload successfully
- [ ] Messages send/receive
- [ ] Groups work
- [ ] Notifications work

---

## Monitoring & Maintenance

### 1. Setup Monitoring

**Backend Monitoring**:
- **UptimeRobot**: Free uptime monitoring
- **Sentry**: Error tracking
- **LogRocket**: Session replay

**Database Monitoring**:
- Check database size regularly
- Monitor query performance
- Setup automated backups

### 2. Regular Backups

**Database Backup** (Daily):
```bash
mysqldump -u user -p classmates_social > backup_$(date +%Y%m%d).sql
```

**Automated Backup Script**:
```bash
#!/bin/bash
# Save as backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > /backups/db_$DATE.sql
# Keep only last 7 days
find /backups -name "db_*.sql" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

### 3. Performance Optimization

**Enable Gzip** (Nginx):
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

**Add Caching Headers**:
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 4. Security Hardening

**Rate Limiting** (Add to server):
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

**Helmet.js** (Security headers):
```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

## Troubleshooting

### Common Issues

**1. CORS Errors**
- Check `CORS_ORIGIN` environment variable
- Ensure frontend URL matches exactly

**2. Database Connection Failed**
- Verify database credentials
- Check if database server is running
- Verify firewall rules

**3. File Uploads Not Working**
- Check `uploads` directory exists
- Verify write permissions
- Check `BASE_URL` is correct

**4. 502 Bad Gateway**
- Backend server not running
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs`

---

## Quick Deploy Commands

### Full Deployment Checklist

```bash
# 1. Update environment variables
cp server/.env.example server/.env
# Edit server/.env with production values

# 2. Test locally
cd server && npm start
cd client && npm run dev

# 3. Deploy backend (Railway example)
cd server
railway up

# 4. Deploy frontend (Vercel example)
cd client
vercel --prod

# 5. Update DNS records
# Point your domain to hosting providers

# 6. Test production
curl https://your-backend-url.com/api/health
# Open https://your-frontend-url.com in browser
```

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **PlanetScale Docs**: https://planetscale.com/docs
- **Nginx Docs**: https://nginx.org/en/docs/

---

## 🎉 Your Site is Live!

Congratulations! Your Classmates Social platform is now live and ready for users!

**Next Steps**:
1. Share the URL with your classmates
2. Monitor for any issues
3. Collect user feedback
4. Plan new features
5. Keep the platform updated

---

**Need Help?** Check the logs:
- Backend: `pm2 logs` or check hosting dashboard
- Frontend: Browser console (F12)
- Database: Check hosting provider logs
