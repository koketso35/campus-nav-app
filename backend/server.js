// Entry point for the application

const app = require('./src/app');
const { environment, validateEnvironment } = require('./src/config/environment');
const logger = require('./src/utils/logger');
const { cleanupStaleGuests } = require('./src/services/cleanup.service');

// Validate environment variables
validateEnvironment();

// Start server
const server = app.listen(environment.port, () => {
  logger.info(`Server running on port ${environment.port}`);
  logger.info(`Environment: ${environment.nodeEnv}`);
  logger.info(`API URL: http://localhost:${environment.port}/api/v1`);

  // Startup cleanup (fire-and-forget)
  cleanupStaleGuests({ olderThanDays: 30 }).catch((err) => {
    logger.warn('Startup guest cleanup failed:', err.message);
  });
});

// Schedule daily cleanup
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const cleanupTimer = setInterval(() => {
  cleanupStaleGuests({ olderThanDays: 1 }).catch((err) => {
    logger.warn('Scheduled guest cleanup failed:', err.message);
  });
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();


// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled promise rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  clearInterval(cleanupTimer);
  server.close(() => {
    logger.info('Process terminated.');
    process.exit(0);
  });
});