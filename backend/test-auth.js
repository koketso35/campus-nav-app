// Bypass PowerShell quoting — test auth endpoints directly

require('dotenv').config();

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function testAuth() {
  console.log('🧪 Testing Campus Navigation Auth\n');
  console.log('API:', BASE_URL);
  console.log('='.repeat(50) + '\n');

  // Use a unique email each run so we don't hit "already exists"
  const uniqueEmail = `test${Date.now()}@ul.ac.za`;
  const password = 'Test@2026';

  const registerPayload = {
    studentNumber: `2020${Math.floor(10000 + Math.random() * 89999)}`,
    fullName: 'Test Student',
    email: uniqueEmail,
    phone: '0712345678',
    password,
    confirmPassword: password,
    faculty: 'Science & Agriculture',
    yearOfStudy: '2',
  };

  // ─────────────────────────────────────────────
  // TEST 1: Register
  // ─────────────────────────────────────────────
  console.log('📝 TEST 1: Register');
  console.log('-'.repeat(50));
  console.log('Sending:', JSON.stringify(registerPayload, null, 2));
  console.log('');

  let accessToken = null;

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload),
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (!res.ok || !data.success) {
      console.log('\n❌ Register failed. Stopping here.');
      return;
    }

    accessToken = data.data?.accessToken;
    console.log('\n✅ Register succeeded\n');
  } catch (err) {
    console.error('❌ Network error:', err.message);
    console.log('   Is the server running? Try: npm run dev');
    return;
  }

  // ─────────────────────────────────────────────
  // TEST 2: Login
  // ─────────────────────────────────────────────
  console.log('🔑 TEST 2: Login');
  console.log('-'.repeat(50));

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerPayload.email,
        password: registerPayload.password,
      }),
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (res.ok && data.success) {
      accessToken = data.data?.accessToken || accessToken;
      console.log('\n✅ Login succeeded\n');
    } else {
      console.log('\n❌ Login failed\n');
    }
  } catch (err) {
    console.error('❌ Network error:', err.message);
  }

  // ─────────────────────────────────────────────
  // TEST 3: Get current user (/me)
  // ─────────────────────────────────────────────
  console.log('👤 TEST 3: Get current user (/me)');
  console.log('-'.repeat(50));

  if (!accessToken) {
    console.log('⚠️  Skipped — no access token from previous tests\n');
  } else {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();
      console.log('Status:', res.status);
      console.log('Response:', JSON.stringify(data, null, 2));

      if (res.ok && data.success) {
        console.log('\n✅ Auth flow complete — everything works!\n');
      } else {
        console.log('\n❌ /me failed\n');
      }
    } catch (err) {
      console.error('❌ Network error:', err.message);
    }
  }

  // ─────────────────────────────────────────────
  // TEST 4: Reject bad token
  // ─────────────────────────────────────────────
  console.log('🚫 TEST 4: Reject invalid token');
  console.log('-'.repeat(50));

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: 'Bearer this-is-not-a-real-token' },
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (res.status === 401) {
      console.log('\n✅ Invalid tokens correctly rejected\n');
    } else {
      console.log('\n⚠️  Expected 401 for bad token\n');
    }
  } catch (err) {
    console.error('❌ Network error:', err.message);
  }

  // ─────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────
  console.log('='.repeat(50));
  console.log('📊 Summary');
  console.log('='.repeat(50));
  console.log('Email used:  ', registerPayload.email);
  console.log('Password:    ', password);
  console.log('Student No:  ', registerPayload.studentNumber);
  console.log('\nNext steps:');
  console.log('1. Check Supabase → Authentication → Users');
  console.log('2. Check Supabase → Table Editor → profiles');
  console.log('3. If both have rows → auth is solid, you can deploy.');
}

testAuth().catch((err) => {
  console.error('💥 Test crashed:', err);
  process.exit(1);
});