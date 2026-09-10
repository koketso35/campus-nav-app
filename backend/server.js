// Entry point for the application

const app = require('./src/app');
const { environment, validateEnvironment } = require('./src/config/environment');
const logger = require('./src/utils/logger');

// Validate environment variables
validateEnvironment();

// Start server
const server = app.listen(environment.port, () => {
  logger.info(`Server running on port ${environment.port}`);
  logger.info(`Environment: ${environment.nodeEnv}`);
  logger.info(`API URL: http://localhost:${environment.port}/api/v1`);
});

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
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
    process.exit(0);
  });
});