# 🚀 Production Deployment Checklist

Use this checklist to ensure your Classmates Social platform is production-ready.

---

## 📋 Pre-Launch Checklist

### ✅ Security

- [ ] **Change JWT_SECRET** to a strong random string (min 32 characters)
- [ ] **Update database passwords** - Use strong, unique passwords
- [ ] **Enable HTTPS/SSL** - All traffic should be encrypted
- [ ] **Configure CORS** - Set specific allowed origins, not `*`
- [ ] **Remove console.logs** - Clean up debug statements
- [ ] **Hide error details** - Don't expose stack traces to users
- [ ] **Rate limiting** - Protect against brute force attacks
- [ ] **Input validation** - Sanitize all user inputs
- [ ] **File upload limits** - Set max file sizes
- [ ] **SQL injection protection** - Use parameterized queries (already done)

### ✅ Environment Variables

#### Backend (.env)
- [ ] `NODE_ENV=production`
- [ ] `PORT` - Set production port
- [ ] `JWT_SECRET` - Strong random string
- [ ] `DB_HOST` - Production database host
- [ ] `DB_USER` - Database username
- [ ] `DB_PASSWORD` - Strong database password
- [ ] `DB_NAME` - Production database name
- [ ] `BASE_URL` - Your production backend URL
- [ ] `CORS_ORIGIN` - Your production frontend URL

#### Frontend (.env.production)
- [ ] `VITE_API_URL` - Production backend API URL

### ✅ Database

- [ ] **Run all migrations** - Ensure schema is up to date
  ```bash
  node server/scripts/add_groups_tables.js
  ```
- [ ] **Create database backups** - Setup automated backups
- [ ] **Optimize indexes** - Check query performance
- [ ] **Set connection limits** - Configure max connections
- [ ] **Enable slow query log** - Monitor performance
- [ ] **Test database connection** - Verify credentials work

### ✅ Code Quality

- [ ] **Remove unused code** - Clean up commented code
- [ ] **Fix all warnings** - Address ESLint/console warnings
- [ ] **Optimize images** - Compress all images
- [ ] **Minify assets** - Build optimizes automatically
- [ ] **Remove development dependencies** - Use `npm install --production`
- [ ] **Update dependencies** - Check for security updates
- [ ] **Test all features** - Complete manual testing
- [ ] **Cross-browser testing** - Test on Chrome, Firefox, Safari, Edge

### ✅ Performance

- [ ] **Enable gzip compression** - Reduce bandwidth
- [ ] **Add caching headers** - Improve load times
- [ ] **Optimize database queries** - Add indexes where needed
- [ ] **Lazy load images** - Improve initial load
- [ ] **Code splitting** - Vite handles this automatically
- [ ] **CDN for static assets** - Consider using a CDN
- [ ] **Database connection pooling** - Already configured

### ✅ Monitoring & Logging

- [ ] **Setup error tracking** - Sentry, LogRocket, or similar
- [ ] **Setup uptime monitoring** - UptimeRobot, Pingdom
- [ ] **Configure logging** - Winston or similar
- [ ] **Setup analytics** - Google Analytics, Plausible
- [ ] **Monitor server resources** - CPU, RAM, disk usage
- [ ] **Database monitoring** - Query performance, connections

### ✅ Backup & Recovery

- [ ] **Automated database backups** - Daily backups
- [ ] **Test backup restoration** - Verify backups work
- [ ] **Backup uploaded files** - Store in cloud storage
- [ ] **Document recovery process** - Write recovery guide
- [ ] **Offsite backup storage** - Don't store backups on same server

### ✅ Legal & Compliance

- [ ] **Privacy Policy** - Create and publish
- [ ] **Terms of Service** - Create and publish
- [ ] **Cookie Policy** - If using cookies
- [ ] **GDPR Compliance** - If serving EU users
- [ ] **Data retention policy** - Define how long data is kept
- [ ] **User data export** - Allow users to download their data
- [ ] **Account deletion** - Allow users to delete accounts

### ✅ User Experience

- [ ] **404 page** - Create custom 404 page
- [ ] **Error boundaries** - Already implemented ✓
- [ ] **Loading states** - Show loading indicators
- [ ] **Empty states** - Handle empty data gracefully
- [ ] **Success messages** - Confirm user actions
- [ ] **Error messages** - Clear, helpful error messages
- [ ] **Mobile responsive** - Test on mobile devices
- [ ] **Accessibility** - Test with screen readers

### ✅ SEO & Meta Tags

- [ ] **Meta descriptions** - Already added ✓
- [ ] **Open Graph tags** - Already added ✓
- [ ] **Twitter cards** - Already added ✓
- [ ] **Favicon** - Already created ✓
- [ ] **Sitemap.xml** - Generate sitemap
- [ ] **Robots.txt** - Configure search engine access
- [ ] **Canonical URLs** - Prevent duplicate content

### ✅ Testing

