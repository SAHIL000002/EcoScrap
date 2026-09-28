import { MATERIAL_CATEGORIES } from '../constants/theme';

// Screen 06 (Material Details) draft model.
//
// The draft mirrors exactly the fields the backend `createLotValidator`
// accepts, so Screen 06 can POST it unchanged. `category` and `condition`
// always hold backend enum values — never a translated label.

// Used only when the collector profile has no location on file and the device
// permission is refused. Coordinates are the Gorakhpur industrial area shown in
// the Stitch mock; the backend re-derives city/state from the seeded Price data.
export const FALLBACK_LOCATION = {
  city: 'Gorakhpur',
  state: 'Uttar Pradesh',
  latitude: 26.7606,
  longitude: 83.3732
};

/** Fresh idempotency key so a retried POST can never create a duplicate lot. */
export const createIdempotencyKey = (category) =>
  `kc-${category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Backend enum value -> the Stitch title/sub label pair for the chosen card. */
export const categoryLabels = (categoryId, t) => {
  const found = MATERIAL_CATEGORIES.find((item) => item.id === categoryId);
  if (!found) {
    return { title: categoryId || '', sub: '', emoji: '♻️' };
  }
  return {
    title: t[found.titleKey] || found.id,
    sub: t[found.subKey] || '',
    emoji: found.emoji
  };
};

/**
 * Builds a blank Screen 06 draft for a freshly chosen material category.
 * Pre-fills the collector's own city/state so the very first render already
 * shows a meaningful location card.
 */
export const buildLotDraft = (category, user = null) => {
  const profileLocation = user?.location || {};

  return {
    category,
    photoUri: null,
    approxWeight: null,
    weightUnit: 'KG',
    condition: 'USED',
    sourceType: 'HOUSEHOLD',
    city: profileLocation.city || FALLBACK_LOCATION.city,
    state: profileLocation.state || FALLBACK_LOCATION.state,
    address: '',
    latitude:
      typeof profileLocation.latitude === 'number' ? profileLocation.latitude : FALLBACK_LOCATION.latitude,
    longitude:
      typeof profileLocation.longitude === 'number' ? profileLocation.longitude : FALLBACK_LOCATION.longitude,
    idempotencyKey: createIdempotencyKey(category)
  };
};

/**
 * Parses a numeric text input ("12.5") into a positive number.
 * Returns null when the text is not a usable weight.
 */
export const parseWeight = (text) => {
  const normalised = String(text ?? '').replace(/[^0-9.]/g, '');
  if (!normalised || normalised === '.') return null;
  const num = Number(normalised);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num * 100) / 100;
};

/** "12.5" / "" for the weight TextInput, so the field never shows "12.5.0". */
export const weightInputValue = (weight) => {
  const num = Number(weight);
  return Number.isFinite(num) && num > 0 ? String(num) : '';
};
