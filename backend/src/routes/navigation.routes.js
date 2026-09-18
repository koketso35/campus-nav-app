const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const navigationController = require('../controllers/navigation.controller');

// Public — popular routes are safe to expose
router.get('/popular', navigationController.getPopularRoutes);

// Everything below requires a valid JWT
router.use(authenticateUser);

router.post('/', navigationController.saveRoute);
router.get('/', navigationController.getMyRoutes);
router.post('/:id/complete', navigationController.completeRoute);

module.exports = router;