# Job Application Dashboard UI

A beautiful, modern dashboard for tracking your job application journey with powerful analytics, filtering, and search capabilities.

![Dashboard Preview](https://img.shields.io/badge/Status-Ready-success?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)

## ✨ Features

### 📊 **Analytics Dashboard**
- **Overview Cards**: Total applications, interviews, offers, and response rate
- **Interactive Charts**: 
  - Status distribution (doughnut chart)
  - Applications timeline (line chart)
  - Work mode breakdown (bar chart)
  - Top companies list

### 🔍 **Smart Search & Filtering**
- **Real-time Search**: Search across job titles, companies, locations, and skills
- **Multi-filter System**: Filter by status, work mode, and company
- **Combined Filters**: Apply multiple filters simultaneously
- **Quick Clear**: Reset all filters with one click

### 📝 **Application Management**
- **Beautiful Card Layout**: Clean, organized view of all applications
- **Detailed Modal**: View complete application information
- **Status Updates**: Change application status with dropdown
- **Delete Applications**: Remove applications with confirmation
- **CSV Export**: Download filtered applications as CSV

### 🎨 **Premium Design**
- **Dark Mode**: Sleek dark theme with vibrant accents
- **Glassmorphism**: Frosted glass effects on cards and modals
- **Smooth Animations**: Fade-in, slide-in, and scale transitions
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Custom Icons**: Clean, consistent iconography throughout

## 🚀 Quick Start

### Prerequisites
- A web server (local or remote)
- Access to the PHP backend API at `https://merttekfidan.com/job/dashboard-api.php`

### Installation

1. **Open the Dashboard**
   ```bash
   # Simply open index.html in your browser
   open index.html
   
   # Or serve with a local server
   python3 -m http.server 8000
   # Then visit http://localhost:8000
   ```

2. **Configure API Endpoint** (if needed)
   - Open `app.js`
   - Update `API_BASE_URL` if your backend is at a different location:
     ```javascript
     const API_BASE_URL = 'https://your-domain.com/path/to/dashboard-api.php';
     ```

3. **Start Tracking!**
   - The dashboard will automatically load your applications
   - Use the Chrome extension to add new applications
   - They'll appear in the dashboard in real-time

## 📖 Usage Guide

### Viewing Analytics
- **Overview Cards** show your key metrics at a glance
- **Charts** provide visual insights into your application journey
- **Top Companies** list shows where you've applied most

### Searching Applications
1. Use the search box to find applications by keyword
2. Search works across job titles, companies, locations, and skills
3. Results update in real-time as you type

### Filtering Applications
1. Use the filter dropdowns to narrow down applications
2. Filter by:
   - **Status**: Applied, Interview, Offer, Rejected, etc.
   - **Work Mode**: Remote, Hybrid, Onsite
   - **Company**: Select from companies you've applied to
3. Combine multiple filters for precise results
4. Click "Clear Filters" to reset

### Managing Applications
1. **View Details**: Click any application card to see full details
2. **Update Status**: Use the dropdown in the modal to change status
3. **Delete Application**: Click "Delete" in the modal, then confirm
4. **Export Data**: Click "Export CSV" to download your applications

### Refreshing Data
- Click the "Refresh" button in the header to reload all data
- The dashboard automatically updates after status changes or deletions

## 🎨 Design System

### Color Palette
- **Background**: Deep dark (`#0a0a0f`, `#13131a`, `#1a1a24`)
- **Accents**: Purple (`#667eea`), Pink (`#f093fb`), Blue (`#4facfe`)
- **Text**: White (`#ffffff`), Gray (`#a0a0b8`, `#6b6b80`)

### Typography
- **Font**: Inter (Google Fonts)
- **Sizes**: 0.75rem to 2rem with responsive scaling

### Components
- **Cards**: Glassmorphism with backdrop blur
- **Buttons**: Gradient backgrounds with hover effects
- **Modals**: Centered with overlay and animations
- **Charts**: Chart.js with custom color schemes

## 📱 Responsive Breakpoints

- **Desktop**: 1024px and above (full layout)
- **Tablet**: 768px - 1023px (adjusted grid)
- **Mobile**: Below 768px (stacked layout)

## 🔧 Technical Details

### File Structure
```
UI/
├── index.html          # Main dashboard HTML
├── styles.css          # Complete design system
├── app.js              # Application logic & API integration
├── API_DOCS.md         # Backend API documentation
└── README.md           # This file
```

### Dependencies
- **Chart.js** (v4.4.1): For interactive charts
- **Google Fonts**: Inter font family
- **No build tools required**: Pure HTML/CSS/JavaScript

### Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## 🔌 API Integration

The dashboard connects to your PHP backend API with these endpoints:

| Endpoint | Purpose |
|----------|---------|
| `?action=analytics` | Load dashboard statistics |
| `?action=filter` | Filter applications |
| `?action=search&q=query` | Search applications |
| `?action=update_status` | Update application status |
| `?action=delete&id=X` | Delete an application |
| `?action=companies` | Get company list |

See [API_DOCS.md](API_DOCS.md) for complete API documentation.

## 🎯 Keyboard Shortcuts

- **Search**: Click search box or start typing
- **Escape**: Close modals
- **Enter**: Submit forms

## 🐛 Troubleshooting

### Dashboard shows "No applications found"
- Check that your Chrome extension is syncing to the backend
- Verify the API endpoint is correct in `app.js`
- Check browser console for API errors

### Charts not displaying
- Ensure Chart.js is loading (check browser console)
- Verify you have application data in the database
- Check that analytics endpoint is returning data

### Filters not working
- Clear browser cache and reload
- Check that filter values match your data
- Verify API responses in Network tab

### Styling looks broken
- Ensure `styles.css` is loading correctly
- Check that Google Fonts is accessible
- Verify no CSS conflicts with browser extensions

## 🚀 Future Enhancements

Potential features for future versions:
- [ ] Email notifications for status changes
- [ ] Interview preparation checklist
- [ ] Salary comparison charts
- [ ] Application success rate predictions
- [ ] Integration with calendar for interview scheduling
- [ ] Custom tags and notes
- [ ] Advanced analytics (conversion rates, time-to-offer, etc.)

## 📄 License

MIT License - feel free to modify and use as needed!

## 🤝 Contributing

This is a personal project, but suggestions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

**Built with ❤️ for job seekers everywhere. Good luck with your applications! 🚀**
