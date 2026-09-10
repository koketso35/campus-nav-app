// Handle HTTP requests for places

const placesService = require('../services/places.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get all places
 */
const getAllPlaces = async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    };

    const result = await placesService.getAllPlaces(filters);
    
    return paginatedResponse(res, result.data, result.pagination, 'Places retrieved successfully');
  } catch (error) {
    logger.error('Error in getAllPlaces controller:', error);
    return errorResponse(res, 'Error fetching places', 500);
  }
};

/**
 * Get a single place
 */
const getPlaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const place = await placesService.getPlaceById(id);
    
    if (!place) {
      return errorResponse(res, 'Place not found', 404);
    }

    return successResponse(res, place, 'Place retrieved successfully');
  } catch (error) {
    logger.error('Error in getPlaceById controller:', error);
    return errorResponse(res, 'Error fetching place', 500);
  }
};

/**
 * Get nearby places
 */
const getNearbyPlaces = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return errorResponse(res, 'Latitude and longitude are required', 400);
    }

    const places = await placesService.getNearbyPlaces(
      parseFloat(lat),
      parseFloat(lng),
      parseInt(radius) || 500
    );

    return successResponse(res, places, 'Nearby places retrieved successfully');
  } catch (error) {
    logger.error('Error in getNearbyPlaces controller:', error);
    return errorResponse(res, 'Error fetching nearby places', 500);
  }
};

/**
 * Create a new place (admin only)
 */
const createPlace = async (req, res) => {
  try {
    const place = await placesService.createPlace(req.body);
    return successResponse(res, place, 'Place created successfully', 201);
  } catch (error) {
    logger.error('Error in createPlace controller:', error);
    return errorResponse(res, 'Error creating place', 500);
  }
};

/**
 * Update a place (admin only)
 */
const updatePlace = async (req, res) => {
  try {
    const { id } = req.params;
    const place = await placesService.updatePlace(id, req.body);
    return successResponse(res, place, 'Place updated successfully');
  } catch (error) {
    logger.error('Error in updatePlace controller:', error);
    return errorResponse(res, 'Error updating place', 500);
  }
};

/**
 * Delete a place (admin only)
 */
const deletePlace = async (req, res) => {
  try {
    const { id } = req.params;
    await placesService.deletePlace(id);
    return successResponse(res, null, 'Place deleted successfully');
  } catch (error) {
    logger.error('Error in deletePlace controller:', error);
    return errorResponse(res, 'Error deleting place', 500);
  }
};

module.exports = {
  getAllPlaces,
  getPlaceById,
  getNearbyPlaces,
  createPlace,
  updatePlace,
  deletePlace,
};