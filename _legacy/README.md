# Job Application Tracker

A comprehensive job application tracking system with a Chrome Extension for data capture, a Node.js API for backend processing, and a web Dashboard for visualization.

## 🚀 Deployment (Railway)

This project is configured for seamless deployment on [Railway](https://railway.app/).

1.  **Push to GitHub**: Ensure this repository is pushed to your GitHub account.
2.  **New Project on Railway**:
    *   Click "New Project" > "Deploy from GitHub repo".
    *   Select this repository.
3.  **Add Database**:
    *   Right-click the empty canvas or click "New".
    *   Select **PostgreSQL**.
4.  **Connect Application**:
    *   Railway should automatically inject `DATABASE_URL` into your application variables.
5.  **Environment Variables**:
    *   `PORT`: (Automatically set by Railway)
    *   `NODE_ENV`: `production`
    *   `CORS_ORIGIN`: `*` (or your specific extension ID)

## 📂 Project Structure

This repository is a **Server-Only** structure containing the API and the Dashboard (served as static files).

```text
/
├── index.js            # Main Express server entry point
├── db.js               # Database connection pool
├── migrate.js          # Database migration script
├── routes/             # API route definitions
├── public/             # Dashboard frontend (HTML/CSS/JS)
├── extension/          # Chrome Extension source (Locally only, gitignored)
└── schema.sql          # Database schema definition
```

## 🛠️ Local Development

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### Setup
1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Database Setup**:
    - Create a local PostgreSQL database (e.g., `job_tracker`).
    - Create a `.env` file based on your local config:
      ```env
      DATABASE_URL=postgresql://user:password@localhost:5432/job_tracker
      PORT=3000
      ```
    - Run migrations:
      ```bash
      npm run migrate
      ```
3.  **Start Server**:
    ```bash
    npm start
    ```
    - The server will start on `http://localhost:3000`.
    - The Dashboard is available at `http://localhost:3000/`.

## 🔌 API Endpoints

All API endpoints are prefixed with `/api`.

-   `GET /api/list`: List applications (supports filtering).
-   `POST /api/save`: Save a new application (used by Extension).
-   `GET /api/stats`: Get application statistics.
-   `GET /api/search?q=...`: Search applications.
-   `POST /api/update-status`: Update application status.
-   `DELETE /api/delete/:id`: Delete an application.

See [public/API_DOCS.md](public/API_DOCS.md) for full documentation.
