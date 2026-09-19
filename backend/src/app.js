// Express app configuration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
//const rateLimit = require('express-rate-limit');
//const { ipKeyGenerator } = require('express-rate-limit');

const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { environment } = require('./config/environment');
const logger = require('./utils/logger');

const app = express();

// IMPORTANT: must be set before any middleware that reads req.ip
app.set('trust proxy', 1);

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://campus-nav-app-henna.vercel.app',
    'https://nav-wheat-xi.vercel.app',
  ],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Compression
app.use(compression());

// Logging
if (environment.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Routes
app.use('/', routes);

// 404 & error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;