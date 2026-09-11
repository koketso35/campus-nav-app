// Main router

const express = require('express');
const router = express.Router();
const placesRoutes = require('./places.routes');
const authRoutes = require('./auth.routes');
//const eventsRoutes = require('./events.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Campus Navigation API is running',
    timestamp: new Date().toISOString(),
  });
});

// API version prefix
const API_VERSION = '/api/v1';

// Mount routes
router.use(`${API_VERSION}/places`, placesRoutes);
router.use(`${API_VERSION}/auth`, authRoutes);
//router.use(`${API_VERSION}/events`, eventsRoutes);
// Add more routes here...

module.exports = router;