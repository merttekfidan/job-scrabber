# Railway Deployment Fix

## Issue
Railway deployment is failing with "Pre-deploy command failed" error.

## Root Cause
There's likely a pre-deploy command configured in Railway's dashboard settings that's failing. This could be:
- A database migration command
- A build command
- Or another custom command

## Solution

### Option 1: Remove Pre-Deploy Command in Railway Dashboard (Recommended)

1. Go to your Railway project dashboard
2. Click on the **job-scrabber** service
3. Go to **Settings** tab
4. Scroll down to find **Deploy** section
5. Look for **"Pre-Deploy Command"** or **"Build Command"** fields
6. **Delete/Clear** any commands in these fields
7. Click **Save** or **Deploy**

The build process already handles everything via `package.json`:
- `npm install` - installs dependencies
- `npm run build` - installs server dependencies  
- `npm start` - starts the server

### Option 2: Fix the Pre-Deploy Command

If you want to keep a pre-deploy command (e.g., for database migration), set it to:

```bash
npm run migrate
```

**But first**, make sure you've run the migration at least once manually:
```bash
railway run npm run migrate
```

Then you can set it as a pre-deploy command for future deployments.

### Option 3: Check Railway Service Logs

1. In Railway dashboard, click on your **job-scrabber** service
2. Click on the failed deployment
3. Click **"View logs"** button
4. Look for the exact error message
5. Share the full error log if you need help debugging

## Environment Variables Check

Make sure these are set in Railway:
- `DATABASE_URL` - ✅ Auto-set by PostgreSQL service
- `NODE_ENV` - Set to `production`
- `CORS_ORIGIN` - Set to `*` or your extension ID
- `PORT` - ✅ Auto-set by Railway

## Quick Test

After fixing, test your deployment:

```bash
# Test health endpoint
curl https://your-app.up.railway.app/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-02-16T...",
  "uptime": 123.45
}
```

## Most Likely Fix

**The pre-deploy command field in Railway settings should be EMPTY.**

Railway's build process already handles everything automatically:
1. Detects Node.js project
2. Runs `npm install`
3. Runs `npm run build` (which installs server dependencies)
4. Runs `npm start` (which starts the server)

No pre-deploy command is needed!
