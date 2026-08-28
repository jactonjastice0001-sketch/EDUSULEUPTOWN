const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { readTable, writeTable } = require('../config/db');
const { encrypt } = require('./crypto');

// Creates the admin account from .env on first boot if one doesn't exist yet.
// Idempotent — safe to call on every server start.
async function seedAdmin() {
  const phone = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;
  if (!phone || !password) {
    console.warn('ADMIN_PHONE / ADMIN_PASSWORD not set — skipping admin seed. Set them in .env to create an admin account.');
    return;
  }

  const users = readTable('users');
  const alreadyExists = users.some((u) => u.isAdmin);
  if (alreadyExists) return;

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = {
    id: uuid(),
    fullName: process.env.ADMIN_FULL_NAME || 'UP TOWN Admin',
    email: process.env.ADMIN_EMAIL || 'admin@uptown.local',
    phone,
    idNumberEncrypted: encrypt('00000000'),
    hostelName: 'UP TOWN HQ',
    address: 'UP TOWN HQ',
    passwordHash,
    isAdmin: true,
    createdAt: new Date().toISOString(),
  };

  users.push(admin);
  writeTable('users', users);
  console.log(`Admin account seeded for phone ${phone}. Log in at /login to access /admin.`);
}

module.exports = { seedAdmin };
