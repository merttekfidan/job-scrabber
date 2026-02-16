# Dashboard API Endpoints

All endpoints are relative to the server root (e.g., `/api/filter`). The dashboard automatically uses `/api` as the base URL.

## Base URL
```
/api
```

---

## 📋 **Filter Applications**
Filter by status, company, date range, work mode.

**Endpoint:** `GET /filter`

**Parameters:**
- `status` (optional) - Filter by status (e.g., "Applied", "Interview Scheduled")
- `company` (optional) - Filter by company name
- `from` (optional) - Start date (YYYY-MM-DD)
- `to` (optional) - End date (YYYY-MM-DD)
- `work_mode` (optional) - Filter by work mode (e.g., "Remote", "Hybrid", "Onsite")
- `limit` (optional) - Number of results (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Example:**
```
GET /api/filter?status=Applied&work_mode=Remote&limit=20
```

---

## 🔍 **Search Applications**
Search by keyword in job title, company, location, responsibilities, skills.

**Endpoint:** `GET /search`

**Parameters:**
- `q` (required) - Search query

**Example:**
```
GET /api/search?q=developer
```

---

## ✏️ **Update Application Status**
Update the status of an application.

**Endpoint:** `POST /update-status`

**Body:**
```json
{
  "id": 1,
  "status": "Interview Scheduled"
}
```

---

## 🗑️ **Delete Application**
Delete an application by ID.

**Endpoint:** `DELETE /delete/:id`

**Example:**
```
DELETE /api/delete/1
```

---

## 📊 **Get Analytics**
Get detailed analytics and statistics.

**Endpoint:** `GET /analytics`

**Response:**
```json
{
  "analytics": {
    "total": 45,
    "byStatus": [...],
    "byWorkMode": [...],
    "byMonth": [...],
    "topCompanies": [...],
    "last7Days": 8
  }
}
```

---

## 🏢 **Get All Companies**
Get list of all companies with application counts.

**Endpoint:** `GET /companies`

---

## 📝 **Status Values**
- `Applied`
- `Interview Scheduled`
- `Interview Completed`
- `Offer Received`
- `Rejected`
- `Withdrawn`
- `Accepted`
