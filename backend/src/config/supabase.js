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

// Admin client (uses service role key, bypasses RLS) — for admin operations
// like createUser, deleteUser, etc. NEVER expose this to the frontend.
const supabaseAdmin = config.supabaseServiceRoleKey
  ? createClient(
      config.supabaseUrl,
      config.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null;

// Warn if admin key is missing
if (!supabaseAdmin) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY missing — admin operations (createUser) will fail.');
  //console.warn('Add it to .env. Get it from: Supabase → Settings → API → service_role key');
} else {
  console.log('Supabase clients initialized (anon + admin)');
}

module.exports = { supabase, supabaseAdmin };
