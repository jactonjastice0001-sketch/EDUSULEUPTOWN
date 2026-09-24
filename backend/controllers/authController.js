const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { readTable, writeTable } = require('../config/db');
const { encrypt, decrypt, maskId } = require('../utils/crypto');
const { signToken } = require('../utils/jwt');

function toPublicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    hostelName: user.hostelName,
    address: user.address,
    idNumberMasked: maskId(decrypt(user.idNumberEncrypted)),
    isAdmin: Boolean(user.isAdmin),
    isPremium: Boolean(user.isPremium),
    premiumCode: user.isPremium ? user.premiumCode : null,
    premiumSince: user.premiumSince || null,
    createdAt: user.createdAt,
  };
}

function normalizePhone(phone) {
  // Store consistently as 07XXXXXXXX / 01XXXXXXXX
  if (phone.startsWith('+254')) return '0' + phone.slice(4);
  return phone;
}

async function register(req, res, next) {
  try {
    const { fullName, email, phone, idNumber, hostelName, address, password } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const users = readTable('users');

    if (users.some((u) => u.phone === normalizedPhone)) {
      return res.status(409).json({ error: 'An account with this phone number already exists.' });
    }
    if (users.some((u) => u.email === email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = {
      id: uuid(),
      fullName,
      email,
      phone: normalizedPhone,
      idNumberEncrypted: encrypt(idNumber), // never store plaintext
      hostelName,
      address,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    writeTable('users', users);

    const token = signToken(user);
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { phone, password } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const users = readTable('users');
    const user = users.find((u) => u.phone === normalizedPhone);

    // Same generic message whether phone or password is wrong — avoids user enumeration.
    if (!user) return res.status(401).json({ error: 'Invalid phone number or password.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid phone number or password.' });

    const token = signToken(user);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    res.json({ user: toPublicUser(req.user) });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { fullName, hostelName, address } = req.body;
    const users = readTable('users');
    const idx = users.findIndex((u) => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found.' });

    if (fullName) users[idx].fullName = String(fullName).trim();
    if (hostelName) users[idx].hostelName = String(hostelName).trim();
    if (address) users[idx].address = String(address).trim();

    writeTable('users', users);
    res.json({ user: toPublicUser(users[idx]) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, updateProfile, toPublicUser, normalizePhone };
