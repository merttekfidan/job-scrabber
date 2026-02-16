# PHP MySQL Backend Setup Guide

## Quick Setup

### Step 1: Create Database in phpMyAdmin

1. **Login to phpMyAdmin**
   - Go to your hosting control panel (cPanel, Plesk, etc.)
   - Open phpMyAdmin

2. **Run SQL Script**
   - Click "SQL" tab
   - Copy and paste the entire contents of `server/database.sql`
   - Click "Go"
   - This creates the `job_tracker` database and `applications` table

### Step 2: Configure Database Credentials

1. **Edit `config.php`**
   - Open `server/config.php`
   - Update these lines with your phpMyAdmin credentials:
   ```php
   define('DB_USER', 'YOUR_USERNAME');  // Your database username
   define('DB_PASS', 'YOUR_PASSWORD');  // Your database password
   ```

### Step 3: Upload Files to Server

1. **Upload to your server:**
   - Upload `server/config.php` to `merttekfidan.com/job/config.php`
   - Upload `server/api.php` to `merttekfidan.com/job/api.php`

2. **Set file permissions:**
   - `config.php`: 644 (read-only for security)
   - `api.php`: 644

3. **Hide from Google (robots.txt):**
   - Create/edit `merttekfidan.com/job/robots.txt`:
   ```
   User-agent: *
   Disallow: /job/
   ```

### Step 4: Update Chrome Extension

1. **Update `background.js`:**
   - Find the `syncToGoogleSheets` function
   - Change the URL check to use your PHP endpoint:
   ```javascript
   const webAppUrl = 'https://merttekfidan.com/job/api.php?action=save';
   ```

2. **Or update via extension settings:**
   - Open extension settings
   - In "Google Sheets Web App URL" field, enter:
   ```
   https://merttekfidan.com/job/api.php?action=save
   ```

### Step 5: Test

1. **Test the API directly:**
   - Visit: `https://merttekfidan.com/job/api.php?action=stats`
   - You should see: `{"success":true,"stats":{...}}`

2. **Test from extension:**
   - Go to any job posting
   - Click "Applied"
   - Check phpMyAdmin to see the new row in `applications` table

## API Endpoints

### Save Job Application
```
POST https://merttekfidan.com/job/api.php?action=save
```

### List All Applications
```
GET https://merttekfidan.com/job/api.php?action=list
GET https://merttekfidan.com/job/api.php?action=list&limit=50&offset=0
```

### Get Statistics
```
GET https://merttekfidan.com/job/api.php?action=stats
```

## Security Notes

1. **Database credentials**: Never commit `config.php` with real credentials to Git
2. **CORS**: The API allows all origins (`*`). For better security, change to your extension ID
3. **HTTPS**: Make sure your site uses HTTPS
4. **Backup**: Regularly backup your database

## Troubleshooting

### "Database connection failed"
- Check credentials in `config.php`
- Verify database exists in phpMyAdmin
- Check if database user has permissions

### "CORS error"
- Make sure `api.php` has CORS headers
- Check if your hosting allows CORS

### "500 Internal Server Error"
- Check PHP error logs
- Verify PHP version is 7.4 or higher
- Check file permissions

## Building a Dashboard

You can now build a custom dashboard using the API:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Job Applications Dashboard</title>
</head>
<body>
    <h1>My Job Applications</h1>
    <div id="stats"></div>
    <div id="applications"></div>

    <script>
        // Get statistics
        fetch('https://merttekfidan.com/job/api.php?action=stats')
            .then(r => r.json())
            .then(data => {
                document.getElementById('stats').innerHTML = 
                    `<p>Total: ${data.stats.total}</p>`;
            });

        // Get applications
        fetch('https://merttekfidan.com/job/api.php?action=list')
            .then(r => r.json())
            .then(data => {
                const html = data.applications.map(app => 
                    `<div>
                        <h3>${app.job_title} at ${app.company}</h3>
                        <p>${app.location} - ${app.salary}</p>
                    </div>`
                ).join('');
                document.getElementById('applications').innerHTML = html;
            });
    </script>
</body>
</html>
```
