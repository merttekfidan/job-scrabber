# Chrome Extension - Job Application Tracker

AI-powered Chrome extension for tracking job applications with automated interview preparation notes.

## 🚀 Installation

### For Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `extension/` directory from this project
5. The extension icon should appear in your Chrome toolbar

## ⚙️ Configuration

### 1. Get a Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Generate an API key
4. Copy the key

### 2. Configure the Extension

1. Click the extension icon in Chrome toolbar
2. Click the **Settings** (⚙️) icon
3. Paste your Groq API key
4. (Optional) Configure remote storage URL for syncing

### 3. Configure Remote Storage (Optional)

To sync your applications to the backend API:

1. Deploy the server (see `../README.md`)
2. Get your Railway API URL (e.g., `https://your-app.up.railway.app`)
3. In extension settings, set **Remote Storage URL** to:
   ```
   https://your-app.up.railway.app/api/save
   ```

## 📖 Usage

### Capturing Job Applications

1. Navigate to any job posting (LinkedIn, Indeed, etc.)
2. Click the extension icon
3. Click **"Capture This Job"**
4. The extension will:
   - Extract job details from the page
   - Use AI to structure the information
   - Generate interview preparation notes
   - Save to Chrome storage (and remote storage if configured)

### Viewing Applications

- **In Extension**: Click the extension icon to see recent captures
- **In Dashboard**: Open the dashboard (see root `../README.md` or access your deployed URL) for full management

## 🎯 Features

- **Smart Job Detection**: Automatically identifies job boards and extracts relevant data
- **AI-Powered Parsing**: Uses Groq's Llama 3.3 70B model to structure job information
- **Interview Prep**: Generates talking points, questions to ask, and identifies red flags
- **Local Storage**: All data saved in Chrome storage
- **Remote Sync**: Optional sync to backend API
- **Privacy-First**: Your data stays local unless you configure remote storage

## 🔧 Supported Job Boards

- LinkedIn
- Indeed
- Glassdoor
- AngelList
- Remote.co
- We Work Remotely
- And any other job posting site!

## 🐛 Troubleshooting

### Extension won't load
- Make sure you selected the `extension/` directory, not the project root
- Check for errors in `chrome://extensions/` with Developer mode enabled

### "Groq API key not configured" error
- Open extension settings and add your Groq API key
- Verify the key is correct at [console.groq.com](https://console.groq.com)

### Job capture fails
- Check browser console for errors (F12 → Console)
- Verify you have a valid Groq API key configured
- Some job boards may have unusual HTML structures - report issues on GitHub

### Remote sync not working
- Verify your server is deployed and running
- Check the Remote Storage URL is correct
- Test the server health endpoint: `https://your-app.up.railway.app/health`

## 📁 File Structure

```
extension/
├── manifest.json       # Extension configuration
├── background.js       # Service worker (handles API calls)
├── content.js          # Content script (extracts page data)
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── styles.css          # Popup styles
└── icons/              # Extension icons
```

## 🔒 Privacy & Security

- **API Key Storage**: Groq API key is stored locally in Chrome storage
- **Data Collection**: No analytics or tracking
- **Remote Storage**: Optional - you control where data is sent
- **Open Source**: All code is open for inspection

## 📝 License

MIT License - see LICENSE file in project root
