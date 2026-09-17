const { supabase, supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Register a new student via Supabase Auth
 */
const registerStudent = async ({ studentNumber, fullName, email, phone, password, faculty, yearOfStudy }) => {
  // 1. Create the auth user in Supabase
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, student_number: studentNumber },
  });
  if (authError) throw authError;

  // 2. Create the profile row
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authData.user.id,
      role: 'student',
      student_number: studentNumber,
      full_name: fullName,
      email,
      phone: phone || null,
      faculty: faculty || null,
      year_of_study: yearOfStudy ? parseInt(yearOfStudy, 10) : null,
    })
    .select()
    .single();
  if (profileError) throw profileError;

  return profile;
};

/**
 * Register a guest:
 * - Synthetic email so Supabase Auth can create the user
 * - Random strong password (never shown to user)
 * - Profile row with role='guest'
 * - Immediately signed in returns real JWT
 */

const registerGuest = async ({ fullName, phone, email }) => {
  const cleanName = String(fullName || '').trim();
  const cleanPhone = String(phone || '').trim();
  const cleanEmail = String(email || '').trim();

  if (!cleanName || cleanName.length < 2) {
    const e = new Error('Full name is required');
    e.status = 400;
    throw e;
  }
  if (!cleanPhone && !cleanEmail) {
    const e = new Error('Provide a phone number or email');
    e.status = 400;
    throw e;
  }

  const suffix = crypto.randomBytes(6).toString('hex');
  const syntheticEmail = `guest-${suffix}@guest.ul.internal`;
  const randomPassword = crypto.randomBytes(24).toString('base64url');

  // 1. Create Supabase auth user (synthetic email — no verification needed)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: syntheticEmail,
    password: randomPassword,
    email_confirm: true,
    user_metadata: { full_name: cleanName, role: 'guest' },
  });
  if (authError) throw authError;

  // 2. Create profile row — store REAL email in `email` (unique)
  const guestNumber = `GUEST-${suffix.toUpperCase()}`;
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authData.user.id,
      role: 'guest',
      student_number: guestNumber,
      full_name: cleanName,
      phone: cleanPhone || null,
      email: cleanEmail || null,   // ← goes into unique column now
    })
    .select()
    .single();

  if (profileError) {
    // Roll back the auth user if the profile insert fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => {});
    throw profileError;
  }

  // 3. Sign in for JWT
  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: randomPassword,
  });
  const nowIso = new Date().toISOString();
  await supabaseAdmin
    .from('profiles')
    .update({ last_login_at: nowIso })
    .eq('id', authData.user.id);

  profile.last_login_at = nowIso;

  if (signInError) throw signInError;

  return {
    accessToken: session.session.access_token,
    refreshToken: session.session.refresh_token,
    expiresAt: session.session.expires_at,
    profile,
  };
};
/**
 * Sign in existing user (student or admin) via Supabase Auth
 */
const login = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const nowIso = new Date().toISOString();
  await supabaseAdmin
    .from('profiles')
    .update({ last_login_at: nowIso })
    .eq('id', data.user.id);

  profile.last_login_at = nowIso;

  // Get profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  if (profileError) throw profileError;

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
    profile,
  };
};

/**
 * Login by student number:
 * 1. Find the profile by student number
 * 2. Get its email
 * 3. Sign in with email + password via Supabase
 */
const loginByStudentNumber = async ({ studentNumber, password, ip }) => {
  const sn = String(studentNumber || '').trim().toUpperCase();
  if (!sn || !password) {
    const e = new Error('Student number and password required');
    e.status = 400;
    throw e;
  }

  const MAX_FAILURES = 5;
  const LOCKOUT_MINUTES = 15;

  const logAttempt = async (success) => {
    try {
      await supabaseAdmin.from('login_attempts').insert({
        student_number: sn,
        ip: ip || 'unknown',
        success,
      });
    } catch (err) {
      logger.warn('[auth] Could not log login attempt:', err.message);
    }
  };

  const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString();
  const { count: recentFailures, error: countError } = await supabaseAdmin
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('student_number', sn)
    .eq('success', false)
    .gte('attempted_at', since);

  if (countError) {
    logger.warn('[auth] Could not check login attempts:', countError.message);
  }

  if ((recentFailures || 0) >= MAX_FAILURES) {
    const e = new Error(`Too many failed attempts. Please try again in ${LOCKOUT_MINUTES} minutes.`);
    e.status = 429;
    throw e;
  }

  const { data: profile, error: lookupError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, student_number')
    .eq('student_number', sn)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (!profile || !profile.email) {
    await new Promise((r) => setTimeout(r, 400));
    await logAttempt(false);
    const e = new Error('Incorrect student number or password');
    e.status = 401;
    throw e;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  // last login logic
  const nowIso = new Date().toISOString();
  await supabaseAdmin
    .from('profiles')
    .update({ last_login_at: nowIso })
    .eq('id', data.user.id);

  profile.last_login_at = nowIso;

  if (error) {
    const code = error.code || '';
    const msg = (error.message || '').toLowerCase();

    if (msg.includes('email not confirmed') || code === 'email_not_confirmed') {
      const e = new Error('Please verify your email before signing in');
      e.status = 403;
      throw e;
    }

    await logAttempt(false);
    const e = new Error('Incorrect student number or password');
    e.status = 401;
    throw e;
  }

  try {
    await supabaseAdmin
      .from('login_attempts')
      .delete()
      .eq('student_number', sn)
      .eq('success', false);
  } catch (err) {
    logger.warn('[auth] Could not clear login attempts:', err.message);
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
    profile,
  };
};


/**
 * Get current user's profile by their auth ID
 */
const getProfileById = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
};

/**
 * Sign out (revoke session)
 */
const logout = async (accessToken, userId) => {
  const { error } = await supabaseAdmin.auth.admin.signOut(accessToken);
  if (error) throw error;

  if (userId) {
    await supabaseAdmin
      .from('profiles')
      .update({ last_logout_at: new Date().toISOString() })
      .eq('id', userId);
  }
  return true;
};

module.exports = { registerStudent, registerGuest, login, loginByStudentNumber, getProfileById, logout };