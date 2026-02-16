# Complete Deployment Guide

This guide covers deploying the entire Job Application Tracker system from scratch.

## 📋 Prerequisites

- Web hosting with PHP 7.4+ and MySQL
- phpMyAdmin access
- Chrome browser
- Groq API key ([Get one free](https://console.groq.com))

## 🚀 Step-by-Step Deployment

### Phase 1: Database Setup (5 minutes)

1. **Access phpMyAdmin**
   - Log in to your hosting control panel
   - Open phpMyAdmin

2. **Create/Select Database**
   ```sql
   USE warszawa_job;
   ```

3. **Run Schema**
   - Open `server/database.sql`
   - Copy all SQL
   - Paste into phpMyAdmin SQL tab
   - Click "Go"

4. **Verify Table Created**
   ```sql
   SHOW TABLES;
   -- Should see: applications
   
   DESCRIBE applications;
   -- Should see all columns
   ```

5. **Grant Permissions** (if needed)
   - Open `server/fix-permissions.sql`
   - Update with your database credentials
   - Run in phpMyAdmin

### Phase 2: Backend Deployment (10 minutes)

1. **Configure Database**
   - Open `server/config.php`
   - Update credentials:
     ```php
     define('DB_HOST', 'localhost');
     define('DB_NAME', 'warszawa_job');
     define('DB_USER', 'warszawa_job');
     define('DB_PASS', 'your_password');
     ```

2. **Upload Backend Files**
   ```
   Upload to: merttekfidan.com/job/
   
   Files to upload:
   ✓ config.php
   ✓ api.php
   ✓ dashboard-api.php
   ✓ .htaccess
   ✓ robots.txt
   ```

3. **Set Permissions**
   ```bash
   chmod 644 config.php
   chmod 644 api.php
   chmod 644 dashboard-api.php
   chmod 644 .htaccess
   chmod 644 robots.txt
   ```

4. **Test API Endpoints**
   ```
   Test 1: https://merttekfidan.com/job/api.php?action=stats
   Expected: {"success":true,"stats":{...}}
   
   Test 2: https://merttekfidan.com/job/dashboard-api.php?action=analytics
   Expected: {"success":true,"analytics":{...}}
   ```

5. **Upload Root robots.txt** (optional)
   ```
   Upload server/robots.txt to: merttekfidan.com/robots.txt
   This hides /job/ directory from Google
   ```

### Phase 3: Chrome Extension Setup (5 minutes)

1. **Load Extension**
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `job-scrabber` folder
   - Extension should appear in toolbar

2. **Configure Extension**
   - Click extension icon in toolbar
   - Click "⚙️ Settings" tab
   - Enter Groq API Key (get free key from [console.groq.com](https://console.groq.com))
   - Enter Remote Storage URL:
     ```
     https://merttekfidan.com/job/api.php?action=save
     ```
   - Click "Save Settings"
   - Should see "Settings saved successfully!"

3. **Test Extension**
   - Go to any job posting (LinkedIn, Indeed, etc.)
   - Click extension icon
   - Click "✓ Applied" button
   - Should see "Application saved successfully!"
   - Check phpMyAdmin - should see new row in `applications` table

### Phase 4: Dashboard Deployment (5 minutes)

1. **Configure API Endpoint**
   - Open `UI/app.js`
   - Verify `API_BASE_URL` is correct:
     ```javascript
     const API_BASE_URL = 'https://merttekfidan.com/job/dashboard-api.php';
     ```
   - Update if your backend is at a different location

2. **Upload Dashboard Files**
   ```
   Upload to: merttekfidan.com/job/dashboard/
   
   Files to upload:
   ✓ index.html
   ✓ app.js
   ✓ styles.css
   ✓ README.md (optional)
   ✓ API_DOCS.md (optional)
   ```

3. **Test Dashboard**
   - Visit: `https://merttekfidan.com/job/dashboard/`
   - Should see dashboard with charts
   - Should see any applications you've tracked
   - Test filters, search, and status updates

## ✅ Verification Checklist

### Backend
- [ ] Database table created successfully
- [ ] `api.php?action=stats` returns JSON
- [ ] `dashboard-api.php?action=analytics` returns JSON
- [ ] CORS headers working (no console errors)
- [ ] .htaccess file uploaded and working

### Extension
- [ ] Extension loaded in Chrome
- [ ] API key configured
- [ ] Remote storage URL configured
- [ ] Test application saved successfully
- [ ] Data appears in phpMyAdmin

### Dashboard
- [ ] Dashboard loads without errors
- [ ] Analytics cards show correct data
- [ ] Charts render properly
- [ ] Filters work correctly
- [ ] Search works correctly
- [ ] Status updates work
- [ ] CSV export works

## 🔧 Troubleshooting

### "Database connection failed"
**Problem:** Backend can't connect to MySQL

**Solutions:**
1. Check credentials in `config.php`
2. Verify database exists
3. Run `fix-permissions.sql` to grant access
4. Check if MySQL is running

### "CORS policy error"
**Problem:** Browser blocks API requests

**Solutions:**
1. Verify `.htaccess` is uploaded
2. Check `ALLOWED_ORIGIN` in `config.php`
3. Ensure `.htaccess` is being read (test with intentional syntax error)

### "Failed to save application"
**Problem:** Extension can't save to backend

**Solutions:**
1. Check Remote Storage URL in extension settings
2. Test API endpoint directly in browser
3. Check browser console for error details
4. Verify CORS headers

### "No applications found" in dashboard
**Problem:** Dashboard shows empty state

**Solutions:**
1. Verify API_BASE_URL in `app.js`
2. Check browser console for errors
3. Test API endpoint directly
4. Verify database has data

### Extension shows "API key not configured"
**Problem:** Groq API key missing

**Solutions:**
1. Click extension → Settings
2. Enter Groq API key
3. Click "Save Settings"
4. Reload extension if needed

## 🔒 Security Checklist

- [ ] Database credentials not hardcoded in public files
- [ ] `.htaccess` protects `config.php`
- [ ] CORS configured for specific domain only
- [ ] `robots.txt` hides backend from search engines
- [ ] API key stored in Chrome storage (not in code)
- [ ] HTTPS enabled on production domain
- [ ] Error reporting disabled in production (`config.php`)

## 📊 Production Optimization

### For Production Use:

1. **Disable Error Display**
   ```php
   // In config.php
   ini_set('display_errors', 0);
   error_reporting(0);
   ```

2. **Enable Error Logging**
   ```php
   ini_set('log_errors', 1);
   ini_set('error_log', '/path/to/error.log');
   ```

3. **Add Rate Limiting** (optional)
   - Implement request throttling in API
   - Prevent abuse

4. **Add Authentication** (optional)
   - Add API key authentication
   - Secure dashboard access

5. **Database Backups**
   - Set up automated backups
   - Export data regularly

## 🎯 Next Steps

After deployment:

1. **Start Tracking**
   - Browse job postings
   - Click "Applied" for each application
   - Data syncs automatically

2. **Use Dashboard**
   - Monitor your progress
   - Update application statuses
   - Export data as needed

3. **Customize**
   - Adjust colors in `styles.css`
   - Modify status values
   - Add custom fields

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check Network tab for API responses
3. Check phpMyAdmin for database data
4. Review this guide step-by-step
5. Check individual README files:
   - `server/DEPLOYMENT.md`
   - `UI/README.md`
   - `server/API_DOCS.md`

---

**Deployment complete! 🎉 Good luck with your job search!**
