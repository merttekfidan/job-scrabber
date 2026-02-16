# Job Application Tracker

A complete job tracking system with Chrome extension, Node.js backend API, and web dashboard for managing your job search journey.

![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)

## 🚀 Features

### Chrome Extension
- **One-Click Tracking**: Click "Applied" on any job posting
- **AI-Powered Extraction**: Groq LLM extracts all job details automatically
- **Universal Support**: Works on LinkedIn, Indeed, Glassdoor, and any job board
- **Auto-Sync**: Automatically syncs to your backend API
- **Interview Prep**: AI-generated talking points, questions, and red flags

### Web Dashboard
- **Beautiful Analytics**: Overview cards, charts, and insights
- **Smart Filtering**: Filter by status, work mode, company
- **Real-time Search**: Search across all fields
- **Status Management**: Update application status with dropdown
- **CSV Export**: Download your data anytime
- **Responsive Design**: Works on desktop, tablet, and mobile

## 📁 Project Structure

```
job-scrabber/
├── extension/              # Chrome Extension
│   ├── manifest.json      # Extension configuration
│   ├── background.js      # Service worker (API calls)
│   ├── content.js         # Page content extractor
│   ├── popup.html/js      # Extension popup UI
│   ├── styles.css         # Extension styles
│   ├── icons/             # Extension icons
│   └── README.md          # Extension setup guide
├── server/                 # Backend API (Node.js + PostgreSQL)
│   ├── index.js           # Express server
│   ├── db.js              # Database connection
│   ├── migrate.js         # Database migration
│   ├── schema.sql         # Database schema
│   ├── routes/            # API routes
│   ├── package.json       # Server dependencies
│   └── README.md          # Server setup guide
├── dashboard/              # Web Dashboard (HTML/CSS/JS)
│   ├── index.html         # Dashboard UI
│   ├── app.js             # Dashboard logic
│   ├── styles.css         # Dashboard styles
│   ├── API_DOCS.md        # API documentation
│   └── README.md          # Dashboard guide
├── docs/                   # Documentation
│   ├── RAILWAY_DEPLOYMENT.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── QUICK_START.md
│   └── GEMINI_PROMPT.md
├── package.json            # Root package.json (for Railway)
├── Procfile                # Railway deployment config
└── README.md               # This file
```

## 🎯 Quick Start

### 1. Setup Backend (Railway - 5 minutes)

See [docs/RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md) for complete guide.

**Quick steps:**
1. Push to GitHub
2. Create Railway project from GitHub repo
3. Add PostgreSQL database
4. Set environment variables: `NODE_ENV=production`, `CORS_ORIGIN=*`
5. Run migration: `railway run npm run migrate`
6. Get your Railway URL

**OR Local Development:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm run migrate
npm run dev
```

### 2. Install Chrome Extension (2 minutes)

1. **Load Extension**
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/` folder

