# Dashboard API Endpoints

All endpoints return JSON responses.

## Base URL
```
https://merttekfidan.com/job/dashboard-api.php
```

---

## 📋 **Filter Applications**
Filter by status, company, date range, work mode

**Endpoint:** `GET ?action=filter`

**Parameters:**
- `status` (optional) - Filter by status (e.g., "Applied", "Interview", "Rejected")
- `company` (optional) - Filter by company name
- `from` (optional) - Start date (YYYY-MM-DD)
- `to` (optional) - End date (YYYY-MM-DD)
- `work_mode` (optional) - Filter by work mode (e.g., "Remote", "Hybrid", "Onsite")
- `limit` (optional) - Number of results (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Example:**
```
GET /dashboard-api.php?action=filter&status=Applied&work_mode=Remote&limit=20
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "applications": [...]
}
```

---

## 🔍 **Search Applications**
Search by keyword in job title, company, location, responsibilities, skills

**Endpoint:** `GET ?action=search`

**Parameters:**
- `q` (required) - Search query

**Example:**
```
GET /dashboard-api.php?action=search&q=developer
```

**Response:**
```json
{
  "success": true,
  "query": "developer",
  "count": 8,
  "applications": [...]
}
```

---

## ✏️ **Update Application Status**
Update the status of an application

**Endpoint:** `POST ?action=update_status`

**Body:**
```json
{
  "id": 1,
  "status": "Interview Scheduled"
}
```

**Example:**
```javascript
fetch('https://merttekfidan.com/job/dashboard-api.php?action=update_status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 1, status: 'Interview Scheduled' })
})
```

**Response:**
```json
{
  "success": true,
  "message": "Status updated successfully"
}
```

---

## 🗑️ **Delete Application**
Delete an application by ID

**Endpoint:** `DELETE ?action=delete&id=1` or `POST ?action=delete&id=1`

**Example:**
```
DELETE /dashboard-api.php?action=delete&id=1
```

**Response:**
```json
{
  "success": true,
  "message": "Application deleted successfully"
}
```

---

## 📊 **Get Analytics**
Get detailed analytics and statistics

**Endpoint:** `GET ?action=analytics`

**Example:**
```
GET /dashboard-api.php?action=analytics
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "total": 45,
    "byStatus": [
      {"status": "Applied", "count": 20},
      {"status": "Interview", "count": 10},
      {"status": "Rejected", "count": 15}
    ],
    "byWorkMode": [
      {"work_mode": "Remote", "count": 25},
      {"work_mode": "Hybrid", "count": 15},
      {"work_mode": "Onsite", "count": 5}
    ],
    "byMonth": [
      {"month": "2024-12", "count": 15},
      {"month": "2024-11", "count": 12}
    ],
    "topCompanies": [
      {"company": "Google", "count": 5},
      {"company": "Microsoft", "count": 4}
    ],
    "last7Days": 8,
    "avgPerWeek": 3.5
  }
}
```

---

## 🕐 **Get Recent Applications**
Get most recent applications

**Endpoint:** `GET ?action=recent`

**Parameters:**
- `limit` (optional) - Number of results (default: 10)

**Example:**
```
GET /dashboard-api.php?action=recent&limit=5
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "applications": [...]
}
```

---

## 🏢 **Get All Companies**
Get list of all companies with application counts

**Endpoint:** `GET ?action=companies`

**Example:**
```
GET /dashboard-api.php?action=companies
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "companies": [
    {"company": "Google", "count": 5},
    {"company": "Microsoft", "count": 4},
    {"company": "Amazon", "count": 3}
  ]
}
```

---

## 🎨 **Example Dashboard Usage**

### JavaScript Fetch Examples

```javascript
// Get analytics
fetch('https://merttekfidan.com/job/dashboard-api.php?action=analytics')
  .then(r => r.json())
  .then(data => console.log(data.analytics));

// Search for jobs
fetch('https://merttekfidan.com/job/dashboard-api.php?action=search&q=react')
  .then(r => r.json())
  .then(data => console.log(data.applications));

// Filter by status
fetch('https://merttekfidan.com/job/dashboard-api.php?action=filter&status=Interview')
  .then(r => r.json())
  .then(data => console.log(data.applications));

// Update status
fetch('https://merttekfidan.com/job/dashboard-api.php?action=update_status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 1, status: 'Offer Received' })
})
  .then(r => r.json())
  .then(data => console.log(data));
```

---

## 📝 **Status Values**

Common status values you can use:
- `Applied`
- `Interview Scheduled`
- `Interview Completed`
- `Offer Received`
- `Rejected`
- `Withdrawn`
- `Accepted`

---

## 🔒 **Security Note**

All endpoints support CORS for your dashboard. Make sure to:
1. Keep your database credentials secure
2. Consider adding authentication for production use
3. Use HTTPS for all requests
