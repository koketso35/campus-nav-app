// This file loads and validates environment variables

const dotenv = require('dotenv');
const path = require('path');

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Environment configuration object
const environment = {
  // Server settings
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Supabase settings
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY
  },

  // JWT settings
  //jwtSecret: process.env.JWT_SECRET,

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

// Validate required environment variables
const validateEnvironment = () => {
  const requiredVars = [
    'supabase.url',
    'supabase.anonKey'
  ];

  const missingVars = requiredVars.filter((varPath) => {
    const value = varPath.split('.').reduce((obj, key) => obj?.[key], environment);
    return !value;
  });

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach((varName) => {
      console.error(`  - ${varName}`);
    });
    console.error('\nPlease check your .env file and add the missing variables.');
    process.exit(1);
  }

  return environment;
};

module.exports = { environment, validateEnvironment };