2. **Configure**
   - Click extension icon → Settings
   - Add Groq API Key: Get free key from [console.groq.com](https://console.groq.com)
   - Add Remote Storage URL: `https://your-app.up.railway.app/api/save`
   - Click "Save Settings"

3. **Test**
   - Go to any job posting
   - Click extension → "✓ Applied"
   - Check Railway database for new row

### 3. Open Dashboard (1 minute)

1. **Serve Dashboard Locally**
   ```bash
   cd dashboard
   python3 -m http.server 8080
   # Open http://localhost:8080
   ```

2. **Configure API**
   - Edit `dashboard/app.js`
   - Update `API_BASE_URL` to your Railway URL

3. **Or Deploy to Static Hosting**
   - Vercel, Netlify, GitHub Pages, etc.
   - See `dashboard/README.md` for deployment options

## 💡 How It Works

```
┌─────────────────┐
│  Job Posting    │
│  (Any Website)  │
└────────┬────────┘
         │
         │ 1. User clicks "Applied"
         ▼
┌─────────────────┐
│ Chrome Extension│
│  content.js     │
└────────┬────────┘
         │
         │ 2. Extracts raw page content
         ▼
┌─────────────────┐
│  background.js  │
│  + Groq API     │
└────────┬────────┘
         │
         │ 3. LLM parses all data
         │    (title, company, skills, etc.)
         ▼
┌─────────────────┐
│  PHP Backend    │
│  MySQL Database │
└────────┬────────┘
         │
         │ 4. Stores in database
         ▼
┌─────────────────┐
│  Web Dashboard  │
│  Analytics & UI │
└─────────────────┘
```

## 🔧 Technologies

### Extension
- **Manifest V3**: Modern Chrome extension
- **Groq API**: llama-3.3-70b-versatile for AI extraction
- **Chrome Storage**: Local data backup

### Backend
- **Node.js 18+**: JavaScript runtime
- **Express.js**: Web framework
- **PostgreSQL**: Database storage
- **Railway**: Cloud deployment

### Dashboard
- **HTML/CSS/JS**: Pure vanilla (no frameworks)
- **Chart.js**: Interactive charts
- **Google Fonts**: Inter typography

## 📊 Database Schema

```sql
applications (
  id SERIAL PRIMARY KEY,
  application_date TIMESTAMP,
  job_title VARCHAR(500),
  company VARCHAR(255),
  location VARCHAR(255),
  work_mode VARCHAR(50),
  salary VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Applied',
  job_url TEXT,
  company_url TEXT,
  key_responsibilities JSONB,
  required_skills JSONB,
  preferred_skills JSONB,
  company_description TEXT,
  interview_prep_* JSONB,
  source VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## 🔌 API Endpoints

### Main API
- `POST /api/save` - Save job application
- `GET /api/list` - List all applications
- `GET /api/stats` - Get statistics

### Dashboard API
- `GET /api/filter` - Filter applications
- `GET /api/search` - Search applications
- `POST /api/update-status` - Update status
- `DELETE /api/delete/:id` - Delete application
- `GET /api/analytics` - Detailed analytics
- `GET /api/recent` - Recent applications
- `GET /api/companies` - Company list

See [server/README.md](server/README.md) for complete API documentation.

## 🎨 Dashboard Features

- **Analytics Overview**: Total apps, interviews, offers, response rate
- **Interactive Charts**: Status, timeline, work mode, top companies
- **Smart Filters**: Status, work mode, company
- **Real-time Search**: Across all fields
- **Status Updates**: Change status with dropdown
- **Delete Applications**: With confirmation
- **CSV Export**: Download filtered data
- **Responsive**: Mobile-friendly design

## 🔒 Security

- **API Key Storage**: Chrome storage (not hardcoded)
- **CORS**: Configured in .htaccess
- **robots.txt**: Hides backend from Google
- **Config Protection**: .htaccess blocks direct access
- **HTTPS**: Required for production

## 📝 Usage

1. **Track Applications**
   - Browse job postings
   - Click extension → "Applied"
   - Data auto-syncs to database

2. **View Dashboard**
   - Open dashboard URL
   - See analytics and charts
   - Filter and search applications

3. **Manage Applications**
   - Click any card for details
   - Update status
   - Delete if needed
   - Export to CSV

## 🐛 Troubleshooting

### Extension Issues
- **"API key not configured"**: Add Groq API key in settings
- **"Failed to save"**: Check Remote Storage URL
- **No data extracted**: Reload extension and try again

### Backend Issues
- **"Database connection failed"**: Check credentials in config.php
- **"CORS error"**: Verify .htaccess is uploaded
- **404 errors**: Check file paths and permissions

### Dashboard Issues
- **No data showing**: Verify API_BASE_URL in app.js
- **Charts not loading**: Check browser console for errors
- **Filters not working**: Clear browser cache

## 📖 Documentation

- [Extension Setup](README.md) - This file
- [Backend Setup](server/README.md) - Node.js/PostgreSQL setup
- [Railway Deployment](RAILWAY_DEPLOYMENT.md) - Cloud deployment guide
- [Dashboard Guide](UI/README.md) - Dashboard usage
- [Dashboard API](UI/API_DOCS.md) - Dashboard API reference

## 🚀 Future Enhancements

- [ ] Email notifications
- [ ] Calendar integration
- [ ] Salary insights
- [ ] Application success predictions
- [ ] Custom tags and notes
- [ ] Mobile app
- [ ] Team collaboration

## 📄 License

MIT License - Free to use and modify!

## 🤝 Support

Having issues? Check:
1. Browser console for errors
2. Network tab for API responses
3. phpMyAdmin for database data
4. Documentation files

---

**Built with ❤️ for job seekers. Good luck with your search! 🚀**
