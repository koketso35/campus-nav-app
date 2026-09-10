// Request validation middleware

const { errorResponse } = require('../utils/response');
const { PLACE_CATEGORIES, EVENT_CATEGORIES, ROUTE_MODES } = require('../utils/constants');

/**
 * Validate place creation/update
 */
const validatePlace = (req, res, next) => {
  const { name, latitude, longitude, category } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!latitude || typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    errors.push('Valid latitude required (-90 to 90)');
  }

  if (!longitude || typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    errors.push('Valid longitude required (-180 to 180)');
  }

  if (category && !PLACE_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${PLACE_CATEGORIES.join(', ')}`);
  }

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 400, errors);
  }

  next();
};

/**
 * Validate event creation/update
 */
const validateEvent = (req, res, next) => {
  const { title, event_date, start_time, category } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }

  if (!event_date) {
    errors.push('Event date is required');
  } else {
    const date = new Date(event_date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid event date');
    }
  }

  if (!start_time) {
    errors.push('Start time is required');
  }

  if (category && !EVENT_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${EVENT_CATEGORIES.join(', ')}`);
  }

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 400, errors);
  }

  next();
};

/**
 * Validate route calculation request
 */
const validateRouteRequest = (req, res, next) => {
  const { fromLat, fromLng, toLat, toLng } = req.body;
  const errors = [];

  if (!fromLat || !fromLng || !toLat || !toLng) {
    errors.push('All coordinates are required (fromLat, fromLng, toLat, toLng)');
  }

  if (fromLat && (fromLat < -90 || fromLat > 90)) {
    errors.push('Invalid fromLat');
  }

  if (fromLng && (fromLng < -180 || fromLng > 180)) {
    errors.push('Invalid fromLng');
  }

  if (toLat && (toLat < -90 || toLat > 90)) {
    errors.push('Invalid toLat');
  }

  if (toLng && (toLng < -180 || toLng > 180)) {
    errors.push('Invalid toLng');
  }

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 400, errors);
  }

  next();
};

module.exports = {
  validatePlace,
  validateEvent,
  validateRouteRequest,
};