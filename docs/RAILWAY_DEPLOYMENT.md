# Railway Deployment Guide

Complete guide to deploy the Job Tracker API to Railway.

## 🚀 Quick Deploy

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Verify your email

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select your `job-scrabber` repository

### Step 3: Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database"
3. Choose "PostgreSQL"
4. Railway will automatically create the database and set `DATABASE_URL`

### Step 4: Configure Environment Variables
Railway automatically sets `DATABASE_URL`. You may want to add:

```
NODE_ENV=production
CORS_ORIGIN=chrome-extension://your-extension-id
PORT=3000
```

To add variables:
1. Click on your service
2. Go to "Variables" tab
3. Click "New Variable"
4. Add each variable

### Step 5: Run Database Migration
After first deployment:

1. Go to your service
2. Click "Settings" → "Deploy"
3. Under "Custom Start Command", temporarily set:
   ```
   npm run migrate && npm start
   ```
4. Redeploy
5. After migration completes, change back to:
   ```
   npm start
   ```

**OR** use Railway CLI:
```bash
railway run npm run migrate
```

### Step 6: Get Your API URL
1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

## 📝 Environment Variables

Required variables (set automatically or manually):

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Railway |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` (auto-set) |
| `CORS_ORIGIN` | Allowed origins | `*` or specific domain |

## 🔧 Railway CLI (Optional)

Install Railway CLI for easier management:

```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migrations
railway run npm run migrate

# View logs
railway logs

# Open dashboard
railway open
```

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-app.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-02-16T...",
  "uptime": 123.45
}
```

### 2. Test API Endpoints
```bash
# Get stats
curl https://your-app.up.railway.app/api/stats

# List applications
curl https://your-app.up.railway.app/api/list
```

### 3. Test from Extension
1. Update extension settings
2. Set Remote Storage URL to:
   ```
   https://your-app.up.railway.app/api/save
   ```
3. Track a test application
4. Verify in Railway database

### 4. Test Dashboard
1. Update `UI/app.js`:
   ```javascript
   const API_BASE_URL = 'https://your-app.up.railway.app/api';
   ```
2. Open dashboard
3. Verify data loads

## 📊 Monitoring

### View Logs
1. Go to your service in Railway
2. Click "Deployments"
3. Click on latest deployment
4. View real-time logs

### Database Access
1. Click on PostgreSQL service
2. Go to "Data" tab
3. Query your database directly

### Metrics
1. Go to "Metrics" tab
2. View CPU, memory, network usage

## 🔒 Security Best Practices

### 1. Set Specific CORS Origin
```
CORS_ORIGIN=chrome-extension://your-actual-extension-id
```

### 2. Use Environment Variables
Never hardcode:
- Database credentials
- API keys
- Sensitive configuration

### 3. Enable Railway's Built-in Security
Railway provides:
- Automatic HTTPS
- DDoS protection
- Private networking

## 🐛 Troubleshooting

### "Application failed to respond"
**Solution:** Check logs for errors
```bash
railway logs
```

### "Database connection failed"
**Solution:** Verify DATABASE_URL is set
```bash
railway variables
```

### "Migration failed"
**Solution:** Run migration manually
```bash
railway run npm run migrate
```

### "CORS error in extension"
**Solution:** Update CORS_ORIGIN
```
CORS_ORIGIN=chrome-extension://your-extension-id
```

## 💰 Pricing

Railway offers:
- **Free Tier**: $5 credit/month (enough for small projects)
- **Hobby Plan**: $5/month for more resources
- **Pro Plan**: $20/month for production apps

Your job tracker should easily fit in the free tier!

## 🔄 Continuous Deployment

Railway automatically deploys when you push to GitHub:

1. Make changes locally
2. Commit and push to GitHub
3. Railway detects changes
4. Automatically builds and deploys
5. Zero downtime deployment

## 📱 Update Extension & Dashboard

### Extension
Update `background.js`:
```javascript
// Old
const url = 'https://merttekfidan.com/job/api.php?action=save';

// New
const url = 'https://your-app.up.railway.app/api/save';
```

### Dashboard
Update `UI/app.js`:
```javascript
// Old
const API_BASE_URL = 'https://merttekfidan.com/job/dashboard-api.php';

// New
const API_BASE_URL = 'https://your-app.up.railway.app/api';
```

## ✅ Deployment Checklist

- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] PostgreSQL database added
- [ ] Environment variables configured
- [ ] Database migration completed
- [ ] Domain generated
- [ ] Health check passing
- [ ] Extension updated with new URL
- [ ] Dashboard updated with new URL
- [ ] End-to-end test successful

---

**Your API is now live on Railway! 🎉**
