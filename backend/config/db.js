// Lightweight file-backed JSON store.
// Swappable for Postgres/Mongo later — every call here is async on purpose,
// so the storage layer can be replaced without touching routes/controllers.
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./paths');

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  menu: path.join(DATA_DIR, 'menu.json'),
};

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const [name, file] of Object.entries(FILES)) {
    if (!fs.existsSync(file)) {
      // Menu gets seeded with the starter dishes; everything else starts empty.
      // Matters on a fresh Render persistent disk, which has no files at all yet.
      if (name === 'menu') {
        const seedPath = path.join(__dirname, '..', 'menu.seed.json');
        const seed = fs.existsSync(seedPath) ? fs.readFileSync(seedPath, 'utf-8') : '[]';
        fs.writeFileSync(file, seed, 'utf-8');
      } else {
        fs.writeFileSync(file, '[]', 'utf-8');
      }
    }
  }
}

function readTable(name) {
  ensureStore();
  const raw = fs.readFileSync(FILES[name], 'utf-8');
  try {
    return JSON.parse(raw || '[]');
  } catch {
    return [];
  }
}

function writeTable(name, records) {
  ensureStore();
  fs.writeFileSync(FILES[name], JSON.stringify(records, null, 2), 'utf-8');
}

module.exports = { readTable, writeTable, ensureStore, FILES };
