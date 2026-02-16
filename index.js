const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.use('/api', apiRoutes);
app.use('/api', dashboardRoutes);

const path = require('path');

// Serve static files from dashboard
app.use(express.static(path.join(__dirname, 'public')));

// Root endpoint - Serve Dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// API Documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'Job Tracker API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            api: {
                save: 'POST /api/save',
                list: 'GET /api/list',
                stats: 'GET /api/stats',
                filter: 'GET /api/filter',
                search: 'GET /api/search',
                updateStatus: 'POST /api/update-status',
                delete: 'DELETE /api/delete/:id',
                analytics: 'GET /api/analytics',
                recent: 'GET /api/recent',
                companies: 'GET /api/companies'
            }
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════╗
║   Job Tracker API Server Running      ║
║   Port: ${PORT.toString().padEnd(31)}║
║   Address: 0.0.0.0                    ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(23)}║
╚════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

