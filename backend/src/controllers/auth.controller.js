
const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const isStrongPassword = (pwd) => {
  if (!pwd || pwd.length < 8) return false;
  return /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
};

const register = async (req, res) => { 
  try {
    const {
      studentNumber, fullName, email, phone, password, confirmPassword,
      faculty, yearOfStudy,
    } = req.body;

    if (!studentNumber || !fullName || !email || !password) {
      return errorResponse(res, 'studentNumber, fullName, email and password are required', 400);
    }
    if (!isStrongPassword(password)) {
      return errorResponse(res, 'Password must be 8+ chars with upper, lower, number, and special character', 400);
    }
    if (password !== confirmPassword) {
      return errorResponse(res, 'Passwords do not match', 400);
    }

    const profile = await authService.registerStudent({
      studentNumber, fullName, email, phone, password, faculty, yearOfStudy,
    });

    return successResponse(
      res,
      { profile },
      'Registration successful. Please sign in to continue.',
      201
    );
  } catch (error) {
    logger.error('Register error:', error);

    const msg = (error.message || '').toLowerCase();

    // Email already in Supabase Auth 
    if (
      error.code === 'email_exists' ||
      msg.includes('already been registered') ||
      msg.includes('user already registered') ||
      msg.includes('email address is already')
    ) {
      return errorResponse(
        res,
        'This email is already registered. Please sign in instead.',
        409,
        { field: 'email' }
      );
    }

    // Postgres unique constraint violations (23505)
    if (error.code === '23505') {
      if (error.message?.includes('profiles_email_key')) {
        return errorResponse(
          res,
          'This email is already registered. Please sign in instead.',
          409,
          { field: 'email' }
        );
      }
      if (error.message?.includes('profiles_student_number_key') ||
          error.message?.includes('student_number')) {
        return errorResponse(
          res,
          'This student number is already registered. Please sign in.',
          409,
          { field: 'studentNumber' }
        );
      }
      // Fallback for any other unique constraint
      return errorResponse(
        res,
        'A record with this information already exists.',
        409
      );
    }
    return errorResponse(res, error.message || 'Registration failed', 500);
  }
};

const guest = async (req, res) => {
  try {
    const { fullName, phone, email } = req.body;

    if (!fullName || (!phone && !email)) {
      return errorResponse(res, 'Full name and phone or email are required', 400);
    }

    const session = await authService.registerGuest({ fullName, phone, email });
    return successResponse(res, session, 'Guest session started', 201);
  } catch (error) {
    logger.error('Guest registration error:', error);

    // Duplicate email or phone check
    if (error.code === '23505') {
      if (error.message?.includes('profiles_email_key')) {
        return errorResponse(
          res,
          'This email is already registered. Use a different email or continue with just your phone number.',
          409
        );
      }
      if (error.message?.includes('student_number')) {
        return errorResponse(res, 'This guest ID already exists. Please try again.', 409);
      }
      return errorResponse(res, 'A record with this information already exists.', 409);
    }

    return errorResponse(res, error.message || 'Guest registration failed', error.status || 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, studentNumber, password } = req.body;
    if (!password) {
      return errorResponse(res, 'Password is required', 400);
    }

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    let session;
    if (studentNumber) {
      session = await authService.loginByStudentNumber({ studentNumber, password, ip });
    } else if (email) {
      session = await authService.login({ email, password, ip });
    } else {
      return errorResponse(res, 'Provide student number or email', 400);
    }

    return successResponse(res, session, 'Login successful');
  } catch (error) {
    logger.warn('Login failed:', error.message);
    const status = error.status || 401;
    return errorResponse(res, error.message || 'Login failed', status);
  }
};

const me = async (req, res) => {
  // authenticateUser middleware already attached req.profile
  return successResponse(res, req.profile, 'Current user');
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    await authService.logout(token, req.profile?.id);
    return successResponse(res, null, 'Logged out');
  } catch (error) {
    return successResponse(res, null, 'Logged out');
  }
};

module.exports = { register, guest, login, me, logout };