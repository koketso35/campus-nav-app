// src/controllers/auth.controller.js
const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const isStrongPassword = (pwd) => {
  if (!pwd || pwd.length < 8) return false;
  return /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
};

const register = async (req, res) => {
  try {
    const { studentNumber, fullName, email, phone, password, confirmPassword, faculty, yearOfStudy } = req.body;

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

    // Immediately log them in
    const session = await authService.login({ email, password });
    return successResponse(res, session, 'Registration successful', 201);
  } catch (error) {
    logger.error('Register error:', error);
    if (error.message?.includes('already')) {
      return errorResponse(res, 'Account already exists', 409);
    }
    return errorResponse(res, error.message || 'Registration failed', 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }
    const session = await authService.login({ email, password });
    return successResponse(res, session, 'Login successful');
  } catch (error) {
    logger.warn('Login failed:', error.message);
    return errorResponse(res, 'Invalid credentials', 401);
  }
};

const me = async (req, res) => {
  // authenticateUser middleware already attached req.profile
  return successResponse(res, req.profile, 'Current user');
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    await authService.logout(token);
    return successResponse(res, null, 'Logged out');
  } catch (error) {
    // Even if Supabase fails, client should just drop the token
    return successResponse(res, null, 'Logged out');
  }
};

module.exports = { register, login, me, logout };