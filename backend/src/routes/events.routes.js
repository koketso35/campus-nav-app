// Routes for events endpoints

const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.controller');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { validateEvent } = require('../middleware/validation');

// Public routes

// Admin routes

module.exports = router;