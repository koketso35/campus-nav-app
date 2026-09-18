// Periodic cleanup of stale guest accounts

const { supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

// How old a guest has to be before we delete them
const GUEST_RETENTION_DAYS = 1;

/**
 * Delete guest accounts older than GUEST_RETENTION_DAYS.
 * Cascades: deleting auth.users → deletes profiles → deletes favourites, feedback, etc.
 *
 * @param {object} opts
 * @param {number} [opts.olderThanDays]  - override retention
 * @param {number} [opts.batchSize]      - how many to delete per run (default 100)
 * @returns {Promise<{ scanned: number, deleted: number, failed: number }>}
 */
const cleanupStaleGuests = async ({ olderThanDays = GUEST_RETENTION_DAYS, batchSize = 100 } = {}) => {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

  logger.info(` Guest cleanup: removing guests older than ${olderThanDays} days (before ${cutoff})`);

  // 1. Find candidate guest profiles
  const { data: guests, error: selectError } = await supabaseAdmin
    .from('profiles')
    .select('id, student_number, full_name, created_at')
    .eq('role', 'guest')
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (selectError) {
    logger.error('Guest cleanup: select failed:', selectError.message);
    return { scanned: 0, deleted: 0, failed: 0 };
  }

  if (!guests || guests.length === 0) {
    logger.info('Guest cleanup: nothing to do');
    return { scanned: 0, deleted: 0, failed: 0 };
  }

  logger.info(`Guest cleanup: ${guests.length} candidate(s) found`);

  let deleted = 0;
  let failed = 0;

  for (const guest of guests) {
    try {
      // Delete the auth user — cascades to profiles and dependents
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(guest.id);

      if (deleteError) {
        // Sometimes the auth user is already gone but the profile remains
        if (/user not found/i.test(deleteError.message)) {
          logger.warn(`Guest cleanup: auth user missing for ${guest.id}, deleting profile directly`);
          await supabaseAdmin.from('profiles').delete().eq('id', guest.id);
          deleted += 1;
        } else {
          logger.warn(`Guest cleanup: failed to delete ${guest.id}: ${deleteError.message}`);
          failed += 1;
        }
      } else {
        deleted += 1;
      }
    } catch (err) {
      logger.warn(`Guest cleanup: error on ${guest.id}: ${err.message}`);
      failed += 1;
    }
  }

  logger.info(`Guest cleanup done: deleted=${deleted} failed=${failed}`);
  return { scanned: guests.length, deleted, failed };
};

module.exports = { cleanupStaleGuests, GUEST_RETENTION_DAYS };