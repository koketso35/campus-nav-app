const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const feedbackController = require('../controllers/feedback.controller');

// All feedback routes require an authenticated user (student, guest, or admin)
router.use(authenticateUser);

router.post('/', feedbackController.createFeedback);
router.get('/', feedbackController.getMyFeedback);
router.get('/:id', feedbackController.getFeedbackById);
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;