// Central configuration file - loads .env once

const path = require('path');

// Load .env from backend root
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
};