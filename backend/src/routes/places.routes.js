// Routes for places endpoints

const express = require('express');
const router = express.Router();
const placesController = require('../controllers/places.controller');
const { authenticateUser, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validatePlace } = require('../middleware/validation');

// Public routes (no authentication required)
router.get('/', placesController.getAllPlaces);
router.get('/nearby', placesController.getNearbyPlaces);
router.get('/:id', placesController.getPlaceById);

// Admin routes (require authentication and admin role)
router.post('/', authenticateUser, requireAdmin, validatePlace, placesController.createPlace);
router.put('/:id', authenticateUser, requireAdmin, validatePlace, placesController.updatePlace);
router.delete('/:id', authenticateUser, requireAdmin, placesController.deletePlace);

module.exports = router;