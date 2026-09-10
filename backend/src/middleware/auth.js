// Authentication middleware

const { supabase } = require('../config/supabase');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate users using Supabase JWT
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Authentication failed:', error?.message || 'No user found');
      return errorResponse(res, 'Invalid or expired token', 401);
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.error('Error fetching user profile:', profileError.message);
      return errorResponse(res, 'Error fetching user profile', 500);
    }

    // Attach user and profile to request
    req.user = user;
    req.profile = profile;
    req.userId = user.id;
    req.userRole = profile?.role || 'guest';

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return errorResponse(res, 'Authentication failed', 500);
  }
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return errorResponse(res, 'Admin access required', 403);
  }
  next();
};

/**
 * Optional authentication (doesn't require token but extracts if present)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = user;
        req.userId = user.id;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        req.profile = profile;
        req.userRole = profile?.role || 'guest';
      }
    }
    next();
  } catch (error) {
    // Just continue without user info
    next();
  }
};

module.exports = {
  authenticateUser,
  requireAdmin,
  optionalAuth,
};