// Global error handling middleware

const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');

/**
 * Not found handler
 */
const notFoundHandler = (req, res, next) => {
  errorResponse(res, `Route not found: ${req.originalUrl}`, 404);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return errorResponse(res, 'Validation failed', 400, err.errors);
  }

  if (err.name === 'UnauthorizedError') {
    return errorResponse(res, 'Unauthorized', 401);
  }

  // Default error
  errorResponse(res, err.message || 'Internal server error', err.status || 500);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};