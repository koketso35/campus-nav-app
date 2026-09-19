
/**
 * Format any date/timestamp as DD/MM/YYYY.
 * Accepts: ISO string, Date, or YYYY-MM-DD.
 * Returns: "19/09/2026" or "—" for invalid.
 */
export function formatDate(input) {
  if (!input) return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format as DD/MM/YYYY HH:MM (24-hour).
 */
export function formatDateTime(input) {
  if (!input) return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  const date = formatDate(d);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${date} ${hh}:${mm}`;
}

/**
 * Human-friendly relative time — "2 hours ago", "yesterday", "3 days ago".
 */
export function formatRelative(input) {
  if (!input) return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return "just now";
  const min = Math.round(diffSec / 60);
  if (Math.abs(min) < 60) return `${min} min ago`;
  const hours = Math.round(min / 60);
  if (Math.abs(hours) < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.round(months / 12)} y ago`;
}

/**
 * Format a number with thousands separators: 1,234
 */
export function formatNumber(n) {
  if (n == null) return "0";
  return Number(n).toLocaleString("en-ZA");
}