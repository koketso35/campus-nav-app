// Business logic for feedback / ratings

const { supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Create a new feedback entry for the current user.
 * Body: { rating, complaint?, category?, routeId?, fromPlaceId?, toPlaceId? }
 */
const createFeedback = async (userId, data) => {
  const { rating, complaint, category, routeId, fromPlaceId, toPlaceId } = data;

  const numericRating = parseInt(rating, 10);
  if (!numericRating || numericRating < 1 || numericRating > 5) {
    const e = new Error('Rating must be between 1 and 5');
    e.status = 400;
    throw e;
  }

  const cleanComplaint = (complaint || '').trim();
  if (numericRating < 2 && cleanComplaint.length < 5) {
    const e = new Error('A short complaint is required for ratings under 2 stars');
    e.status = 400;
    throw e;
  }

  const { data: feedback, error } = await supabaseAdmin
    .from('feedback')
    .insert({
      profile_id: userId,
      rating: numericRating,
      complaint: cleanComplaint || null,
      category: category || 'routing',
      route_id: routeId || null,
      from_place_id: fromPlaceId || null,
      to_place_id: toPlaceId || null,
      status: 'open',
    })
    .select()
    .single();

  if (error) throw error;
  return feedback;
};

/**
 * Get all feedback submitted by the current user (paginated).
 */
const getMyFeedback = async (userId, { page = 1, limit = 50 } = {}) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 100);
  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit - 1;

  const { data, error, count } = await supabaseAdmin
    .from('feedback')
    .select('*', { count: 'exact' })
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .range(start, end);

  if (error) throw error;

  return {
    data,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / safeLimit),
    },
  };
};

/**
 * Get a single feedback entry (must belong to the current user).
 */
const getFeedbackById = async (userId, feedbackId) => {
  const { data, error } = await supabaseAdmin
    .from('feedback')
    .select('*')
    .eq('id', feedbackId)
    .eq('profile_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const e = new Error('Feedback not found');
    e.status = 404;
    throw e;
  }
  return data;
};

/**
 * Delete own feedback.
 */
const deleteFeedback = async (userId, feedbackId) => {
  const { error } = await supabaseAdmin
    .from('feedback')
    .delete()
    .eq('id', feedbackId)
    .eq('profile_id', userId);

  if (error) throw error;
  return true;
};

module.exports = {
  createFeedback,
  getMyFeedback,
  getFeedbackById,
  deleteFeedback,
};