# 🚀 Deploy Your Site NOW - 30 Minute Guide

Follow these exact steps to get your Classmates Social platform live on the internet in 30 minutes.

---

## ⚡ Quick Deploy (Fastest Path to Live Site)

### What You'll Get
- ✅ Live website accessible from anywhere
- ✅ Free hosting (no credit card needed)
- ✅ HTTPS/SSL automatically enabled
- ✅ Auto-deploy on code changes
- ✅ Professional URLs

### What You'll Need
- GitHub account (free)
- Railway account (free)
- Vercel account (free)
- 30 minutes of your time

---

## 📝 Step-by-Step Instructions

### STEP 1: Push Code to GitHub (5 minutes)

1. **Create GitHub Repository**
   - Go to https://github.com/new
   - Name: `classmates-social`
   - Make it Public or Private
   - Click "Create repository"

2. **Push Your Code**
   ```bash
   # In your project root (a:\projects\class_social)
   git init
   git add .
   git commit -m "Initial commit - Production ready"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/classmates-social.git
   git push -u origin main
   ```

---

### STEP 2: Deploy Database (5 minutes)

**Option A: Railway MySQL (Easiest)**

1. Go to https://railway.app
2. Click "Start a New Project"
3. Click "Deploy MySQL"
4. Wait for deployment (1-2 minutes)
5. Click on MySQL service
6. Go to "Variables" tab
7. **Copy these values** (you'll need them):
   - `MYSQL_HOST`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
   - `MYSQL_PORT`

8. **Run Migrations**
   - Click "Data" tab
   - Click "Query"
   - Copy and paste content from `server/sql/schema.sql`
   - Click "Run"
   - Repeat for:
     - `server/sql/alter_add_likes_comments.sql`
     - `server/sql/alter_add_read_at.sql`
     - `server/sql/alter_add_video_url.sql`
     - `server/sql/alter_add_groups.sql`

**Option B: PlanetScale (Alternative)**

1. Go to https://planetscale.com
2. Sign up with GitHub
3. Create new database "classmates-social"
4. Get connection string
5. Use MySQL client to run migrations

---

### STEP 3: Deploy Backend (10 minutes)

1. **Go to Railway**
   - https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select `classmates-social` repository

2. **Configure Backend**
   - Click "Add Service"
   - Select "GitHub Repo"
   - Choose your repository
   - Root Directory: `server`

3. **Set Environment Variables**
   - Click on your service
   - Go to "Variables" tab
   - Click "Raw Editor"
   - Paste this (update with your values):

   ```env
   NODE_ENV=production
   PORT=4000
   JWT_SECRET=your-super-secret-key-change-this-to-random-string-min-32-chars
   DB_HOST=your-mysql-host-from-step-2
   DB_PORT=3306
   DB_USER=your-mysql-user-from-step-2
   DB_PASSWORD=your-mysql-password-from-step-2
   DB_NAME=your-mysql-database-from-step-2
   BASE_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   CORS_ORIGIN=*
   UPLOAD_DIR=uploads
   ```

4. **Generate Domain**
   - Go to "Settings" tab
   - Click "Generate Domain"
   - Copy the URL (e.g., `https://your-app.railway.app`)
   - **Save this URL** - you'll need it for frontend

5. **Wait for Deployment**
   - Watch the "Deployments" tab
   - Wait for "Success" status (2-3 minutes)

6. **Test Backend**
   - Open `https://your-app.railway.app/api/health`
   - Should see: `{"status":"ok"}`
   - ✅ Backend is live!

---

### STEP 4: Deploy Frontend (10 minutes)

1. **Update API URL in Code**
   ```bash
   # Edit client/.env.production
   echo "VITE_API_URL=https://your-railway-url.railway.app/api" > client/.env.production
   
   # Commit the change
   git add client/.env.production
   git commit -m "Add production API URL"
   git push
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `client`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   
3. **Set Environment Variable**
   - In Vercel project settings
   - Go to "Environment Variables"
   - Add:
     - Name: `VITE_API_URL`
     - Value: `https://your-railway-url.railway.app/api`
     - Environment: Production

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Vercel will give you a URL like: `https://your-app.vercel.app`

5. **Test Frontend**
   - Open `https://your-app.vercel.app`
   - You should see the login page
   - ✅ Frontend is live!

---

### STEP 5: Update CORS (2 minutes)

1. **Update Backend CORS**
   - Go back to Railway
   - Click on your backend service
   - Go to "Variables"
   - Update `CORS_ORIGIN`:
     ```
     CORS_ORIGIN=https://your-app.vercel.app
     ```
   - Service will auto-redeploy

2. **Wait for Redeploy** (1-2 minutes)

---

### STEP 6: Test Everything (5 minutes)

1. **Open Your Site**
   - Go to `https://your-app.vercel.app`

2. **Test Registration**
   - Click "Sign Up"
   - Create an account
   - Should redirect to home page

3. **Test Core Features**
   - Create a post
   - Upload an image
   - Like the post
   - Create a group
   - Send a message

4. **If Everything Works:**
   - 🎉 **YOUR SITE IS LIVE!**

---

## 🎯 Your Live URLs

After deployment, you'll have:

- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-app.railway.app/api`
- **Database**: Managed by Railway/PlanetScale

---

## 🔧 Troubleshooting

### "Cannot connect to API"
- Check CORS_ORIGIN in Railway matches your Vercel URL exactly
- Check VITE_API_URL in Vercel environment variables
- Wait 2 minutes after changing variables (auto-redeploy)

### "Database connection failed"
- Verify database credentials in Railway variables
- Check if database service is running
- Verify migrations were run

### "404 Not Found"
- Check Root Directory is set to `server` (backend) or `client` (frontend)
- Verify build completed successfully
- Check deployment logs

### "CORS Error"
- Update CORS_ORIGIN to match your frontend URL exactly
- Don't include trailing slash
- Wait for backend to redeploy

---

## 🎨 Optional: Custom Domain (10 minutes)

### Add Your Own Domain

1. **Buy a Domain** (if you don't have one)
   - Namecheap: ~$10/year
   - GoDaddy: ~$12/year
   - Google Domains: ~$12/year

2. **Add to Vercel (Frontend)**
   - Vercel Dashboard → Your Project
   - Settings → Domains
   - Add your domain (e.g., `classmates.social`)
   - Follow DNS instructions
   - SSL automatically enabled

3. **Add to Railway (Backend - Optional)**
   - Railway Project → Settings
   - Add custom domain (e.g., `api.classmates.social`)
   - Update DNS records

4. **Update CORS**
   - Change `CORS_ORIGIN` to your custom domain
   - Change `VITE_API_URL` to your custom API domain

---

## 📊 What You've Deployed

### Infrastructure
- ✅ **Frontend**: React app on Vercel CDN
- ✅ **Backend**: Node.js API on Railway
- ✅ **Database**: MySQL on Railway/PlanetScale
- ✅ **SSL**: Automatic HTTPS
- ✅ **Auto-deploy**: Push to GitHub = auto deploy

### Features Live
- ✅ User registration & login
- ✅ Posts (text, images, videos)
- ✅ Likes & comments
- ✅ Direct messaging
- ✅ Groups with admin controls
- ✅ Stories & Reels
- ✅ Notifications
- ✅ Follow system
- ✅ User profiles
- ✅ Search

---

## 🚀 Next Steps After Deployment

### Immediate
1. **Share the URL** with friends/classmates
2. **Create your profile** and test all features
3. **Monitor for errors** in Railway/Vercel dashboards
4. **Gather feedback** from early users

### Within 24 Hours
1. **Setup monitoring**
   - UptimeRobot: https://uptimerobot.com (free)
   - Monitor your site's uptime

2. **Add analytics** (optional)
   - Google Analytics
   - Plausible Analytics

3. **Create social media accounts**
   - Twitter/X
   - Instagram
   - Facebook page

### Within 1 Week
1. **Fix any bugs** reported by users
2. **Optimize performance** based on usage
3. **Plan new features** based on feedback
4. **Create user documentation**
5. **Setup automated backups**

---

## 💰 Cost Breakdown

### Free Tier (Good for 100-500 users)
- Vercel: Free
- Railway: $5 credit/month (free tier)
- PlanetScale: Free (5GB)
- **Total: $0/month**

### When to Upgrade
- More than 500 active users
- Need more database storage
- Need faster performance
- Want custom domain

### Paid Tier (~1000+ users)
- Vercel Pro: $20/month
- Railway: $5-20/month
- PlanetScale: $29/month
- Domain: $10/year
- **Total: ~$55-70/month**

---

## 📞 Support

### Deployment Issues
- **Railway**: https://railway.app/help
- **Vercel**: https://vercel.com/support
- **PlanetScale**: https://planetscale.com/support

### Documentation
- Check `PRODUCTION_DEPLOYMENT.md` for detailed guides
- Check `PRODUCTION_CHECKLIST.md` for verification
- Check `README.md` for feature documentation

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Database deployed and migrated
- [ ] Backend deployed to Railway
- [ ] Environment variables set
- [ ] Backend URL works (/api/health)
- [ ] Frontend deployed to Vercel
- [ ] VITE_API_URL set in Vercel
- [ ] CORS updated with frontend URL
- [ ] Can register new user
- [ ] Can create posts
- [ ] Can upload images
- [ ] Can send messages
- [ ] Can create groups
- [ ] All features working
- [ ] Shared URL with others
- [ ] Monitoring setup

---

## 🎉 Congratulations!

If you've completed all steps above, your Classmates Social platform is now:

- ✅ **LIVE** on the internet
- ✅ **Accessible** from anywhere
- ✅ **Secure** with HTTPS
- ✅ **Scalable** and ready to grow
- ✅ **Professional** and production-ready

**Your site is at**: `https://your-app.vercel.app`

**Share it with the world!** 🌍

---

## 🎯 Quick Commands Reference

```bash
# Push code to GitHub
git add .
git commit -m "Update"
git push

# Test backend locally
cd server && npm start

# Test frontend locally
cd client && npm run dev

# Build frontend
cd client && npm run build

# View Railway logs
railway logs

# View Vercel logs
vercel logs
```

---

**Need help?** Check the documentation files or contact hosting support.

**Ready to deploy?** Start with Step 1 above! ⬆️

**Good luck with your launch!** 🚀🎊