- [ ] **User registration** - Test signup flow
- [ ] **User login** - Test login flow
- [ ] **Password reset** - Test if implemented
- [ ] **Create posts** - Test text, image, video posts
- [ ] **Like/comment** - Test interactions
- [ ] **Follow users** - Test follow system
- [ ] **Send messages** - Test direct messaging
- [ ] **Create groups** - Test group creation
- [ ] **Group chat** - Test group messaging
- [ ] **Admin controls** - Test promote/remove members
- [ ] **File uploads** - Test image/video uploads
- [ ] **Notifications** - Test notification system
- [ ] **Stories** - Test story creation/viewing
- [ ] **Reels** - Test reel upload/playback

---

## 🔧 Configuration Files to Update

### 1. server/.env
```env
NODE_ENV=production
PORT=4000
JWT_SECRET=your-super-secret-production-key-min-32-chars
DB_HOST=your-production-db-host
DB_USER=your-db-user
DB_PASSWORD=your-strong-db-password
DB_NAME=classmates_social
BASE_URL=https://api.your-domain.com
CORS_ORIGIN=https://your-domain.com
```

### 2. client/.env.production
```env
VITE_API_URL=https://api.your-domain.com/api
```

### 3. Update API URL in client/src/lib/api.js
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://api.your-domain.com/api'
```

---

## 🚀 Deployment Steps

### Step 1: Prepare Code
```bash
# Pull latest code
git pull origin main

# Install dependencies
cd server && npm install --production
cd ../client && npm install

# Build frontend
cd client && npm run build
```

### Step 2: Setup Database
```bash
# Run migrations
cd server
node scripts/add_groups_tables.js

# Verify tables
mysql -u user -p -e "SHOW TABLES" classmates_social
```

### Step 3: Deploy Backend
```bash
# Option A: Railway
cd server
railway up

# Option B: PM2 on VPS
pm2 start src/index.js --name classmates-api
pm2 save
```

### Step 4: Deploy Frontend
```bash
# Option A: Vercel
cd client
vercel --prod

# Option B: Netlify
netlify deploy --prod
```

### Step 5: Configure DNS
- Point your domain to hosting provider
- Wait for DNS propagation (up to 48 hours)

### Step 6: Enable SSL
- Automatic on Vercel/Netlify
- Use Let's Encrypt on VPS:
  ```bash
  sudo certbot --nginx -d your-domain.com
  ```

---

## ✅ Post-Deployment Verification

### Immediately After Deployment

- [ ] **Site loads** - Visit https://your-domain.com
- [ ] **API responds** - Visit https://api.your-domain.com/api/health
- [ ] **HTTPS works** - Check for padlock icon
- [ ] **No console errors** - Open browser DevTools
- [ ] **Register new user** - Test signup
- [ ] **Login works** - Test login
- [ ] **Create post** - Test core functionality
- [ ] **Upload image** - Test file uploads
- [ ] **Send message** - Test messaging
- [ ] **Create group** - Test groups

### Within 24 Hours

- [ ] **Monitor error logs** - Check for unexpected errors
- [ ] **Check server resources** - CPU, RAM, disk usage
- [ ] **Verify backups running** - Check backup logs
- [ ] **Test from different devices** - Mobile, tablet, desktop
- [ ] **Test from different browsers** - Chrome, Firefox, Safari
- [ ] **Check analytics** - Verify tracking works
- [ ] **Monitor uptime** - Check uptime monitoring service

### Within 1 Week

- [ ] **Gather user feedback** - Ask early users for feedback
- [ ] **Fix critical bugs** - Address any reported issues
- [ ] **Optimize slow queries** - Check database performance
- [ ] **Review error logs** - Look for patterns
- [ ] **Update documentation** - Document any changes
- [ ] **Plan next features** - Based on user feedback

---

## 🆘 Troubleshooting

### Site Not Loading
1. Check DNS propagation: https://dnschecker.org
2. Verify hosting service is running
3. Check domain configuration
4. Review SSL certificate status

### API Errors
1. Check backend logs
2. Verify environment variables
3. Test database connection
4. Check CORS configuration

### Database Connection Failed
1. Verify credentials in .env
2. Check database server status
3. Verify firewall rules
4. Test connection from server

### File Uploads Not Working
1. Check uploads directory exists
2. Verify write permissions
3. Check file size limits
4. Verify BASE_URL is correct

---

## 📊 Success Metrics

After deployment, monitor these metrics:

- **Uptime**: Target 99.9%
- **Response Time**: < 500ms average
- **Error Rate**: < 1%
- **User Registrations**: Track growth
- **Active Users**: Daily/weekly active users
- **Engagement**: Posts, messages, group activity

---

## 🎉 Launch Checklist

- [ ] All items above completed
- [ ] Team notified of launch
- [ ] Support channels ready
- [ ] Monitoring dashboards setup
- [ ] Backup plan documented
- [ ] Rollback plan ready
- [ ] Announcement prepared
- [ ] Social media posts ready

---

## 📞 Emergency Contacts

**Hosting Provider Support:**
- Railway: https://railway.app/help
- Vercel: https://vercel.com/support
- PlanetScale: https://planetscale.com/support

**Team Contacts:**
- Developer: your-email@example.com
- Database Admin: db-admin@example.com
- DevOps: devops@example.com

---

**Ready to launch? Double-check everything above, then go live! 🚀**
