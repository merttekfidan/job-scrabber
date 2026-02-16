# Job Application Tracker (Next.js Edition)

A comprehensive job application tracking dashboard, now built with **Next.js 14+ (App Router)** and **PostgreSQL**.

## Features

- **Responsive Dashboard**: Track applications, interviews, and offers in a clean, dark-mode UI.
- **Analytics**: Visual charts for application trends, status distribution, and top companies.
- **Filtering & Search**: Advanced filtering by status, company, work mode, and full-text search.
- **Chrome Extension Support**: API ready to accept data from the Job Scrabber extension.
- **Export Data**: Export your applications to CSV.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL (via `pg`)
- **Styling**: Tailwind CSS + Custom CSS (for legacy design fidelity)
- **Icons**: Lucide React
- **Charts**: Chart.js / React-Chartjs-2

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file in the root:
   ```bash
   DATABASE_URL=postgresql://user:password@host:port/dbname
   ```

3. **Run Migrations**
   Initialize the database schema:
   ```bash
   npm run migrate
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Deployment (Railway)

The project is configured for Railway deployment.

1. **Connect Repository**: Connect your GitHub repo to Railway.
2. **Environment Variables**: Add `DATABASE_URL` in Railway variables.
3. **Build Command**: Railway automatically detects Next.js (`npm run build`).
4. **Start Command**: Railway automatically runs `npm start`.

### Migrations in Production

You can run migrations manually via the Railway CLI or add it to the start command if desired (though manual is safer for production).

## API Documentation

The API is available at `/api/...`.
- `GET /api/list`: List all applications.
- `POST /api/save`: Save a new application (used by extension).
- `GET /api/stats`: Get dashboard statistics.
- `GET /api/analytics`: Get detailed chart data.

## Legacy Code

The old Express.js/PHP codebase is archived in `_legacy/` for reference.
