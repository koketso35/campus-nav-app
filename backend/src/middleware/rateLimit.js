
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const clientIp = (req) =>
  ipKeyGenerator(req.ip || req.socket?.remoteAddress || 'unknown');

// ---------- LOGIN ----------
// Keyed by student number (or email). NEVER by IP.
// A shared campus IP can no longer lock out other students.
const loginLimiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const sn = (req.body?.studentNumber || '').toString().trim().toUpperCase();
    const email = (req.body?.email || '').toString().trim().toLowerCase();
    return `login:${sn || email || clientIp(req)}`;
  },
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: 'Too many login attempts for this account. Please wait 3 minutes.',
      timestamp: new Date().toISOString(),
    }),
});

// ---------- REGISTER ----------
// Identity limiter: per email
const registerIdentityLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `register:email:${(req.body?.email || '').toString().trim().toLowerCase() || clientIp(req)}`,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: 'Too many registration attempts for this email.',
      timestamp: new Date().toISOString(),
    }),
});

// Network backstop: per IP, but HIGH ceiling so a campus NAT never trips it
const registerNetworkLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,                   
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `register:net:${clientIp(req)}`,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: 'This network has made too many registration requests. Please contact support.',
      timestamp: new Date().toISOString(),
    }),
});

// ---------- GUEST ----------
const guestIdentityLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toString().trim().toLowerCase();
    const phone = (req.body?.phone || '').toString().replace(/\D/g, '');
    return `guest:id:${email || phone || clientIp(req)}`;
  },
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: 'Too many guest sessions for this contact.',
      timestamp: new Date().toISOString(),
    }),
});

const guestNetworkLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `guest:net:${clientIp(req)}`,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: 'This network has made too many guest requests. Please contact support.',
      timestamp: new Date().toISOString(),
    }),
});

/**
 * Forgot password: limit repeated reset requests.
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip || req.connection?.remoteAddress || 'unknown');
    const email = (req.body?.email || '').toString().trim().toLowerCase();
    const sn = (req.body?.studentNumber || '').toString().trim().toUpperCase();
    return `${ip}:${email || sn || 'unknown'}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset requests. Please wait and try again.',
      timestamp: new Date().toISOString(),
    });
  },
});

module.exports = {
  loginLimiter,
  registerLimiters: [registerIdentityLimiter, registerNetworkLimiter],
  guestLimiters:    [guestIdentityLimiter, guestNetworkLimiter],
  forgotPasswordLimiter
};