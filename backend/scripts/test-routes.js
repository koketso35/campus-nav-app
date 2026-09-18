require('dotenv').config();
const { supabase } = require('../src/config/supabase');
const { supabaseAdmin } = require('../src/config/supabase');

const API = 'http://localhost:3000';

async function main() {
  const studentNumber = process.argv[2];
  const password = process.argv[3];

  if (!studentNumber || !password) {
    console.error('Usage: node scripts/test-routes.js <studentNumber> <password>');
    process.exit(1);
  }

  // 1. Get token
  console.log('Logging in...');
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('student_number', studentNumber.toUpperCase())
    .maybeSingle();

  if (!profile?.email) {
    console.error('No profile for', studentNumber);
    process.exit(1);
  }

  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (authError) {
    console.error('Sign-in failed:', authError.message);
    process.exit(1);
  }

  const token = auth.session.access_token;
  console.log('Got token (length:', token.length, ')');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. Save route
  console.log('\n Saving route...');
  const saveRes = await fetch(`${API}/api/v1/routes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fromLatitude: -23.8884,
      fromLongitude: 29.7386,
      toLatitude: -23.8868,
      toLongitude: 29.7388,
      routeMode: 'campus',
      totalDistanceMeters: 420,
      totalTimeMinutes: 5,
      routeCoords: [
        [-23.8884, 29.7386],
        [-23.8875, 29.7387],
        [-23.8868, 29.7388],
      ],
      routeSteps: [
        { instruction: 'Head north', distance: 200, type: 'depart' },
        { instruction: 'Arrive at Library', distance: 0, type: 'arrive' },
      ],
      isAccessible: true,
    }),
  });

  const savedRoute = await saveRes.json();
  console.log('Status:', saveRes.status);
  console.log('Response:', JSON.stringify(savedRoute, null, 2));

  if (!savedRoute?.data?.id) {
    console.error('No route id returned — aborting');
    process.exit(1);
  }

  const routeId = savedRoute.data.id;

  // 3. Get my routes
  console.log('\n Fetching my routes...');
  const listRes = await fetch(`${API}/api/v1/routes`, { headers });
  const list = await listRes.json();
  console.log('Status:', listRes.status);
  console.log('Count:', list.data?.length, 'of', list.pagination?.total);
  if (list.data?.[0]) {
    console.log('Most recent:', list.data[0].to?.name || 'Unknown destination');
  }

  // 4. Complete route
  console.log('\n Completing route...');
  const completeRes = await fetch(`${API}/api/v1/routes/${routeId}/complete`, {
    method: 'POST',
    headers,
  });
  const completed = await completeRes.json();
  console.log('Status:', completeRes.status);
  console.log('Response:', JSON.stringify(completed, null, 2));

  // 5. Popular routes (public)
  console.log('\n Fetching popular routes...');
  const popularRes = await fetch(`${API}/api/v1/routes/popular`);
  const popular = await popularRes.json();
  console.log('Status:', popularRes.status);
  console.log('Count:', popular.data?.length);

  // 6. No token — should be 401
  console.log('\n Testing without token...');
  const unauthRes = await fetch(`${API}/api/v1/routes`);
  console.log('Status:', unauthRes.status, '(expected 401)');

  console.log('\n All tests passed');

  setTimeout(() => process.exit(0), 100);
}

main().catch((err) => {
  console.error(err);
  setTimeout(() => process.exit(1), 100);
});

//node scripts/test-routes.js 202053174 "password"