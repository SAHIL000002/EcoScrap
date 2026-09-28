// Display-only formatting helpers shared by the Stitch screens.
//
// Intl / toLocaleString cannot be relied on across every Hermes build, so the
// Indian digit grouping (1,23,456) is implemented explicitly. Nothing here
// computes business values — all money values come from the backend.

/**
 * Indian-grouped integer string, e.g. 3500 -> "3,500", 123456 -> "1,23,456".
 * Non-finite / empty input renders as "0".
 */
export const formatAmount = (value) => {
  const num = Math.round(Number(value));
  if (!Number.isFinite(num)) return '0';

  const negative = num < 0;
  const digits = String(Math.abs(num));

  let grouped;
  if (digits.length <= 3) {
    grouped = digits;
  } else {
    const last3 = digits.slice(-3);
    const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    grouped = `${rest},${last3}`;
  }

  return negative ? `-${grouped}` : grouped;
};

/** "₹3,500" */
export const formatRupees = (value) => `₹${formatAmount(value)}`;

/**
 * Weight display. Backend sends the numeric weight plus the unit enum
 * (KG / PIECE / TON), so 12.5 + 'KG' renders as "12.5 KG".
 */
export const formatWeight = (weight, unit = 'KG') => {
  const num = Number(weight);
  if (!Number.isFinite(num)) return `— ${unit}`;
  const rounded = Math.round(num * 100) / 100;
  return `${rounded} ${unit}`;
};

/** "4.2 km दूर" style distance, or null when the backend has no coordinates. */
export const formatDistance = (distanceKm) => {
  const num = Number(distanceKm);
  if (!Number.isFinite(num)) return null;
  return num < 1 ? `${Math.round(num * 1000)} m` : `${num.toFixed(1)} km`;
};

/** "26 Sep" / "26 Sep 2026" short date used by the price-trend chart. */
export const formatShortDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[date.getMonth()]}`;
};

/** "Today 11:30 AM" — used for the mandi-rate freshness line. */
export const formatClock = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const hours24 = date.getHours();
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} ${suffix}`;
};

/** Last 5 characters of an id, used where a full Mongo id would overflow. */
export const shortId = (value, length = 5) => {
  const str = value ? String(value) : '';
  return str.length <= length ? str : str.slice(-length);
};
