const crypto = require('crypto');

/**
 * Generate human readable IDs with year and sequential/random component
 * e.g., KC-2026-000001, TXN-2026-000001, KCH-2026-000001, REC-2026-000001, USR-2026-000001
 */
const generateFormattedId = (prefix) => {
  const year = new Date().getFullYear();
  // 6 digit zero padded random number
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${randomNum}`;
};

const generateLotId = () => generateFormattedId('KC');
const generateTransactionId = () => generateFormattedId('TXN');
const generateHandoverReference = () => generateFormattedId('KCH');
const generateUserId = () => generateFormattedId('USR');
const generateRecyclerId = () => generateFormattedId('REC');

module.exports = {
  generateFormattedId,
  generateLotId,
  generateTransactionId,
  generateHandoverReference,
  generateUserId,
  generateRecyclerId
};
