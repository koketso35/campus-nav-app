const feedbackService = require('../services/feedback.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * POST /api/v1/feedback
 */
const createFeedback = async (req, res) => {
  try {
    const feedback = await feedbackService.createFeedback(req.userId, req.body || {});
    return successResponse(res, feedback, 'Feedback submitted', 201);
  } catch (error) {
    logger.error('Error in createFeedback:', error.message);
    return errorResponse(res, error.message || 'Could not submit feedback', error.status || 500);
  }
};

/**
 * GET /api/v1/feedback
 */
const getMyFeedback = async (req, res) => {
  try {
    const result = await feedbackService.getMyFeedback(req.userId, {
      page: req.query.page,
      limit: req.query.limit,
    });
    return paginatedResponse(res, result.data, result.pagination, 'Feedback retrieved');
  } catch (error) {
    logger.error('Error in getMyFeedback:', error.message);
    return errorResponse(res, error.message || 'Could not fetch feedback', error.status || 500);
  }
};

/**
 * GET /api/v1/feedback/:id
 */
const getFeedbackById = async (req, res) => {
  try {
    const feedback = await feedbackService.getFeedbackById(req.userId, req.params.id);
    return successResponse(res, feedback, 'Feedback retrieved');
  } catch (error) {
    logger.error('Error in getFeedbackById:', error.message);
    return errorResponse(res, error.message || 'Could not fetch feedback', error.status || 500);
  }
};

/**
 * DELETE /api/v1/feedback/:id
 */
const deleteFeedback = async (req, res) => {
  try {
    await feedbackService.deleteFeedback(req.userId, req.params.id);
    return successResponse(res, null, 'Feedback deleted');
  } catch (error) {
    logger.error('Error in deleteFeedback:', error.message);
    return errorResponse(res, error.message || 'Could not delete feedback', error.status || 500);
  }
};

module.exports = {
  createFeedback,
  getMyFeedback,
  getFeedbackById,
  deleteFeedback,
};