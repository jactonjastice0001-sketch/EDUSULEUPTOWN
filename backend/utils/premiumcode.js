const crypto = require("crypto");
const db = require("../db");

// Unique premium "chit code" — starts with P, followed by 7 unambiguous
// uppercase alphanumeric characters (no 0/O/1/I to avoid misreads).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSuffix(length = 7) {
  let out = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

// Generates a code guaranteed unique against the users table (retries on
// the astronomically unlikely collision).
function generatePremiumCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `P${randomSuffix(7)}`;
    const existing = db.prepare("SELECT id FROM users WHERE premium_code = ?").get(code);
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique premium code. Try again.");
}

module.exports = { generatePremiumCode };
