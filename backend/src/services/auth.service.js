const { supabase, supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

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
 * Sign in existing user (student or admin) via Supabase Auth
 */
const login = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Get profile
  const { data: profile, error: profileError } = await supabase
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
 * Get current user's profile by their auth ID
 */
const getProfileById = async (userId) => {
  const { data, error } = await supabase
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
const logout = async (accessToken) => {
  const { error } = await supabase.auth.admin.signOut(accessToken);
  if (error) throw error;
  return true;
};

module.exports = { registerStudent, login, getProfileById, logout };