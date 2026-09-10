// Business logic for places

const { supabase, supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Get all places with optional filters
 */
const getAllPlaces = async (filters = {}) => {
  try {
    let query = supabase
      .from('places')
      .select('*');

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    // Apply search filter
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error, count } = await query
      .order('name')
      .range(start, end);

    if (error) throw error;

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching places:', error);
    throw error;
  }
};

/**
 * Get a single place by ID
 */
const getPlaceById = async (placeId) => {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching place:', error);
    throw error;
  }
};

/**
 * Get nearby places
 */
const getNearbyPlaces = async (latitude, longitude, radiusMeters = 500, limit = 20) => {
  try {
    const { data, error } = await supabase
      .rpc('get_nearby_places', {
        lat: latitude,
        lng: longitude,
        radius: radiusMeters,
        limit_count: limit,
      });

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching nearby places:', error);
    throw error;
  }
};

/**
 * Create a new place (admin only)
 */
const createPlace = async (placeData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('places')
      .insert(placeData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error creating place:', error);
    throw error;
  }
};

/**
 * Update a place (admin only)
 */
const updatePlace = async (placeId, updates) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('places')
      .update(updates)
      .eq('id', placeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error updating place:', error);
    throw error;
  }
};

/**
 * Delete a place (admin only)
 */
const deletePlace = async (placeId) => {
  try {
    const { error } = await supabaseAdmin
      .from('places')
      .delete()
      .eq('id', placeId);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Error deleting place:', error);
    throw error;
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