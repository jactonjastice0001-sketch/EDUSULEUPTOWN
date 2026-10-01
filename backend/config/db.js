const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./paths');

// Table name -> JSON filename. Add new tables here as the app grows.
const TABLES = {
  users: 'users.json',
  menu: 'menu.json',
  orders: 'orders.json',
  premiumPayments: 'premiumPayments.json',
};

function filePathFor(table) {
  const filename = TABLES[table];
  if (!filename) throw new Error(`Unknown table: ${table}`);
  return path.join(DATA_DIR, filename);
}

// Creates the data directory and any missing table files (as empty arrays)
// on first boot. Safe to call every startup — never overwrites existing data.
function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  for (const filename of Object.values(TABLES)) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf8');
    }
  }
}

function readTable(table) {
  const filePath = filePathFor(table);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function writeTable(table, rows) {
  const filePath = filePathFor(table);
  fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf8');
}

module.exports = { ensureStore, readTable, writeTable };