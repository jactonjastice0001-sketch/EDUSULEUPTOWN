const crypto = require('crypto');
const { readTable } = require('../config/db');

// Unique premium "chit code" — always starts with P, followed by 7
// unambiguous uppercase alphanumeric characters (no 0/O/1/I, to avoid
// misreads when a customer reads it aloud or types it in).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSuffix(length = 7) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// Retries on the astronomically unlikely collision against existing users.
function generatePremiumCode() {
  const users = readTable('users');
  const taken = new Set(users.map((u) => u.premiumCode).filter(Boolean));
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `P${randomSuffix(7)}`;
    if (!taken.has(code)) return code;
  }
  throw new Error('Could not generate a unique premium code. Try again.');
}

module.exports = { generatePremiumCode };