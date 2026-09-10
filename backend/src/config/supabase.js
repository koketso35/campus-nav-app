
// Using central config

const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

module.exports = { supabase };