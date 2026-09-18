// Business logic for route history + popular routes

const { supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Save a completed/started route for the current user.
 * Body: {
 *   fromPlaceId?, toPlaceId,
 *   fromLatitude, fromLongitude, toLatitude, toLongitude,
 *   routeMode: 'campus' | 'outside' | 'direct',
 *   totalDistanceMeters, totalTimeMinutes,
 *   routeCoords: [[lat,lng], ...],
 *   routeSteps: [{ instruction, distance, type }],
 *   isAccessible?: boolean
 * }
 */
const saveRoute = async (userId, data) => {
  const {
    fromPlaceId,
    toPlaceId,
    fromLatitude,
    fromLongitude,
    toLatitude,
    toLongitude,
    routeMode = 'campus',
    totalDistanceMeters,
    totalTimeMinutes,
    routeCoords,
    routeSteps,
    isAccessible = false,
  } = data || {};

  // Minimal validation
  if (toLatitude == null || toLongitude == null) {
    const e = new Error('Destination coordinates are required');
    e.status = 400;
    throw e;
  }
  if (!Array.isArray(routeCoords) || routeCoords.length < 2) {
    const e = new Error('routeCoords must be an array of at least 2 [lat, lng] points');
    e.status = 400;
    throw e;
  }
  const validModes = ['campus', 'outside', 'direct'];
  if (!validModes.includes(routeMode)) {
    const e = new Error(`routeMode must be one of: ${validModes.join(', ')}`);
    e.status = 400;
    throw e;
  }

  const { data: row, error } = await supabaseAdmin
    .from('route_history')
    .insert({
      profile_id: userId,
      from_place_id: fromPlaceId || null,
      to_place_id: toPlaceId || null,
      from_latitude: fromLatitude ?? 0,
      from_longitude: fromLongitude ?? 0,
      to_latitude: toLatitude,
      to_longitude: toLongitude,
      route_mode: routeMode,
      total_distance_meters: Math.round(totalDistanceMeters || 0),
      total_time_minutes: Math.round(totalTimeMinutes || 0),
      route_coords: routeCoords,
      route_steps: routeSteps || null,
      is_accessible: isAccessible,
      is_completed: false,
      started_at: new Date().toISOString(),
    })
    .select('id, created_at')
    .single();

  if (error) throw error;
  return row;
};

/**
 * Mark a route as completed.
 */
const completeRoute = async (userId, routeId) => {
  const { data, error } = await supabaseAdmin
    .from('route_history')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', routeId)
    .eq('profile_id', userId)
    .select('id, is_completed, completed_at')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const e = new Error('Route not found');
    e.status = 404;
    throw e;
  }
  return data;
};

/**
 * Get route history for the current user (paginated).
 */
const getMyRoutes = async (userId, { page = 1, limit = 20 } = {}) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit - 1;

  const { data, error, count } = await supabaseAdmin
    .from('route_history')
    .select(`
      id,
      from_place_id,
      to_place_id,
      from_latitude,
      from_longitude,
      to_latitude,
      to_longitude,
      route_mode,
      total_distance_meters,
      total_time_minutes,
      is_accessible,
      is_completed,
      started_at,
      completed_at,
      created_at,
      from_place:from_place_id (id, slug, name),
      to_place:to_place_id (id, slug, name)
    `, { count: 'exact' })
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .range(start, end);

  if (error) throw error;

  // Flatten so the frontend gets a clean shape
  const shaped = (data || []).map((r) => ({
    id: r.id,
    routeMode: r.route_mode,
    distanceMeters: r.total_distance_meters,
    timeMinutes: r.total_time_minutes,
    isAccessible: r.is_accessible,
    isCompleted: r.is_completed,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    createdAt: r.created_at,
    from: r.from_place
      ? { id: r.from_place.id, slug: r.from_place.slug, name: r.from_place.name }
      : { lat: r.from_latitude, lng: r.from_longitude, name: 'Start' },
    to: r.to_place
      ? { id: r.to_place.id, slug: r.to_place.slug, name: r.to_place.name }
      : { lat: r.to_latitude, lng: r.to_longitude, name: 'Destination' },
  }));

  return {
    data: shaped,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / safeLimit),
    },
  };
};

/**
 * Get most-used routes across the campus (public — no auth required).
 * Requires the `popular_routes` table to be populated by the trigger
 * you already have (or run the manual upsert below).
 */
const getPopularRoutes = async ({ limit = 10 } = {}) => {
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 10), 50);

  const { data, error } = await supabaseAdmin
    .from('popular_routes')
    .select(`
      usage_count,
      last_used_at,
      from_place:from_place_id (id, slug, name, category),
      to_place:to_place_id (id, slug, name, category)
    `)
    .order('usage_count', { ascending: false })
    .limit(safeLimit);

  if (error) throw error;

  return (data || [])
    .filter((r) => r.from_place && r.to_place)
    .map((r) => ({
      usageCount: r.usage_count,
      lastUsedAt: r.last_used_at,
      from: r.from_place,
      to: r.to_place,
    }));
};

module.exports = {
  saveRoute,
  completeRoute,
  getMyRoutes,
  getPopularRoutes,
};