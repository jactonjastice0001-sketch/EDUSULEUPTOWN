const crypto = require('crypto');

const ALGO = 'aes-256-gcm';

function getKey() {
  const hex = process.env.ID_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'ID_ENCRYPTION_KEY must be a 32-byte (64 hex char) key. See .env.example.'
    );
  }
  return Buffer.from(hex, 'hex');
}

// Encrypts a plaintext string into "iv:authTag:ciphertext" (all hex).
function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf-8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), ciphertext.toString('hex')].join(':');
}

function decrypt(payload) {
  const [ivHex, tagHex, dataHex] = String(payload).split(':');
  if (!ivHex || !tagHex || !dataHex) throw new Error('Malformed encrypted payload');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return plaintext.toString('utf-8');
}

// Never send a full ID number to the client — mask everything but the last 4 chars.
function maskId(idNumber) {
  const s = String(idNumber);
  if (s.length <= 4) return '*'.repeat(s.length);
  return '*'.repeat(s.length - 4) + s.slice(-4);
}

module.exports = { encrypt, decrypt, maskId };
