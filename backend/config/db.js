const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "uptown.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  id_number_encrypted TEXT NOT NULL,
  hostel_name TEXT,
  address TEXT,
  is_admin INTEGER DEFAULT 0,
  is_premium INTEGER DEFAULT 0,
  premium_code TEXT UNIQUE,
  premium_since TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS premium_payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount_kes INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  mpesa_checkout_request_id TEXT,
  mpesa_receipt TEXT,
  premium_code TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_kes INTEGER NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  available INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  items_json TEXT NOT NULL,
  total_kes INTEGER NOT NULL,
  delivery_hostel TEXT,
  delivery_address TEXT,
  delivery_notes TEXT,
  latitude REAL,
  longitude REAL,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'unpaid',
  mpesa_checkout_request_id TEXT,
  mpesa_receipt TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Defensive migration: if an older uptown.db already exists without the
// newer premium/admin columns, add them without wiping existing data.
const userColumns = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
const migrations = [
  ["is_admin", "ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0"],
  ["is_premium", "ALTER TABLE users ADD COLUMN is_premium INTEGER DEFAULT 0"],
  ["premium_code", "ALTER TABLE users ADD COLUMN premium_code TEXT"],
  ["premium_since", "ALTER TABLE users ADD COLUMN premium_since TEXT"]
];
for (const [col, sql] of migrations) {
  if (!userColumns.includes(col)) db.exec(sql);
}

const count = db.prepare("SELECT COUNT(*) as c FROM menu_items").get().c;
if (count === 0) {
  const insert = db.prepare(
    "INSERT INTO menu_items (id, name, description, price_kes, category, image_url) VALUES (@id, @name, @description, @price_kes, @category, @image_url)"
  );
  const { v4: uuid } = require("uuid");
  const items = [
    { name: "Uptown Beef Pilau", description: "Spiced basmati rice with slow-cooked beef", price_kes: 350, category: "Mains", image_url: "" },
    { name: "Nyama Choma Plate", description: "Grilled goat meat, kachumbari, ugali", price_kes: 550, category: "Mains", image_url: "" },
    { name: "Chapati Beans Combo", description: "Two chapatis with seasoned beans stew", price_kes: 200, category: "Mains", image_url: "" },
    { name: "Chicken Biryani", description: "Layered rice, spiced chicken, boiled egg", price_kes: 400, category: "Mains", image_url: "" },
    { name: "Sukuma Wiki & Ugali", description: "Sauteed collard greens, fresh ugali", price_kes: 150, category: "Mains", image_url: "" },
    { name: "Samosa (3pc)", description: "Crispy beef or vegetable samosas", price_kes: 120, category: "Snacks", image_url: "" },
    { name: "Mandazi (4pc)", description: "Soft coconut-flavoured fried bread", price_kes: 100, category: "Snacks", image_url: "" },
    { name: "Fresh Passion Juice", description: "Chilled, no added sugar", price_kes: 120, category: "Drinks", image_url: "" },
    { name: "Uptown Iced Tea", description: "House-blend spiced iced tea", price_kes: 100, category: "Drinks", image_url: "" },
    { name: "Soda 500ml", description: "Coke, Fanta or Sprite", price_kes: 80, category: "Drinks", image_url: "" }
  ];
  const tx = db.transaction((rows) => {
    for (const r of rows) insert.run({ id: uuid(), ...r });
  });
  tx(items);
}

module.exports = db;
