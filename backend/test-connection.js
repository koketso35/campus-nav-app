
// Test Supabase connection

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Log environment variables (partially hidden for security)
console.log('Environment Variables Check');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing');
console.log('');

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Test 1: Basic Connection
const testBasicConnection = async () => {
  console.log('Test 1: Basic Connection');
  try {
    // Try to fetch data from places table
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Connection failed:', error.message);
      return false;
    }

    console.log('Successfully connected to Supabase!');
    console.log('Sample data:', data);
    console.log('');
    return true;
  } catch (error) {
    console.error('Connection error:', error.message);
    return false;
  }
};

// Test 2: Check if tables exist
const testTablesExist = async () => {
  console.log('Test 2: Check Tables');
  const tables = [
    'profiles',
    'places',
    'events',
    'favourites',
    'route_history',
    'feedback',
    'app_sessions',
    'search_history'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.log(`${table}: Table not found or no access`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`${table}: Table exists and accessible`);
      }
    } catch (error) {
      console.log(`${table}: Error checking table`);
      console.log(`   Error: ${error.message}`);
    }
  }
  console.log('');
};

// Test 3: Check sample data
const testSampleData = async () => {
  console.log('Test 3: Check Sample Data');
  
  try {
    // Check places
    const { data: places, error: placesError } = await supabase
      .from('places')
      .select('id, name, category')
      .limit(5);

    if (placesError) {
      console.error('Error fetching places:', placesError.message);
    } else {
      console.log(`Places found: ${places.length}`);
      places?.forEach(place => {
        console.log(`   - ${place.name} (${place.category})`);
      });
    }

    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_date')
      .limit(5);

    if (eventsError) {
      console.error('Error fetching events:', eventsError.message);
    } else {
      console.log(`Events found: ${events.length}`);
      events?.forEach(event => {
        console.log(`   - ${event.title} (${event.event_date})`);
      });
    }
  } catch (error) {
    console.error('Error checking sample data:', error.message);
  }
  console.log('');
};

// Test 4: Check auth configuration
const testAuth = async () => {
  console.log('Test 4: Auth Configuration');
  try {
    // Try to get session (should be null if not authenticated)
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error(' Auth error:', error.message);
    } else {
      console.log('Auth is configured correctly');
      console.log(`   Current session: ${session ? 'Active' : 'None (expected)'}`);
    }
  } catch (error) {
    console.error('Auth configuration error:', error.message);
  }
  console.log('');
};

// Test 5: Test RLS policies
const testRLS = async () => {
  console.log('Test 5: RLS Policies');
  
  // Test public access to places
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .limit(1);

    if (error) {
      console.log(' Places: Public access failed');
      console.log(`   Error: ${error.message}`);
    } else {
      console.log('Places: Public access works');
    }
  } catch (error) {
    console.log('Places: Public access error:', error.message);
  }

  // Test protected access (should fail without auth)
  try {
    const { data, error } = await supabase
      .from('favourites')
      .select('*')
      .limit(1);

    if (error) {
      console.log('Favourites: Protected as expected (requires auth)');
    } else {
      console.log('Favourites: Unprotected (might need RLS fix)');
    }
  } catch (error) {
    console.log('Favourites: Error:', error.message);
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('Starting Supabase Connection Tests\n');
  
  const connected = await testBasicConnection();
  
  if (connected) {
    await testTablesExist();
    await testSampleData();
    await testAuth();
    await testRLS();
  }
  
  console.log('Test Summary');
  console.log(connected ? 'Connection successful' : 'Connection failed');
  console.log('\nNext steps:');
  console.log('1. If all tests pass, your API is ready to use');
  console.log('2. Start the API with: npm run dev');
  console.log('3. Test the API endpoint: GET http://localhost:3000/health');
};

runAllTests();