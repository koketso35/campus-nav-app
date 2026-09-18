const navigationService = require('../services/navigation.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * POST /api/v1/routes
 */
const saveRoute = async (req, res) => {
  try {
    const route = await navigationService.saveRoute(req.userId, req.body || {});
    return successResponse(res, route, 'Route saved', 201);
  } catch (error) {
    logger.error('Error in saveRoute:', error.message);
    return errorResponse(res, error.message || 'Could not save route', error.status || 500);
  }
};

/**
 * GET /api/v1/routes
 */
const getMyRoutes = async (req, res) => {
  try {
    const result = await navigationService.getMyRoutes(req.userId, {
      page: req.query.page,
      limit: req.query.limit,
    });
    return paginatedResponse(res, result.data, result.pagination, 'Routes retrieved');
  } catch (error) {
    logger.error('Error in getMyRoutes:', error.message);
    return errorResponse(res, error.message || 'Could not fetch routes', error.status || 500);
  }
};

/**
 * POST /api/v1/routes/:id/complete
 */
const completeRoute = async (req, res) => {
  try {
    const route = await navigationService.completeRoute(req.userId, req.params.id);
    return successResponse(res, route, 'Route marked as completed');
  } catch (error) {
    logger.error('Error in completeRoute:', error.message);
    return errorResponse(res, error.message || 'Could not complete route', error.status || 500);
  }
};

/**
 * GET /api/v1/routes/popular
 * Public — no auth needed. Handy for admin analytics + landing pages.
 */
const getPopularRoutes = async (req, res) => {
  try {
    const routes = await navigationService.getPopularRoutes({
      limit: req.query.limit,
    });
    return successResponse(res, routes, 'Popular routes retrieved');
  } catch (error) {
    logger.error('Error in getPopularRoutes:', error.message);
    return errorResponse(res, error.message || 'Could not fetch popular routes', error.status || 500);
  }
};

module.exports = {
  saveRoute,
  getMyRoutes,
  completeRoute,
  getPopularRoutes,
};